import { RouteParametersEnum } from "./route-parameters.enum";
import { RoutesEnum } from "./routes.enum";

export interface RouteModel {
  routeId: RoutesEnum;
  route: string[];
  routeParameters: RouteParametersEnum[];
}
