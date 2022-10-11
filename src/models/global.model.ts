import { DomainsService } from "src/components/modules/domains/domains.service";
import { DataSourceService } from "src/services/datasource";
import { EnsService } from "src/services/ens";
import { ExpressService, ResponseService } from "src/services/express";
import { LogService } from "src/services/log";
import { MiscService } from "src/services/misc";
import { NonceService } from "src/services/nonce";
import { RequestValidationService } from "src/services/request-validation";
import { SQLService } from "src/services/sql";
import { BlockchainStateFacade, TaskStateFacade } from "src/store/facades";

export interface GlobalModel extends Global {
  predomain: {
    services: {
      domainsService: DomainsService;
      ensService: EnsService;
      logService: LogService;
      miscService: MiscService;
      dataSourceService: DataSourceService;
      taskStateFacade: TaskStateFacade;
      blockchainStateFacade: BlockchainStateFacade;
      responseService: ResponseService;
      nonceService: NonceService;
      expressService: ExpressService;
      sqlService: SQLService;
      requestValidationService: RequestValidationService;
    };
    tasksInQueue: number;
  };
}
