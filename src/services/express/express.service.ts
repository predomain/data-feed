import * as express from "express";
import * as https from "https";
import * as fs from "fs";
import * as cors from "cors";
import expressRateLimit from "express-rate-limit";
import { RequestListener } from "http";
import { RequestPacketModel } from "src/models/request";
import { generalConfigurations, Routes } from "src/configurations";
import { ResponseService } from "./response.service";
import { NonceService } from "../nonce";
import { LogService } from "../log";
import { LogErrorTypesEnum } from "src/models/log";
import { RouteModel } from "src/models/router/route.model";
import { RoutesEnum } from "src/models/router";
import { ResponseCodesEnum, ResponseTypesEnum } from "src/models/response";
import { SSLCredentialsModel } from "src/models/ssl";

export class ExpressService {
  server: express.Application;
  serverSecured: https.Server;
  apiRequests: RequestPacketModel[] = new Array(
    generalConfigurations.processorThreads
  )
    .fill(null)
    .map(() => {
      return {
        isLocked: false,
        isResolved: false,
        hasElapsedProcessingLimit: false,
      };
    });

  constructor(
    protected responseService: ResponseService,
    protected nonceService: NonceService,
    protected logService: LogService
  ) {
    try {
      this.server = express();
      this.server.use(cors());
      this.server.use(
        expressRateLimit({
          windowMs: generalConfigurations.requestRateWindow,
          max: generalConfigurations.requestRateLimit,
        })
      );
      const ssl = this.readSSL();
      if (ssl === false) {
        throw "SSL Read Error";
      }
      this.createServer(ssl);
    } catch (e) {
      this.logService.error(
        LogErrorTypesEnum.CORE,
        "Error when creating express server."
      );
    }
  }

  createRoutes() {
    const routes = Object.values(Routes) as RouteModel[];
    const minProcessingTime = generalConfigurations.requestRateWindow;
    for (const r of routes) {
      const routeUri = this.compileRoute(r.route);
      this.server.get(routeUri, async (req: any, res: any) => {
        const rId: RoutesEnum = this.getRouteId(req.route.path);
        if (rId === undefined) {
          res.end(
            this.responseService.respond(
              ResponseTypesEnum.FAILURE,
              ResponseCodesEnum.INAVLID_ROUTE,
              "Invalid Route"
            )
          );
          return;
        }
        const slot = this.findFreeAPISlot(this.apiRequests);
        if (slot === undefined) {
          res.end(
            this.responseService.respond(
              ResponseTypesEnum.FAILURE,
              ResponseCodesEnum.SERVER_BUSY,
              "The server is currently busy. Please try again."
            )
          );
          return;
        }
        const msgId = this.nonceService.nonceUuid();
        this.apiRequests[slot].isLocked = true;
        this.apiRequests[slot].isResolved = false;
        this.apiRequests[slot].hasElapsedProcessingLimit = false;
        this.apiRequests[slot].request = req;
        this.apiRequests[slot].response = res;
        this.apiRequests[slot].routeId = rId;
        this.apiRequests[slot].messageId = msgId;
        setTimeout(() => {
          if (this.apiRequests[slot].isResolved) {
            this.apiRequests[slot].isLocked = false;
          } else {
            this.apiRequests[slot].hasElapsedProcessingLimit = true;
          }
        }, minProcessingTime);
        return;
      });
    }
  }

  compileRoute(route: string[]) {
    return "/" + route.join("/");
  }

  getRouteId(routePathString: string) {
    const routeName = routePathString.split("/")[1].toUpperCase();
    if (routeName in Object(RoutesEnum) === false) {
      return undefined;
    }
    return Object(RoutesEnum)[routeName];
  }

  createServer(ssl: SSLCredentialsModel) {
    try {
      this.serverSecured = https.createServer(
        ssl,
        this.server as any as RequestListener
      );
      this.serverSecured.listen(generalConfigurations.serverPort, () => {
        this.server.maxConnections = generalConfigurations.maxConnections;
        this.serverSecured.setTimeout(
          generalConfigurations.dropConnectionAfterMs
        );
      });
      this.createRoutes();
    } catch (e) {
      this.logService.error(LogErrorTypesEnum.CORE, "Unable to resolve SSL.");
    }
  }

  readSSL() {
    try {
      const sslCredentials = {
        key: fs.readFileSync(generalConfigurations.sslKeyPath, "utf-8"),
        cert: fs.readFileSync(generalConfigurations.sslCertPath, "utf-8"),
        ca: fs.readFileSync(generalConfigurations.sslCaPath, "utf-8"),
      } as SSLCredentialsModel;
      return sslCredentials;
    } catch (e) {
      this.logService.error(LogErrorTypesEnum.CORE, "Unble to read SSL file.");
      return false;
    }
  }

  findFreeAPISlot(apiProcessorThreads: RequestPacketModel[]) {
    for (let i = 0; i < apiProcessorThreads.length; i++) {
      if (apiProcessorThreads[i].isLocked === false) {
        return i;
      }
    }
    return undefined;
  }

  end(res: express.Response, message: any) {
    res.end(message);
  }
}
