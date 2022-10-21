import { HistoricalCheckModule } from "src/components/modules/historical";
import { VolumeCheckModule } from "src/components/modules/volume-check";

export const Modules = [
  {
    module: VolumeCheckModule,
    taskFrequency: 5000,
  },
  {
    module: HistoricalCheckModule,
    taskFrequency: 250,
  },
] as any[];
