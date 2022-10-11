import express from "express";
import {
  catchError,
  filter,
  interval,
  lastValueFrom,
  map,
  Observable,
  of,
  switchMap,
  withLatestFrom,
} from "rxjs";
import {
  generalConfigurations,
  ValidCollectionPoints,
} from "src/configurations";
import { GlobalModel } from "src/models/global.model";
import { RequestPacketModel } from "src/models/request";
import { ResponseCodesEnum, ResponseTypesEnum } from "src/models/response";
import { RoutesEnum } from "src/models/router";
import { ExpressService, ResponseService } from "src/services/express";
import { RequestValidationService } from "src/services/request-validation";
import { SQLService } from "src/services/sql";
import { BlockchainStateFacade, TaskStateFacade } from "src/store/facades";
import { States } from "src/store/states";
import { CategoryDataModel } from "./modules/domains/models";
import { WorkerComponent } from "./worker.component";

const globalAny: GlobalModel = global as any;

export class CoreComponent {
  lastAPIMessageId: string[] = [];
  tasksInQueue: Observable<RequestPacketModel> = of(null);

  constructor(
    protected state: States,
    protected taskStateFacade: TaskStateFacade,
    protected blockchainStateFacade: BlockchainStateFacade,
    protected expressService: ExpressService,
    protected requestValidationService: RequestValidationService,
    protected responseService: ResponseService,
    protected workerComponent: WorkerComponent,
    protected sqlService: SQLService = globalAny.predomain.services.sqlService
  ) {
    const threadCount = generalConfigurations.processorThreads;
    const threadLocks: boolean[] = new Array(threadCount);
    for (let i = 0; i < threadCount; i++) {
      threadLocks[i] = false;
    }
    for (let i = 0; i < threadCount; i++) {
      this.lastAPIMessageId[i] = "";
      interval(1)
        .pipe(
          filter((ii) => {
            if (threadLocks[i] === true) {
              return false;
            }
            threadLocks[i] = true;
            return true;
          }),
          map((ii) => {
            return this.expressService.apiRequests[i];
          }),
          filter((args) => {
            if (
              args === undefined ||
              "request" in args === false ||
              args.messageId === this.lastAPIMessageId[i]
            ) {
              threadLocks[i] = false;
              return false;
            }
            if (
              this.requestValidationService.validateParameters(
                args.request as any as express.Request,
                args.routeId
              ) === false
            ) {
              this.expressService.apiRequests[i].isResolved = true;
              this.expressService.apiRequests[i].isLocked = false;
              this.lastAPIMessageId[i] = args.messageId;
              threadLocks[i] = false;
              (args.response as express.Response)
                .status(503)
                .end("An error has occured while processing your request.");
              return false;
            }
            this.lastAPIMessageId[i] = args.messageId;
            return true;
          }),
          map(async (args) => {
            await lastValueFrom(
              this.assessApiMessage(
                args.request as any as express.Request,
                args.response as express.Response,
                args.routeId
              )
            );
            this.expressService.apiRequests[i].isResolved = true;
            if (
              this.expressService.apiRequests[i].hasElapsedProcessingLimit ===
              true
            ) {
              this.expressService.apiRequests[i].isLocked = false;
            }
            threadLocks[i] = false;
            return;
          })
        )
        .subscribe();
    }
  }

  createInterceptor(expressServer: express.Application) {
    expressServer.use((request: any, response: any) => {
      if (
        globalAny.predomain.tasksInQueue >=
        generalConfigurations.maxRequestInQueue
      ) {
        response.status(503).end("Node Health - Error");
      } else {
        response.status(200).end("Node Health - OK");
      }
    });
  }

  checkServerLoad(response: express.Response) {
    return of(1).pipe(
      withLatestFrom(this.taskStateFacade.taskQueuedState$),
      switchMap((states) => {
        const [i, tasks] = states;
        return of(tasks);
      }),
      switchMap((tasks) => {
        if (tasks !== undefined && tasks !== null) {
          const taskQueuedLength = Object.keys(tasks).length;
          if (taskQueuedLength >= generalConfigurations.maxRequestInQueue) {
            this.expressService.end(
              response,
              this.responseService.respond(
                ResponseTypesEnum.FAILURE,
                ResponseCodesEnum.SERVER_BUSY,
                "Server is busy - FERR00006"
              )
            );
            return of(true);
          }
        }
        return of(false);
      })
    );
  }

  /**
   * Check if the task queue has enough capacity and execute the correct API method.
   *
   * @param request
   * @param response
   * @param routeId
   * @param serverType
   */
  assessApiMessage(
    request: express.Request,
    response: express.Response,
    routeId: number
  ) {
    return this.checkServerLoad(response).pipe(
      switchMap((serverIsBusy) => {
        if (serverIsBusy === true) {
          this.expressService.end(
            response,
            this.responseService.respond(
              ResponseTypesEnum.FAILURE,
              ResponseCodesEnum.SERVER_BUSY,
              "Server is busy - FERR00007"
            )
          );
          return of(false);
        }
        return of(true);
      }),
      switchMap((serverIsReady) => {
        if (serverIsReady === false) {
          return of(true);
        }
        switch (routeId) {
          case RoutesEnum.PING:
            {
              return this.ping(request, response);
            }
            break;
          case RoutesEnum.CHECKOUT:
            {
              return this.checkout(request, response);
            }
            break;
          default:
            {
              this.expressService.end(
                response,
                this.responseService.respond(
                  ResponseTypesEnum.FAILURE,
                  ResponseCodesEnum.INAVLID_ROUTE,
                  "Invalid Route - FERR00008"
                )
              );
              return of(false);
            }
            break;
        }
      })
    );
  }

  checkout(request: express.Request, response: express.Response) {
    if (
      this.sqlService.isDBReady === false ||
      ValidCollectionPoints.includes(request.params.collection) === false
    ) {
      this.expressService.end(
        response,
        this.responseService.respond(
          ResponseTypesEnum.FAILURE,
          ResponseCodesEnum.RETRIEVE_FAILED,
          "An error has occured while processing your request."
        )
      );
      return of(false);
    }
    return this.sqlService
      .find(request.params.collection, {
        id: request.params.figure_key,
      })
      .pipe(
        switchMap((r) => {
          if (r === false || r === null) {
            throw false;
          }
          const filtered: CategoryDataModel = r as any;
          delete filtered.valid_names;
          delete filtered.optimised;
          delete filtered._id;
          this.expressService.end(
            response,
            this.responseService.respond(
              ResponseTypesEnum.SUCCESS,
              ResponseCodesEnum.RETRIEVE_SUCCEEDED,
              filtered
            )
          );
          return of(true);
        }),
        catchError((e) => {
          this.expressService.end(
            response,
            this.responseService.respond(
              ResponseTypesEnum.FAILURE,
              ResponseCodesEnum.RETRIEVE_FAILED,
              "An error has occured while processing your request."
            )
          );
          return of(false);
        })
      );
  }

  ping(request: express.Request, response: express.Response) {
    this.expressService.end(
      response,
      this.responseService.respond(
        ResponseTypesEnum.SUCCESS,
        ResponseCodesEnum.RETRIEVE_SUCCEEDED,
        "OK"
      )
    );
    return of(false);
  }
}
