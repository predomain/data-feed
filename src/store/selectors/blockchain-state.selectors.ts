import { map } from "rxjs/operators";
import { BehaviorSubject } from "rxjs";
import { StoreSelectorLibrary } from "../../libraries/store-selector.library";
import { BlockchainStateModel } from "src/models/store/blockchain";

export class BlockchainStateSelectors extends StoreSelectorLibrary {
  blockchainState: BehaviorSubject<BlockchainStateModel> =
    new BehaviorSubject<BlockchainStateModel>(undefined);
  blockchainServerIpState: BehaviorSubject<string> =
    new BehaviorSubject<string>(undefined);

  createSelectors() {
    this.stateChanges
      .pipe(
        map((stateChanges) => {
          if (this.blockchainState === undefined) {
            return;
          }
          const [state, changedProperties] = stateChanges;
          if (changedProperties.length > 0) {
            this.blockchainState.next(state);
          }
        })
      )
      .subscribe();
  }
}
