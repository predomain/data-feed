import { map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs";
import { StoreSelectorLibrary } from "../../libraries/store-selector.library";
import { TaskStateModel } from "../../models/store/task/task-state.model";

export class TaskStateSelectors extends StoreSelectorLibrary {
  taskState: BehaviorSubject<TaskStateModel> =
    new BehaviorSubject<TaskStateModel>(undefined);
  taskQueuedState: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  taskOnGoingState: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  taskCompletedState: BehaviorSubject<any> = new BehaviorSubject<any>(
    undefined
  );

  createSelectors() {
    this.stateChanges
      .pipe(
        map((stateChanges) => {
          if (this.taskState === undefined) {
            return;
          }
          const [state, changedProperties] = stateChanges;
          if (changedProperties.length > 0) {
            this.taskState.next(state);
          }
          this.queuedTaskSelector(state, changedProperties);
          this.onGoingTaskSelector(state, changedProperties);
          this.completedTaskSelector(state, changedProperties);
        })
      )
      .subscribe();
  }

  queuedTaskSelector(state: TaskStateModel, changedProperties: string[]) {
    if (changedProperties.indexOf("queuedTasks") > -1) {
      this.taskQueuedState.next(state.queuedTasks);
    }
  }

  onGoingTaskSelector(state: TaskStateModel, changedProperties: string[]) {
    if (changedProperties.indexOf("onGoingTasks") > -1) {
      this.taskOnGoingState.next(state.onGoingTasks);
    }
  }

  completedTaskSelector(state: TaskStateModel, changedProperties: string[]) {
    if (changedProperties.indexOf("completedTasks") > -1) {
      this.taskCompletedState.next(state.completedTasks);
    }
  }
}
