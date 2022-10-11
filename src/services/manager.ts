import { BehaviorSubject } from "rxjs";
import { DomainsService } from "src/components/modules/domains/domains.service";
import { GlobalModel } from "src/models/global.model";
import { BlockchainStateFacade, TaskStateFacade } from "src/store/facades";
import { States } from "src/store/states";
import { DataSourceService } from "./datasource";
import { EnsService } from "./ens";
import { ExpressService, ResponseService } from "./express";
import { LogService } from "./log";
import { MiscService } from "./misc";
import { NonceService } from "./nonce";
import { RequestValidationService } from "./request-validation";
import { SQLService } from "./sql";

const globalAny: GlobalModel = global as any;

export class ServiceManager {
  areServicesReady = false;
  constructor(
    public states: States = new States(),
    public logService: LogService = new LogService(),
    public miscService: MiscService = new MiscService(),
    public ensService: EnsService = new EnsService(),
    public domainsService: DomainsService = new DomainsService(
      miscService,
      ensService
    ),
    public sqlService: SQLService = new SQLService(logService),
    public dataSourceService: DataSourceService = new DataSourceService(
      sqlService,
      logService,
      ensService
    ),
    public taskStateFacade: TaskStateFacade = new TaskStateFacade(
      states.createState()
    ),
    public blockchainStateFacade: BlockchainStateFacade = new BlockchainStateFacade(
      states.createState()
    ),
    public requestValidationService: RequestValidationService = new RequestValidationService(
      miscService,
      logService
    ),
    public nonceService: NonceService = new NonceService(),
    public responseService: ResponseService = new ResponseService(),
    public expresService: ExpressService = new ExpressService(
      responseService,
      nonceService,
      logService
    )
  ) {
    const checker = setInterval(() => {
      if (
        this.areServicesReady === true ||
        this.sqlService.isDBReady === false
      ) {
        return false;
      }
      globalAny.predomain = { services: {} } as any;
      globalAny.predomain.services.domainsService = domainsService;
      globalAny.predomain.services.ensService = ensService;
      globalAny.predomain.services.sqlService = sqlService;
      globalAny.predomain.services.logService = logService;
      globalAny.predomain.services.miscService = miscService;
      globalAny.predomain.services.dataSourceService = dataSourceService;
      globalAny.predomain.services.taskStateFacade = taskStateFacade;
      globalAny.predomain.services.blockchainStateFacade =
        blockchainStateFacade;
      globalAny.predomain.services.requestValidationService =
        requestValidationService;
      globalAny.predomain.services.expressService = expresService;
      globalAny.predomain.services.nonceService = nonceService;
      globalAny.predomain.services.responseService = responseService;
      this.areServicesReady = true;
      clearInterval(checker);
    }, 1000);
  }
}
