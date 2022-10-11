import { of } from "rxjs";
import {
  BlockchainDefaultStateModel,
  BlockchainStateModel,
} from "src/models/store/blockchain";
import { StoreReducerLibrary } from "../../libraries/store-reducer.library";
import * as BlockchainStateActions from "../actions/blockchain-state.actions";

export class BlockchainStateReducer extends StoreReducerLibrary {
  state: BlockchainStateModel = BlockchainDefaultStateModel;

  reducer(
    action: BlockchainStateActions.actions,
    state: BlockchainStateModel = this.state
  ) {
    switch (action.type) {
      case BlockchainStateActions.BlockchainStateTypes.SET_BLOCKCHAIN_STATE:
        {
          const newState = action.payload;
          return of(newState);
        }
        break;
      case BlockchainStateActions.BlockchainStateTypes.UPDATE_BLOCKCHAIN_STATE:
        {
          let newState = { ...state };
          newState = Object.assign({}, { ...newState }, action.payload);
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
