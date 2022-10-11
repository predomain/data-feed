import { filter, forkJoin, interval, map, mergeMap } from "rxjs";
import { Modules } from "src/configurations/modules.conf";

export class WorkerComponent {
  moduleInstances: any[] = [];
  constructor() {
    const moduleList = this.modules;
    for (const m of moduleList) {
      const module = new m.module(m.taskFrequency);
      module.start();
      this.moduleInstances.push(module);
    }
  }

  get modules() {
    return Modules as any[];
  }

  performWork() {
    let workerLocked = false;
    interval(1)
      .pipe(
        filter((i) => {
          if (workerLocked === true) {
            return false;
          }
          workerLocked = true;
          return true;
        }),
        mergeMap((r) => {
          const work = this.moduleInstances.map((m) => {
            return m.performTask();
          });
          return forkJoin(work) as any;
        }),
        map((r) => {
          workerLocked = false;
        })
      )
      .subscribe();
  }
}
