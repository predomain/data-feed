import express from "express";
import { Routes } from "src/configurations";
import { payNoMarketAddress } from "src/models/pay-no-market-address.model";
import { RouteParametersEnum } from "src/models/router";
import { LogService } from "../log";
import { MiscService } from "../misc";

export class RequestValidationService {
  constructor(public miscService: MiscService, public logService: LogService) {}

  validateParameters(request: express.Request, routeId: number) {
    const routeKinds = Routes[routeId].routeParameters;
    const params = request.params;
    const paramKeys = Object.keys(params);
    if (paramKeys.length !== routeKinds.length) {
      return false;
    }
    for (let i = 0; i < routeKinds.length; i++) {
      switch (routeKinds[i]) {
        case RouteParametersEnum.BOOLEAN:
          {
            if (
              this.miscService
                .testSQLInjectionCode()
                .test(params[paramKeys[i]]) === true ||
              params[paramKeys[i]].length > 1 ||
              (params[paramKeys[i]] !== "true" &&
                params[paramKeys[i]] !== "false" &&
                params[paramKeys[i]] !== "0" &&
                params[paramKeys[i]] !== "1")
            ) {
              this.logService.print(
                "SQL injection detected or string is invalid. Aborting request."
              );
              return false;
            }
          }
          break;

        case RouteParametersEnum.STRING:
          {
            if (
              this.miscService
                .testSQLInjectionCode()
                .test(params[paramKeys[i]]) === true ||
              params[paramKeys[i]].length > 512
            ) {
              this.logService.print(
                "SQL injection detected or string is invalid. Aborting request."
              );
              return false;
            }
          }
          break;
        case RouteParametersEnum.SERIAL:
          {
            const regTest = this.miscService.testSerial();
            if (
              params[paramKeys[i]].length > 15 ||
              regTest.test(params[paramKeys[i]]) === false
            ) {
              this.logService.print("Invalid serial. Aborting request.");
              return false;
            }
          }
          break;
        case RouteParametersEnum.DECIMAL:
          {
            const regTest = this.miscService.testDecimal();
            if (
              params[paramKeys[i]].length > 5 ||
              regTest.test(params[paramKeys[i]]) === false
            ) {
              this.logService.print("Invalid decimal. Aborting request.");
              return false;
            }
          }
          break;

        case RouteParametersEnum.HASH:
          {
            const ox = params[paramKeys[i]].substr(0, 2);
            if (ox !== "0x" || params[paramKeys[i]].length > 1024) {
              this.logService.print("Invalid hash. Aborting request.");
              return false;
            }
          }
          break;

        case RouteParametersEnum.INTEGER:
          {
            const regTest = this.miscService.testInteger();
            if (
              params[paramKeys[i]].length > 128 ||
              regTest.test(params[paramKeys[i]]) === false
            ) {
              this.logService.print("Invalid integer. Aborting request.");
              return false;
            }
          }
          break;
        case RouteParametersEnum.DECIMAL_OR_INTEGER:
          {
            const filteredInput = params[paramKeys[i]].replace(".", "");
            const regTest = this.miscService.testInteger();
            if (
              params[paramKeys[i]].length > 128 ||
              regTest.test(filteredInput) === false
            ) {
              this.logService.print(
                "Invalid decimal or integer. Aborting request."
              );
              return false;
            }
          }
          break;
        case RouteParametersEnum.JSON_STRING:
          {
            if (
              this.miscService
                .testSQLInjectionCode()
                .test(params[paramKeys[i]]) === true ||
              params[paramKeys[i]].length > 4096 ||
              this.miscService.testJSON(params[paramKeys[i]]) === false
            ) {
              this.logService.print("Invalid JSON string. Aborting request.");
              return false;
            }
          }
          break;

        case RouteParametersEnum.WALLET_ADDRESS:
          {
            if (
              this.isWalletAddressValid(params[paramKeys[i]]) === false &&
              params[paramKeys[i]] !== payNoMarketAddress
            ) {
              this.logService.print(
                "Invalid wallet address. Aborting request."
              );
              return false;
            }
          }
          break;
      }
    }
    return true;
  }

  isWalletAddressValid(address: string) {
    if (this.miscService.checksumEtheruemAddress(address) === false) {
      return false;
    }
    if (address === "0x0000000000000000000000000000000000000000") {
      return true;
    }
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
      return false;
    } else if (
      /^(0x)?[0-9a-f]{40}$/.test(address) ||
      /^(0x)?[0-9A-F]{40}$/.test(address)
    ) {
      return true;
    } else {
      return true;
    }
  }
}
