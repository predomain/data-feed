import { RouteParametersEnum, RoutesEnum } from "src/models/router";
import { RouteModel } from "src/models/router/route.model";

export const ValidCollectionPoints = ["collections", "root_volume"];
export const Routes = [
  {
    routeId: RoutesEnum.PING,
    route: ["ping", ":nonce"],
    routeParameters: [RouteParametersEnum.HASH],
  } as RouteModel,
  {
    routeId: RoutesEnum.CHECKOUT,
    route: ["checkout", ":collection", ":figure_key"],
    routeParameters: [RouteParametersEnum.STRING, RouteParametersEnum.STRING],
  } as RouteModel,
  {
    routeId: RoutesEnum.CHECKOUT,
    route: ["paged_checkout", ":collection", ":figure_key", ":object", ":page"],
    routeParameters: [RouteParametersEnum.STRING, RouteParametersEnum.STRING],
  } as RouteModel,
];
