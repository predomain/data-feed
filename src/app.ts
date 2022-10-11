import { CoreComponent } from "src/components/core.component";
import { ServiceManager } from "src/services/manager";
import { States } from "src/store/states";
import { WorkerComponent } from "./components/worker.component";

class App {
  isAppFullyInitialised = false;
  state = new States();
  constructor(protected serviceManager: ServiceManager = new ServiceManager()) {
    this.serviceManager.logService.print("Predomain data node initialised...");
    const runner = setInterval(() => {
      if (
        this.isAppFullyInitialised === true ||
        serviceManager.areServicesReady === false
      ) {
        return;
      }
      this.finalise();
      clearInterval(runner);
    }, 1000);
  }

  finalise() {
    const worker = new WorkerComponent();
    const core = new CoreComponent(
      this.state,
      this.serviceManager.taskStateFacade,
      this.serviceManager.blockchainStateFacade,
      this.serviceManager.expresService,
      this.serviceManager.requestValidationService,
      this.serviceManager.responseService,
      worker
    );
    worker.performWork();
    this.isAppFullyInitialised = true;
  }
}
const app = new App();
