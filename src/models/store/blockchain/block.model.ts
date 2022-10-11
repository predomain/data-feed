import { BigNumber } from "ethers";

export interface BlockModel {
  parentHash: string;
  hash: string;
  number: number;
  difficulty: number;
  timestamp: number;
  nonce: string;
  extraData: string;
  gasLimit: BigNumber;
  gasUsed: BigNumber;
  miner: string;
  transactions?: EthTransaction[];
}

interface EthTransaction {
  gasPrice?: BigNumber;
}
