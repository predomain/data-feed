import { map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

/**
 * This selector will only check the first layer of the state for changes. For example:
 * In the state below, the selector will report changes are available in A instead of reporting
 * specifically: A3
 * MyState {
 *    A:
 *      {
 *         A1:
 *            {
 *              A3: with changed value
 *              A4: state is equal
 *            }
 *         A2:
 *            {
 *              A5: state is equal
 *              A6: state is equal
 *            }
 *      }
 *    B:
 *      {
 *         B1: state is equal
 *      }
 * }
 */
export class StoreSelectorLibrary {
	stateSubscription: any;
	stateChanges: BehaviorSubject<[any, string[]]> = new BehaviorSubject<
		[any, string[]]
	>([undefined, undefined]);
	constructor(public selector: BehaviorSubject<[any, any]>) {
		this.stateSubscription = selector
			.pipe(
				map((comparableStates) => {
					const [oldState, newState] = comparableStates;
					if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
						const changes: string[] = [];
						const newStateKeys = Object.keys(newState);
						if (newStateKeys.length > 0) {
							for (const nK of newStateKeys) {
								if (nK in oldState === false) {
									changes.push(nK);
								} else if (
									nK in oldState &&
									JSON.stringify(oldState[nK]) !==
										JSON.stringify(newState[nK])
								) {
									changes.push(nK);
								}
							}
						}
						this.stateChanges.next([newState, changes]);
					}
				})
			)
			.subscribe();
		this.createSelectors();
	}
	createSelectors() {}
}
