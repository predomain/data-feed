import { of } from "rxjs";
import {
  TaskDefaultStateModel,
  TaskModel,
  TaskStateModel,
} from "src/models/store/task";
import { StoreReducerLibrary } from "../../libraries/store-reducer.library";
import * as TaskStateActions from "../actions/task-state.actions";

export class TaskStateReducer extends StoreReducerLibrary {
  state: TaskStateModel = TaskDefaultStateModel;
  isCacheable = true;
  cacheableStateKeys = ["onGoingTasks", "completedTasks"];

  reducer(
    action: TaskStateActions.actions,
    state: TaskStateModel = this.state
  ) {
    switch (action.type) {
      case TaskStateActions.TaskStateTypes.QUEUE_ADD_TASK:
        {
          const newState = { ...state };
          const task = action.payload as TaskModel;
          newState.queuedTasks[task.id] = task;
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.ONGOING_ADD_TASK:
        {
          const newState = { ...state };
          const task = action.payload as TaskModel;
          newState.onGoingTasks[task.id] = task;
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.COMPLETED_ADD_TASK:
        {
          const newState = { ...state };
          const task = action.payload as TaskModel;
          newState.completedTasks[task.id] = task;
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.QUEUE_REMOVE_TASK:
        {
          const newState = { ...state };
          delete newState.queuedTasks[action.payload as string];
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.ONGOING_REMOVE_TASK:
        {
          const newState = { ...state };
          delete newState.onGoingTasks[action.payload as string];
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.COMPLETED_REMOVE_TASK:
        {
          const newState = { ...state };
          delete newState.completedTasks[action.payload as string];
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.QUEUE_UPDATE_TASK:
        {
          const newState = { ...state };
          const task = action.payload as TaskModel;
          newState.queuedTasks[task.id] = task;
          return of(newState);
        }
        break;
      case TaskStateActions.TaskStateTypes.ONGOING_UPDATE_TASK:
        {
          const newState = { ...state };
          const task = action.payload as TaskModel;
          newState.onGoingTasks[task.id] = task;
          return of(newState);
        }
        break;
      default:
        {
          return of(state);
        }
        break;
    }
  }
}
