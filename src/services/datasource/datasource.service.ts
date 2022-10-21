import {
  delay,
  delayWhen,
  filter,
  forkJoin,
  map,
  mergeMap,
  Observable,
  of,
  retryWhen,
  switchMap,
  take,
  timer,
} from "rxjs";
import { generalConfigurations } from "src/configurations";
import { GlobalModel } from "src/models/global.model";
import { EnsService } from "../ens";
import * as https from "https";
import { LogService } from "../log";
import { SQLService } from "../sql";
import * as fs from "fs";
import * as path from "path";
import { CategoryDataModel } from "src/components/modules/domains/models";
import { Modules } from "src/configurations/modules.conf";
import { TaskTimingEnum } from "src/models/task";

const globalAny: GlobalModel = global as any;
export interface DataPacketModel {
  key: string;
  data: any;
}

export class DataSourceService {
  data: { [id: string]: any } = {};
  constructor(
    protected sqlService: SQLService = globalAny.predomain.services.sqlService,
    protected logService: LogService = globalAny.predomain.services.logService,
    protected ensService: EnsService = globalAny.predomain.services.ensService
  ) {
    this.sqlService.isDBReady$
      .pipe(
        filter((r) => {
          if (r === false) {
            return false;
          }
          return true;
        }),
        switchMap((r) => {
          return this.fetchData();
        })
      )
      .subscribe();
  }

  fetchData() {
    this.logService.print("Fetching data source contents...");
    const additionalSchema = {};
    const trackingSchema = Object.values(TaskTimingEnum);
    Modules.map((m) => {
      const modulePrototype = m.module;
      if (modulePrototype.prototype.moduleDbSchema === null) {
        return;
      }
      additionalSchema[modulePrototype.prototype.moduleDbSchema.key] = {
        ...modulePrototype.prototype.moduleDbSchema.figures,
        ...{
          ...trackingSchema.reduce(
            (a, v) => ({ ...a, [v]: new Date().getTime() }),
            {}
          ),
        },
      };
    });
    return this.getDataSources().pipe(
      mergeMap((r) => {
        if ((r as any) === false || r === null) {
          return of(false);
        }
        const dataPackets = r as any as DataPacketModel;
        const dataSet = JSON.parse(dataPackets.data);
        this.data[dataPackets.key] = dataSet;
        this.logService.print(
          "Loaded data collection source from: " + dataPackets.key
        );
        const dataWithValues =
          Array.isArray(dataSet.valid_names) === true
            ? null
            : this.gataDataByValueFromSourceConent(dataSet.valid_names);
        const dataSetToUpsert =
          dataSet.patterned === true
            ? dataSet
            : {
                ...dataSet,
                optimised: this.optimiseDataSourceContent(
                  dataWithValues !== null ? dataWithValues : dataSet.valid_names
                ),
              };
        return this.sqlService
          .update(
            "collections",
            { id: dataPackets.key },
            {
              $setOnInsert: {
                id: dataPackets.key,
                ...dataSetToUpsert,
                ...additionalSchema,
              },
            },
            true
          )
          .pipe(
            switchMap((i) => {
              if (i === false || i === null) {
                return of(false);
              }
              return of(dataPackets.key);
            })
          );
      }),
      map((r) => {
        if (r === false || r === null) {
          return;
        }
        this.logService.print("Source data stored for: " + r);
      })
    );
  }

  getDataSourcesFromFallback() {
    const directoryPath = path.join(__dirname, "../../metadata");
    const dirFiles = fs.readdirSync(directoryPath);
    const dataSoures = dirFiles
      .map((file) => {
        if (file === "root.json") {
          return undefined;
        }
        const dataSoureContentPath = path.join(directoryPath, file);
        const dataSoureContent = fs.readFileSync(dataSoureContentPath, "utf-8");
        const dataParsed = JSON.parse(dataSoureContent) as CategoryDataModel;
        return of({
          key:
            dataParsed.category +
            "." +
            generalConfigurations.dataCollectionSource +
            "." +
            generalConfigurations.dateSourceCore,
          data: dataSoureContent,
        } as DataPacketModel);
      })
      .filter((r) => r !== undefined);
    return of(true).pipe(
      mergeMap((r) => {
        return forkJoin(dataSoures);
      }),
      switchMap((r) => r)
    );
  }

  getDataSources() {
    const provider = generalConfigurations.provider;
    if (generalConfigurations.dataSourceUseFallback === true) {
      return this.getDataSourcesFromFallback();
    }
    return of(generalConfigurations.dataSourceEndpoints).pipe(
      mergeMap((r) => {
        let subCount = 0;
        const subdomainsData = r.map((sd) => {
          subCount++;
          let retries = 0;
          return of(1).pipe(
            delay(500 * subCount),
            switchMap((d) => {
              return this.getDataSourceHash(
                provider,
                sd +
                  "." +
                  generalConfigurations.dataCollectionSource +
                  "." +
                  generalConfigurations.dateSourceCore
              );
            }),
            switchMap((sdh) => {
              if (sdh === false || sdh === null) {
                throw false;
              }
              return this.getSourceData(sdh as string);
            }),
            switchMap((sdh) => {
              if (sdh === false || sdh === null) {
                throw false;
              }
              return of({
                key:
                  sd +
                  "." +
                  generalConfigurations.dataCollectionSource +
                  "." +
                  generalConfigurations.dateSourceCore,
                data: sdh,
              } as DataPacketModel);
            }),
            retryWhen((error) =>
              error.pipe(
                take(generalConfigurations.maxDataSourceRetrieveRetries),
                delayWhen((e) => {
                  if (
                    retries >=
                    generalConfigurations.maxDataSourceRetrieveRetries - 1
                  ) {
                    return of(false);
                  }
                  this.logService.print(
                    "Failed to resolve data source for " +
                      sd +
                      "." +
                      generalConfigurations.dataCollectionSource +
                      "." +
                      generalConfigurations.dateSourceCore +
                      ", retrying..."
                  );
                  retries++;
                  return timer(
                    generalConfigurations.timeUntilDataSourceCheckoutTimeout
                  );
                })
              )
            )
          );
        });
        return forkJoin(subdomainsData);
      }),
      switchMap((r) => {
        return r;
      })
    );
  }

  getDataSourceHash(provider: any, dataSource: string) {
    return new Observable((observer) => {
      (provider as any)
        .getResolver(dataSource)
        .then((resolver) => {
          if (resolver === false || resolver === null) {
            throw false;
          }
          return resolver.getContentHash();
        })
        .then((r) => {
          if (r === false || r === null) {
            throw false;
          }
          this.logService.print(
            "Data source URI found for (" + dataSource + "): " + r
          );
          let web2Link = "https://";
          if (r.indexOf("ipfs:") > -1) {
            web2Link += "ipfs.io/ipfs/" + r.replace("ipfs://", "");
          } else if (r.indexOf("ipns:") > -1) {
            web2Link += "gateway.ipfs.io/ipns/" + r.replace("ipns://", "");
          }
          observer.next(web2Link);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getSourceData(hash: string) {
    return new Observable((observer) => {
      https.get(hash, (r) => {
        if (r.statusCode !== 200) {
          observer.next(false);
          observer.complete();
          return;
        }
        const chunks = [];
        r.on("readable", () => {
          let chunk;
          while (null !== (chunk = r.read())) {
            chunks.push(chunk);
          }
        });
        r.on("end", () => {
          const content = chunks.join("");
          observer.next(content);
          observer.complete();
        });
      });
    });
  }

  optimiseDataSourceContent(data: string[]) {
    let optimised = {};
    for (const s of data) {
      const firstChar = s.charAt(0);
      const secondChar = s.charAt(1);
      if (firstChar in optimised === false) {
        optimised[firstChar] = {};
      }
      if (secondChar in optimised[firstChar] === false) {
        optimised[firstChar][secondChar] = [];
      }
      optimised[firstChar][secondChar].push(s);
    }
    return optimised;
  }

  gataDataByValueFromSourceConent(data: any) {
    return Object.keys(data).map((d) => data[d]);
  }
}
