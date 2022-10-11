import { BehaviorSubject } from "rxjs";
import { BlockchainStateModel } from "src/models/store/blockchain";
import * as BlockchainStateActions from "../actions/blockchain-state.actions";
import { BlockchainStateSelectors } from "../selectors";
import { StatesModel } from "../states";

export class BlockchainStateFacade {
  constructor(
    public states: StatesModel,
    public blockchainStateSelectors: BlockchainStateSelectors = new BlockchainStateSelectors(
      states.blockchainState.stateSelectors
    ),
    public blockchainState$: BehaviorSubject<BlockchainStateModel> = blockchainStateSelectors.blockchainState
  ) {}

  hydrateInitialState(hydratedState: BlockchainStateModel) {
    this.states.blockchainState.dispatch(
      new BlockchainStateActions.UpdateBlockchainState(hydratedState)
    );
  }

  updateState(state: BlockchainStateModel) {
    this.states.blockchainState.dispatch(
      new BlockchainStateActions.UpdateBlockchainState(state)
    );
  }
}
