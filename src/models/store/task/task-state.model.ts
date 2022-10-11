import { TaskModel } from './task.model';

export interface TaskStateModel {
	queuedTasks?: any;
	onGoingTasks?: any;
	completedTasks?: any;
}
