import { of, BehaviorSubject } from "rxjs";
import { map, switchMap, filter } from "rxjs/operators";
import { StoreActionLibrary } from "./store-action.library";
import * as lodash from "lodash";

export class StoreReducerLibrary {
  isCacheable = false;
  cacheableStateKeys: string[];
  state: any;
  previousState: any;
  stateSubscription: any;
  stateSteps: BehaviorSubject<any> = new BehaviorSubject<any>({});
  stateActions: BehaviorSubject<any> = new BehaviorSubject<any>({});
  stateSelectors: BehaviorSubject<[any, any]> = new BehaviorSubject<[any, any]>(
    [undefined, undefined]
  );

  constructor() {
    this.stateSubscription = this.reducerProcessor().subscribe();
    this.dispatch({
      type: undefined,
      payload: this.state,
    } as StoreActionLibrary);
  }

  dispatch(action: any) {
    this.stateSteps.next(action);
  }

  reducer(action: any, state: any = this.state) {
    return of(state);
  }

  /**
   * Process state changes and fire action to stateActions (to be used for effects).
   */
  reducerProcessor() {
    return this.stateSteps.pipe(
      switchMap((action) => {
        this.previousState = lodash.cloneDeep(this.state);
        this.stateActions.next(action);
        return this.reducer(action as StoreActionLibrary);
      }),
      filter((reducerResult) => {
        if (typeof reducerResult === "object") {
          return true;
        }
        return false;
      }),
      map((reducerResult) => {
        this.stateSelectors.next([{ ...this.previousState }, reducerResult]);
        this.state = reducerResult;
        return this.state;
      })
    );
  }
}
