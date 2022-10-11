import { BlockModel } from "./block.model";

export interface BlockchainStateModel {
  startingBlockNumber?: number;
  latestBlock?: BlockModel;
  nextBlockNumber?: number;
}
