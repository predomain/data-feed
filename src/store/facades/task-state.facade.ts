import { Observable } from "rxjs";
import { TaskModel, TaskStateModel } from "src/models/store/task";
import {
  QueueRemoveTask,
  QueueAddTask,
  QueueUpdateTask,
  OngoingAddTask,
  OngoingUpdateTask,
  CompletedAddTask,
  OngoingRemoveTask,
  CompletedRemoveTask,
} from "../actions/task-state.actions";
import { TaskStateSelectors } from "../selectors/task-state.selectors";
import { StatesModel } from "../states";

export class TaskStateFacade {
  taskState$: Observable<TaskStateModel>;
  taskQueuedState$: Observable<any>;
  taskOnGoingState$: Observable<any>;
  taskCompletedState$: Observable<any>;

  constructor(
    public states: StatesModel,
    public taskStateSelectors: TaskStateSelectors = new TaskStateSelectors(
      states.taskState.stateSelectors
    )
  ) {
    this.taskState$ = this.taskStateSelectors.taskState;
    this.taskQueuedState$ = this.taskStateSelectors.taskQueuedState;
    this.taskOnGoingState$ = this.taskStateSelectors.taskOnGoingState;
    this.taskCompletedState$ = this.taskStateSelectors.taskCompletedState;
  }

  removeQueuedTask(taskId: string) {
    this.states.taskState.dispatch(new QueueRemoveTask(taskId));
  }

  removeOnGoingTask(taskId: string) {
    this.states.taskState.dispatch(new OngoingRemoveTask(taskId));
  }

  removeCompletedTask(taskId: string) {
    this.states.taskState.dispatch(new CompletedRemoveTask(taskId));
  }

  addQueuedTask(task: TaskModel) {
    this.states.taskState.dispatch(new QueueAddTask(task));
  }

  addOngoingTask(task: TaskModel) {
    this.states.taskState.dispatch(new OngoingAddTask(task));
  }

  addCompletedTask(task: TaskModel) {
    this.states.taskState.dispatch(new CompletedAddTask(task));
  }

  updateQueuedTask(task: TaskModel) {
    this.states.taskState.dispatch(new QueueUpdateTask(task));
  }

  updateOnGoingTask(task: TaskModel) {
    this.states.taskState.dispatch(new OngoingUpdateTask(task));
  }
}
