import { StoreActionLibrary } from "src/libraries/store-action.library";
import { BlockchainStateModel } from "src/models/store/blockchain";

export enum BlockchainStateTypes {
  SET_BLOCKCHAIN_STATE = "[Blockchain state] new state set.",
  UPDATE_BLOCKCHAIN_STATE = "[Blockchain state] state update invoked.",
  GET_BLOCKCHAIN_STATE = "[Blockchain state] get state requested.",
}

export class SetBlockchainState extends StoreActionLibrary {
  type = BlockchainStateTypes.SET_BLOCKCHAIN_STATE;
  constructor(public payload: BlockchainStateModel) {
    super();
  }
}

export class UpdateBlockchainState extends StoreActionLibrary {
  type = BlockchainStateTypes.UPDATE_BLOCKCHAIN_STATE;
  constructor(public payload: BlockchainStateModel) {
    super();
  }
}

export class GetBlockchainState extends StoreActionLibrary {
  type = BlockchainStateTypes.GET_BLOCKCHAIN_STATE;
  constructor() {
    super();
  }
}

export type actions =
  | SetBlockchainState
  | GetBlockchainState
  | UpdateBlockchainState;
