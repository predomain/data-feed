import { ResponseModel } from "src/models/response/response.model";
import { TaskTypesEnum } from "./task-types.enum";

export interface TaskModel {
  type: TaskTypesEnum;
  id: string;
  key: string;
  data?: any;
  result?: ResponseModel;
  locked?: boolean;
  completionTimestamp?: number;
  startingTimestamp: number;
}
