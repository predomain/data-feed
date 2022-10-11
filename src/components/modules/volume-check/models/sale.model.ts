import { BigNumber } from "ethers";

export interface SaleModel {
  marketplace: string;
  price: BigNumber;
  domain: string;
  hash: string;
}
