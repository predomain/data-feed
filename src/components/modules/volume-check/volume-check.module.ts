import { ethers } from "ethers";
import {
  catchError,
  delay,
  delayWhen,
  filter,
  forkJoin,
  from,
  map,
  mergeMap,
  Observable,
  of,
  retryWhen,
  switchMap,
  take,
  timer,
  withLatestFrom,
} from "rxjs";
import * as lodash from "lodash";
import { ModuleBase } from "../module.base";
import { request, gql } from "graphql-request";
import { volumeCheckConf } from "./volume-check.conf";
import { marketplaceContractsDataModel } from "./models/marketplace-contracts-data.model";
import { marketplaceData } from "./marketplace-data.conf";
import { generalConfigurations } from "src/configurations";
import { LogService } from "src/services/log";
import { GlobalModel } from "src/models/global.model";
import { SQLService } from "src/services/sql";
import { DomainsService } from "../domains/domains.service";
import { EnsDomainModel } from "src/models/ens";
import { SaleDiscoveredModel } from "./models";
import { TaskTimingEnum, TaskTimingModel } from "src/models/task";
import { CategoryDataModel } from "../domains/models";

const globalAny: GlobalModel = global as any;

export class VolumeCheckModule implements ModuleBase {
  moduleName = "volumeCheck";
  taskLock = false;
  taskFrequency;
  taskTracking = {
    [TaskTimingEnum.MINUTELY]: 0,
    [TaskTimingEnum.HOURLY]: 0,
    [TaskTimingEnum.DAILY]: 0,
    [TaskTimingEnum.WEEKLY]: 0,
    [TaskTimingEnum.MONTHLY]: 0,
    [TaskTimingEnum.ANNUALLY]: 0,
  };

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
    this.resolveLastTrackingPoints();
    this.resolveRootVolumeCollection();
  }

  resolveRootVolumeCollection() {
    this.sqlService
      .findAll("root_volume")
      .pipe(
        take(1),
        switchMap((r) => {
          return from(
            r
              .map((cc) => {
                return cc;
              })
              .toArray()
          );
        }),
        switchMap((r) => {
          if (r.length === 0) {
            return this.sqlService
              .insert("root_volume", volumeCheckConf.rootVolumeDataFigure)
              .pipe(
                switchMap((ir) => {
                  return of([ir, volumeCheckConf.rootVolumeDataFigure]);
                })
              );
          }
          return of([true, r[0]]);
        }),
        map((r) => {
          const [retrieveSucceded, dataFiguers] = r;
          if (retrieveSucceded === false) {
            throw false;
          }
          return of(true);
        }),
        retryWhen((error) =>
          error.pipe(
            take(generalConfigurations.maxDataSourceRetrieveRetries),
            delayWhen((e) => {
              this.logService.print(
                "Failed to resolve collection source for root_volume, retrying..."
              );
              return timer(
                generalConfigurations.timeUntilDataSourceCheckoutTimeout
              );
            })
          )
        )
      )
      .subscribe();
  }

  resolveLastTrackingPoints() {
    this.sqlService
      .findAll("collections")
      .pipe(
        take(1),
        switchMap((r) => {
          return from(
            r
              .map((cc) => {
                return cc;
              })
              .toArray()
          );
        }),
        switchMap((r) => {
          return new Observable((observer) => {
            let resultAssessed = 0;
            r.sort((a, b) => {
              return a.patterned - b.patterned;
            }).forEach((cc) => {
              resultAssessed++;
              this.taskTracking = {
                [TaskTimingEnum.MINUTELY]:
                  cc.volume[TaskTimingEnum.MINUTELY] || new Date().getTime(),
                [TaskTimingEnum.HOURLY]:
                  cc.volume[TaskTimingEnum.HOURLY] || new Date().getTime(),
                [TaskTimingEnum.DAILY]:
                  cc.volume[TaskTimingEnum.DAILY] || new Date().getTime(),
                [TaskTimingEnum.WEEKLY]:
                  cc.volume[TaskTimingEnum.WEEKLY] || new Date().getTime(),
                [TaskTimingEnum.MONTHLY]:
                  cc.volume[TaskTimingEnum.MONTHLY] || new Date().getTime(),
                [TaskTimingEnum.ANNUALLY]:
                  cc.volume[TaskTimingEnum.ANNUALLY] || new Date().getTime(),
              };
              if (resultAssessed >= r.length - 1) {
                observer.next(false);
                observer.complete();
              }
              return true;
            });
          });
        }),
        map((r) => {
          const provider = generalConfigurations.provider;
          this.trackSalesVolume(provider);
          this.logService.print("Volume Checker module initialised...");
        })
      )
      .subscribe();
  }

  performTask() {
    return of(true).pipe(
      filter((r) => {
        if (this.taskLock === true && this.sqlService.isDBReady === false) {
          return false;
        }
        this.taskLock = true;
        return true;
      }),
      delay(this.taskFrequency),
      switchMap((r) => {
        return this.task();
      }),
      map((r) => {
        this.taskLock = false;
      })
    );
  }

  task() {
    const minutely = 60000;
    const hourly = 60 * minutely;
    const daily = 24 * hourly;
    const weekly = 7 * daily;
    const doTasks: TaskTimingModel[] = [
      {
        type: TaskTimingEnum.MINUTELY,
        timinig: minutely,
      },
      {
        type: TaskTimingEnum.HOURLY,
        timinig: hourly,
      },

      {
        type: TaskTimingEnum.DAILY,
        timinig: daily,
      },
      {
        type: TaskTimingEnum.WEEKLY,
        timinig: weekly,
      },
    ];
    const tasksToDo = doTasks.map((t) => {
      return of(true).pipe(
        withLatestFrom(
          of(new Date().getTime() > this.taskTracking[t.type] + t.timinig)
        ),
        switchMap((states) => {
          const [i, timeHasElapsed] = states;
          if (timeHasElapsed === false) {
            return of(false);
          }
          return this.updateCollectionsTracking(t);
        }),
        switchMap((r) => {
          if (t.type === volumeCheckConf.updateMaxTopDataEvery) {
            return this.sqlService.findAll("collections").pipe(
              take(1),
              switchMap((r) => {
                return from(
                  r
                    .map((cc) => {
                      return cc;
                    })
                    .toArray()
                );
              }),
              switchMap((r) => {
                return new Observable((observer) => {
                  let collections = [];
                  let resultAssessed = 0;
                  r.map((c) => {
                    resultAssessed++;
                    collections.push(c);
                    if (resultAssessed >= r.length - 1) {
                      observer.next(collections);
                      observer.complete();
                    }
                  });
                });
              }),
              switchMap((c: CategoryDataModel[]) => {
                const topCategories = this.sortTopCategories(c);
                const topSales = this.sortTopSales(c);
                const recentSales = this.sortRecentSales(c);
                const categoriesVolumes = this.sortCategoriesVolumes(c);
                return this.sqlService.update(
                  "root_volume",
                  { id: "root_volume" },
                  {
                    $set: {
                      top_categories: topCategories,
                      top_sales: topSales,
                      recent_sales: recentSales,
                      categories_daily_volume: categoriesVolumes,
                    },
                  }
                );
              })
            );
          }
          return of(true);
        })
      );
    });
    return of(tasksToDo).pipe(mergeMap((t) => forkJoin(t)));
  }

  updateCollectionsTracking(trackingTime: TaskTimingModel) {
    return this.sqlService.findAll("collections").pipe(
      take(1),
      switchMap((r) => {
        return from(
          r
            .map((cc) => {
              return cc;
            })
            .toArray()
        );
      }),
      switchMap((r) => {
        this.taskTracking[trackingTime.type] = new Date().getTime();
        const updatedTimetrackings = r.map((c) => {
          const toUpdateQuery = lodash.cloneDeep(c);
          toUpdateQuery.volume.minutely_volume =
            trackingTime.type === TaskTimingEnum.MINUTELY
              ? 0
              : c.volume.minutely_volume;
          toUpdateQuery.volume.hourly_volume =
            trackingTime.type === TaskTimingEnum.HOURLY
              ? 0
              : c.volume.hourly_volume;
          toUpdateQuery.volume.daily_volume =
            trackingTime.type === TaskTimingEnum.DAILY
              ? 0
              : c.volume.daily_volume;
          toUpdateQuery.volume.hourly_sales =
            trackingTime.type === TaskTimingEnum.HOURLY
              ? 0
              : c.volume.hourly_sales;
          toUpdateQuery.volume.previous_minutely_volume =
            trackingTime.type === TaskTimingEnum.MINUTELY
              ? c.volume.minutely_volume
              : c.volume.previous_minutely_volume;
          toUpdateQuery.volume.previous_hourly_volume =
            trackingTime.type === TaskTimingEnum.HOURLY
              ? c.volume.hourly_volume
              : c.volume.previous_hourly_volume;
          toUpdateQuery.volume.previous_daily_volume =
            trackingTime.type === TaskTimingEnum.DAILY
              ? c.volume.daily_volume
              : c.volume.previous_daily_volume;
          toUpdateQuery.volume.previous_hourly_sales =
            trackingTime.type === TaskTimingEnum.HOURLY
              ? c.volume.hourly_sales
              : c.volume.previous_hourly_sales;
          toUpdateQuery.volume[trackingTime.type] =
            this.taskTracking[trackingTime.type];
          toUpdateQuery.volume.sales = this.filterExpiredSalesFromLog(
            c.volume.sales
          );
          delete toUpdateQuery._id;
          return this.sqlService.update(
            "collections",
            {
              id:
                c.category +
                "." +
                generalConfigurations.dataCollectionSource +
                "." +
                generalConfigurations.dateSourceCore,
            },
            {
              $set: toUpdateQuery,
            }
          );
        });
        return forkJoin(updatedTimetrackings);
      })
    );
  }

  filterExpiredSalesFromLog(sales: SaleDiscoveredModel[]) {
    if (sales.length < volumeCheckConf.salesMinimumDataToRetain) {
      return sales;
    }
    const now = new Date().getTime();
    return sales.filter((s) => {
      if (s.timestamp + volumeCheckConf.salesDataRetentionForMs < now) {
        return false;
      }
      return true;
    });
  }

  sortCategoriesVolumes(collections: CategoryDataModel[]) {
    return collections
      .map((c) => {
        return { category: c.category, volume: c["volume"]["daily_volume"] };
      })
      .sort((a, b) => {
        return b.volume - a.volume;
      });
  }

  sortTopCategories(collections: CategoryDataModel[]) {
    return collections
      .map((c) => {
        return { category: c.category, volume: c["volume"]["daily_volume"] };
      })
      .sort((a, b) => {
        return b.volume - a.volume;
      })
      .slice(0, volumeCheckConf.maxTopCategory);
  }

  sortTopSales(collections: CategoryDataModel[]) {
    let collected = [];
    collections.map((c) => {
      collected = collected.concat(c["volume"]["sales"]);
    });
    return collected
      .map((c) => {
        return { domain: c.domain, price: c.price };
      })
      .sort((a, b) => {
        return b.price - a.price;
      })
      .slice(0, volumeCheckConf.maxTopSales);
  }

  sortRecentSales(collections: CategoryDataModel[]) {
    let collected = [];
    collections.map((c) => {
      collected = collected.concat(c["volume"]["sales"]);
    });
    return collected
      .map((c) => {
        return { domain: c.domain, price: c.price, timestap: c.timestamp };
      })
      .sort((a, b) => {
        return b.timestap - a.timestap;
      })
      .slice(0, volumeCheckConf.maxRecentSales);
  }

  getTransationReceipt(provider, hash: string) {
    return new Observable((observer) => {
      provider
        .getTransactionReceipt(hash)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getTransaction(provider, hash: string) {
    return new Observable((observer) => {
      provider
        .getTransaction(hash)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  getDomainsInLog(tx: any) {
    const domainsInLog = tx.logs
      .filter(
        (d) =>
          d.address.toLowerCase() ===
          volumeCheckConf.ensRegistrarAddress.toLowerCase()
      )
      .map((d) => {
        if (
          d.topics[0].toLowerCase() ===
          volumeCheckConf.ensTransferTopicIndicator.toLowerCase()
        ) {
          const domainId = ethers.BigNumber.from(d.topics[3]).toString();
          return domainId;
        }
        return null;
      });
    return [...new Set(domainsInLog)];
  }

  assessSale(filterData, txData: any, domainData: EnsDomainModel) {
    try {
      if (domainData.registrations[0].labelName === null) {
        throw "Domain metadata resolution failed.";
      }
      const domainName = domainData.registrations[0].labelName;
      const domainOwner = domainData.registrations[0].domain.owner.id;
      const domainHash = domainData.registrations[0].domain.labelhash;
      const domainId = domainData.registrations[0].registrant.id;
      let foundMarketPlaceBeneficiary = false;
      const validLog = txData.logs.filter(
        (l) =>
          l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1 &&
          l.topics[0].toLowerCase() === filterData.filterTopic.toLowerCase()
      );
      if (validLog.length <= 0) {
        throw "Marketplace not supported: " + filterData.address;
      }
      const marketplaces = marketplaceData.filter((m) => {
        for (const addr of m.address) {
          if (
            foundMarketPlaceBeneficiary === false &&
            validLog[0].address.toLowerCase() ===
              m.marketplaceAddress.toLowerCase() &&
            validLog[0].data.indexOf(domainHash.substring(2).toLowerCase()) >
              -1 &&
            (filterData.name.indexOf("LR") > -1 ||
              (filterData.name.indexOf("LR") <= -1 &&
                validLog[0].data.indexOf(addr.substring(2).toLowerCase()) > -1))
          ) {
            foundMarketPlaceBeneficiary = true;
            return true;
          }
        }
        return false;
      });
      if (marketplaces.length <= 0) {
        throw "Marketplace not supported: " + filterData.address;
      }
      const marketplaceFee = marketplaces[0].fee;
      const price = marketplaces[0].bulkPriceDiscovery(
        txData,
        domainHash,
        filterData.filterTopic,
        filterData.receiptTopic,
        marketplaceFee
      );
      const marketplaceName = marketplaces[0].name;
      const marketplaceAddress = marketplaces[0].marketplaceAddress;
      if (price === false) {
        throw "Unable to determine sale price.";
      }
      if (domainName !== domainName.toLowerCase() || domainName === undefined) {
        throw "Domain is corrupt, invalid or duplicate.";
      }
      const finalPrice = ethers.utils.formatEther(price);
      const saleValue = finalPrice;
      const newSale = {
        marketplace: marketplaceName,
        marketplaceAddress: marketplaceAddress,
        price: saleValue,
        domain: domainName,
        tx: txData.tx.hash,
        buyer: txData.from,
        seller: domainOwner,
        id: domainId,
        hashRaw: domainHash,
        hash: ethers.BigNumber.from(domainHash).toString(),
        timestamp: new Date().getTime(),
      } as SaleDiscoveredModel;
      return newSale;
    } catch (e) {
      return false;
    }
  }

  assessSaleCategory(sale: SaleDiscoveredModel) {
    let category: boolean | string = false;
    return this.sqlService.findAll("collections").pipe(
      switchMap((r) => {
        return from(
          r
            .map((cc) => {
              return cc;
            })
            .toArray()
        );
      }),
      switchMap((r) => {
        return new Observable((observer) => {
          let resultAssessed = 0;
          r.sort((a, b) => {
            return a.patterned - b.patterned;
          }).forEach((cc) => {
            resultAssessed++;
            const n = this.domainsService.getDataSourceIdFromName(
              sale.domain,
              sale.id,
              cc as any
            );
            if (n !== false && category === false) {
              category = n;
              observer.next(
                category +
                  "." +
                  generalConfigurations.dataCollectionSource +
                  "." +
                  generalConfigurations.dateSourceCore
              );
              observer.complete();
              return true;
            }
            if (resultAssessed >= r.length - 1) {
              observer.next(false);
              observer.complete();
            }
            return true;
          });
        });
      }),
      switchMap((r) => {
        if (r === false) {
          return of(false);
        }
        return this.sqlService.update(
          "collections",
          {
            id: r,
          },
          {
            $inc: {
              "volume.minutely_volume": parseFloat(sale.price),
              "volume.daily_volume": parseFloat(sale.price),
              "volume.hourly_volume": parseFloat(sale.price),
              "volume.hourly_sales": 1,
            },
            $push: {
              "volume.sales": sale,
            },
          }
        );
      }),
      map((r) => {
        this.logService.print(
          sale.domain +
            ".eth (" +
            (category === false ? "N/A" : category) +
            ") sold for " +
            sale.price +
            " ETH at " +
            sale.tx +
            " (" +
            sale.marketplace +
            " - " +
            sale.marketplaceAddress +
            ")"
        );
      }),
      catchError((e) => {
        return of(false);
      })
    );
  }

  trackSalesVolume(provider) {
    const contractsToTrack = marketplaceContractsDataModel;
    const hashProcessed = [];
    for (const c of contractsToTrack) {
      const filter = {
        id: Math.random(),
        address: [c.address],
        topics: [c.filterTopic],
      };
      provider.on(filter, (e) => {
        if (
          !(
            e.data.indexOf(
              volumeCheckConf.ensRegistrarAddress.substring(2).toLowerCase()
            ) > -1 &&
            e.address.toLowerCase() === c.address.toLowerCase() &&
            hashProcessed.includes(e.transactionHash) === false
          )
        ) {
          return;
        }
        hashProcessed.push(e.transactionHash);
        let txData;
        this.getTransationReceipt(provider, e.transactionHash)
          .pipe(
            switchMap((r) => {
              if (r === null || r === false) {
                throw false;
              }
              return this.getTransaction(provider, e.transactionHash).pipe(
                switchMap((tx) => {
                  if (tx === null || tx === false) {
                    throw false;
                  }
                  return of({ ...(r as object), tx });
                }),
                catchError((e) => {
                  return of(false);
                })
              );
            }),
            switchMap((r) => {
              if (r === false) {
                throw false;
              }
              txData = r;
              const domainsInLog = this.getDomainsInLog(r);
              return of(domainsInLog);
            }),
            mergeMap((r: any) => {
              if (r === false || r === null) {
                throw false;
              }
              if (r === null) {
                throw "Domain ID resolution failed.";
              }
              const domainsToCheck = r.map((d) => {
                return from(this.getDomain(d)).pipe(
                  switchMap((domainData) => {
                    const getDomainSale = this.assessSale(
                      c,
                      txData,
                      domainData
                    );
                    return of(getDomainSale);
                  }),
                  switchMap((saleData) => {
                    if (saleData === false || saleData === null) {
                      throw false;
                    }
                    return this.assessSaleCategory(
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
            catchError((e) => {
              return of(false);
            })
          )
          .toPromise();
      });
    }
  }

  getDomain(domain: string) {
    const url = generalConfigurations.ensGraphAPI;
    try {
      const query = gql`
        query ($domainId: String!) {
          registrations(first: 1, where: { id: $domainId }) {
            id
            labelName
            expiryDate
            registrationDate
            registrant {
              id
            }
            domain {
              id
              createdAt
              labelhash
              owner {
                id
              }
            }
          }
        }
      `;
      return request(url, query, {
        domainId: ethers.BigNumber.from(domain).toHexString(),
      });
    } catch (e) {
      return of(false);
    }
  }

  get moduleDbSchema() {
    return volumeCheckConf.dataFigures;
  }
}
