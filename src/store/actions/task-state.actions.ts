import { StoreActionLibrary } from "src/libraries/store-action.library";
import { TaskModel } from "src/models/store/task";

export enum TaskStateTypes {
  QUEUE_ADD_TASK = "[Task state] new task queued.",
  QUEUE_REMOVE_TASK = "[Task state] queue item removed.",
  QUEUE_UPDATE_TASK = "[Task state] queue updated.",
  ONGOING_ADD_TASK = "[Task state] new ongoing task added.",
  ONGOING_REMOVE_TASK = "[Task state] ongoing task removed.",
  ONGOING_UPDATE_TASK = "[Task state] ongoing task updated.",
  COMPLETED_ADD_TASK = "[Task state] completed task added.",
  COMPLETED_REMOVE_TASK = "[Task state] completed task removed.",
  COMPLETED_UPDATE_TASK = "[Task state] completed task updated.",
}

export class QueueAddTask extends StoreActionLibrary {
  type = TaskStateTypes.QUEUE_ADD_TASK;
  constructor(public payload: TaskModel) {
    super();
  }
}

export class OngoingAddTask extends StoreActionLibrary {
  type = TaskStateTypes.ONGOING_ADD_TASK;
  constructor(public payload: TaskModel) {
    super();
  }
}

export class CompletedAddTask extends StoreActionLibrary {
  type = TaskStateTypes.COMPLETED_ADD_TASK;
  constructor(public payload: TaskModel) {
    super();
  }
}

export class QueueRemoveTask extends StoreActionLibrary {
  type = TaskStateTypes.QUEUE_REMOVE_TASK;
  constructor(public payload: string) {
    super();
  }
}

export class OngoingRemoveTask extends StoreActionLibrary {
  type = TaskStateTypes.ONGOING_REMOVE_TASK;
  constructor(public payload: string) {
    super();
  }
}

export class CompletedRemoveTask extends StoreActionLibrary {
  type = TaskStateTypes.COMPLETED_REMOVE_TASK;
  constructor(public payload: string) {
    super();
  }
}

export class QueueUpdateTask extends StoreActionLibrary {
  type = TaskStateTypes.QUEUE_UPDATE_TASK;
  constructor(public payload: TaskModel) {
    super();
  }
}

export class OngoingUpdateTask extends StoreActionLibrary {
  type = TaskStateTypes.ONGOING_UPDATE_TASK;
  constructor(public payload: TaskModel) {
    super();
  }
}

export type actions =
  | QueueAddTask
  | QueueRemoveTask
  | QueueUpdateTask
  | OngoingAddTask
  | OngoingRemoveTask
  | OngoingUpdateTask
  | CompletedAddTask
  | CompletedRemoveTask;
