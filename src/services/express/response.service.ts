import { ResponseCodesEnum, ResponseTypesEnum } from "src/models/response";
import { ResponseModel } from "src/models/response/response.model";

export class ResponseService {
  respond(
    responseType: ResponseTypesEnum,
    responseCode: ResponseCodesEnum,
    message: any
  ) {
    const newResponse = {
      type: responseType,
      code: responseCode,
      result: message,
    } as ResponseModel;
    return JSON.stringify(newResponse);
  }

  wrapResponse(compiledResponse: ResponseModel) {
    return JSON.stringify(compiledResponse);
  }
}
