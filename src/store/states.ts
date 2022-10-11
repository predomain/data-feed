import { BlockchainStateReducer } from "./reducers/blockchain-state.reducer";
import { TaskStateReducer } from "./reducers/task-state.reducer";

export interface StatesModel {
  taskState: TaskStateReducer;
  blockchainState: BlockchainStateReducer;
}

export class States {
  constructor() {}
  createState() {
    return {
      taskState: new TaskStateReducer(),
      blockchainState: new BlockchainStateReducer(),
    } as StatesModel;
  }
}
