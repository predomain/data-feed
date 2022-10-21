import * as fs from "fs";
import {
  catchError,
  delay,
  filter,
  forkJoin,
  from,
  interval,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  take,
} from "rxjs";
import { generalConfigurations } from "src/configurations";
import { GlobalModel } from "src/models/global.model";
import { LogService } from "src/services/log";
import { SQLService } from "src/services/sql";
import { DomainsService } from "../domains/domains.service";
import { ModuleBase } from "../module.base";
import { volumeCheckConf } from "../volume-check";
import { marketplaceData } from "../volume-check/marketplace-data.conf";
import {
  marketplaceContractsDataModel,
  SaleDiscoveredModel,
} from "../volume-check/models";
import { historicalCheckConf } from "./historical.conf";

const globalAny: GlobalModel = global as any;

export class HistoricalCheckModule implements ModuleBase {
  moduleName = "historicalCheck";
  isModuleReady = false;
  blockCheckLogFile = "dump/block-check.log";
  taskLock = false;
  outsideTaskLock = false;
  marketplaceAddresses = marketplaceData.map((m) =>
    m.marketplaceAddress.toLowerCase()
  );
  lastBlockCheck;
  taskFrequency;

  constructor(
    protected taskFrq,
    protected sqlService: SQLService = globalAny.predomain.services.sqlService,
    protected logService: LogService = globalAny.predomain.services.logService,
    protected domainsService: DomainsService = globalAny.predomain.services
      .domainsService
  ) {
    this.taskFrequency = taskFrq;
  }

  start() {
    const provider = generalConfigurations.provider;
    from(provider.getBlockNumber())
      .pipe(
        take(1),
        switchMap((r) => {
          return this.resolveLastBlockCheck().pipe(
            switchMap((b) => {
              return of([r, b]);
            })
          );
        }),
        switchMap((r: any) => {
          const [blockNumber, lastBlockNumber] = r;
          this.logService.print("Historical Checker module initialised...");
          if (lastBlockNumber === false) {
            fs.writeFileSync(this.blockCheckLogFile, blockNumber.toString());
            this.isModuleReady = true;
            this.lastBlockCheck = blockNumber;
          } else {
            this.isModuleReady = true;
            this.lastBlockCheck = lastBlockNumber;
          }
          return this.performOutsideTask();
        })
      )
      .subscribe();
  }

  performTask() {
    return of(true).pipe(
      filter((r) => {
        if (this.taskLock === true || this.sqlService.isDBReady === false) {
          return false;
        }
        this.taskLock = true;
        return true;
      }),
      switchMap((r) => {
        return this.task();
      }),
      map((r) => {
        this.taskLock = false;
      })
    );
  }

  task() {
    return of(true);
  }

  performOutsideTask() {
    return interval(100).pipe(
      filter((r) => {
        if (
          this.outsideTaskLock === true ||
          this.sqlService.isDBReady === false
        ) {
          return false;
        }
        this.outsideTaskLock = true;
        return true;
      }),
      switchMap((r) => {
        return this.outsideZone();
      }),
      map((r) => {
        this.outsideTaskLock = false;
      })
    );
  }

  outsideZone() {
    const provider = generalConfigurations.provider;
    if (
      this.isModuleReady === false ||
      this.volumeDataCheckModule === false ||
      this.lastBlockCheck <= historicalCheckConf.endCheckOnBlock
    ) {
      return of(true);
    }
    let toResolve = 0;
    let hasResolved = 0;
    return from(provider.getBlockWithTransactions(this.lastBlockCheck)).pipe(
      mergeMap((r) => {
        const validTransactions = r.transactions.filter(
          (t) =>
            "to" in t === true &&
            t.to !== null &&
            t.data.indexOf(
              volumeCheckConf.ensRegistrarAddress.substring(2).toLowerCase()
            ) > -1 &&
            this.marketplaceAddresses.includes(t.to.toLowerCase()) === true
        );
        if (validTransactions.length <= 0) {
          this.lastBlockCheck--;
          this.writeLastBlockCheck();
          return of(true);
        }
        toResolve = validTransactions.length;
        const getTxReceipts = validTransactions.map((v) => {
          let txData;
          return from(provider.getTransactionReceipt(v.hash)).pipe(
            switchMap((t) =>
              of({ ...t, tx: v, timestamp: r.timestamp * 1000 })
            ),
            switchMap((t) => {
              txData = t;
              const domainsInLog =
                this.volumeDataCheckModule.getDomainsInLog(t);
              return of(domainsInLog);
            }),
            mergeMap((t: any) => {
              if (t === false || t === null || t.length <= 0) {
                throw false;
              }
              if (t === null) {
                throw "Domain ID resolution failed.";
              }
              const marketplaceFilter = marketplaceContractsDataModel.filter(
                (m) => m.address === v.to.toLowerCase()
              )[0];
              const domainsToCheck = t.map((d) => {
                return from(this.volumeDataCheckModule.getDomain(d)).pipe(
                  switchMap((domainData) => {
                    const getDomainSale = this.volumeDataCheckModule.assessSale(
                      marketplaceFilter,
                      txData,
                      domainData
                    );
                    return of(getDomainSale);
                  }),
                  switchMap((saleData) => {
                    if (saleData === false || saleData === null) {
                      throw false;
                    }
                    return this.volumeDataCheckModule.assessSaleCategory(
                      saleData as SaleDiscoveredModel
                    );
                  }),
                  catchError((e) => {
                    return of(false);
                  })
                );
              });
              return forkJoin(domainsToCheck);
            }),
            switchMap((t) => {
              hasResolved++;
              if (hasResolved >= toResolve) {
                this.lastBlockCheck--;
              }
              return of(true);
            }),
            catchError((e) => {
              hasResolved++;
              if (hasResolved >= toResolve) {
                this.lastBlockCheck--;
              }
              return of(true);
            })
          );
        });
        this.writeLastBlockCheck();
        return forkJoin(getTxReceipts);
      }),
      catchError((e) => {
        return of(false);
      })
    );
  }

  resolveLastBlockCheck() {
    return new Observable((observer) => {
      try {
        const blockCheckLog = fs.readFileSync(this.blockCheckLogFile);
        observer.next(parseInt(blockCheckLog.toString()));
        observer.complete();
      } catch (e) {
        observer.next(false);
        observer.complete();
      }
    });
  }

  writeLastBlockCheck() {
    fs.writeFileSync(this.blockCheckLogFile, this.lastBlockCheck.toString());
  }

  get volumeDataCheckModule() {
    if (globalAny.predomain.modules === undefined) {
      return false;
    }
    const modules = globalAny.predomain.modules.filter(
      (m) => m.moduleName === "volumeCheck"
    );
    if (modules.length <= 0) {
      return false;
    }
    return modules[0];
  }

  get moduleDbSchema() {
    return historicalCheckConf.dataFigures;
  }
}
