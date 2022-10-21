import * as ethers from "ethers";
import { SeaportABI } from "./models/seaport-abi.model";
import { X2Y2ABI } from "./models/x2y2-abi.model";
import { LooksrareABI } from "./models/looksrare-abi.model";
import { volumeCheckConf } from "./volume-check.conf";

const openSeaBulkPriceDiscovery = (
  txData,
  domainHash,
  topic,
  receiptTopic,
  fee
) => {
  try {
    const saleLog = txData.logs.filter(
      (l) => l.topics.includes(topic.toLowerCase()) === true
    );
    const validSaleLog = saleLog.filter(
      (l) =>
        l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1 &&
        l.topics[0].toLowerCase() !==
          volumeCheckConf.ensTransferTopicIndicator.toLowerCase()
    );
    if ((validSaleLog[0].data.length - 2) / 64 > 20) {
      throw false;
    }
    const dataDecoded = ethers.utils.defaultAbiCoder.decode(
      SeaportABI as any,
      validSaleLog[0].data
    );
    const consideration = dataDecoded.consideration.map((c) =>
      c.amount.toString()
    );
    const offers = dataDecoded.offer.map((c) => c.amount.toString());
    if (consideration[0] === "1") {
      return ethers.BigNumber.from(offers[0]);
    }
    const feeAdded = ethers.BigNumber.from(consideration[0])
      .div(100)
      .mul(fee)
      .div(100);
    return ethers.BigNumber.from(consideration[0]).add(feeAdded);
  } catch (e) {
    return false;
  }
};

const looksRareBulkPriceDiscovery = (
  txData,
  domainHash,
  topic,
  receiptTopic,
  fee
) => {
  try {
    const saleLog = txData.logs.filter(
      (l) => l.topics.includes(topic.toLowerCase()) === true
    );
    const validSaleLog = saleLog.filter(
      (l) => l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1
    );
    const dataDecoded = ethers.utils.defaultAbiCoder.decode(
      LooksrareABI as any,
      validSaleLog[0].data
    );
    const feeAdded = ethers.BigNumber.from(dataDecoded.price)
      .div(100)
      .mul(fee)
      .div(100);
    return ethers.BigNumber.from(dataDecoded.price).add(feeAdded);
  } catch (e) {
    return false;
  }
};

const x2y2BulkPriceDiscovery = (
  txData,
  domainHash,
  topic,
  receiptTopic,
  fee
) => {
  try {
    const saleLog = txData.logs.filter(
      (l) => l.topics.includes(topic.toLowerCase()) === true
    );
    const validSaleLog = saleLog.filter(
      (l) => l.data.indexOf(domainHash.substring(2).toLowerCase()) > -1
    );
    const validSaleTicket = txData.logs.filter(
      (l) =>
        l.topics.includes(receiptTopic) &&
        l.data.indexOf(validSaleLog[0].topics[1].substring(2)) > -1
    );
    const dataDecoded = ethers.utils.defaultAbiCoder.decode(
      X2Y2ABI as any,
      validSaleTicket[0].data
    );
    const feeAdded = ethers.BigNumber.from(dataDecoded.amount)
      .div(100)
      .mul(fee)
      .div(100);
    return ethers.BigNumber.from(dataDecoded.amount).add(feeAdded);
  } catch (e) {
    return false;
  }
};

export const marketplaceData = [
  {
    name: "ens.vision",
    address: ["0xA7673aB3B0949a0EfCd818c86C71FFf7CD645ac7"],
    marketplaceAddress: "0x00000000006c3852cbef3e08e8df289169ede581",
    bulkSaleSupported: true,
    bulkPriceDiscovery: openSeaBulkPriceDiscovery,
    fee: 150,
  },
  {
    name: "opensea.io",
    address: [
      "0x0000a26b00c1F0DF003000390027140000fAa719",
      "0x8De9C5A032463C561423387a9648c5C7BCC5BC90",
      "0x34BA0f2379bF9B81D09f7259892e26A8b0885095",
    ],
    marketplaceAddress: "0x00000000006c3852cbef3e08e8df289169ede581",
    bulkSaleSupported: true,
    bulkPriceDiscovery: openSeaBulkPriceDiscovery,
    fee: 250,
  },
  {
    name: "looksrare.org",
    address: ["0x5924A28caAF1cc016617874a2f0C3710d881f3c1"],
    marketplaceAddress: "0x59728544B08AB483533076417FbBB2fD0B17CE3a",
    bulkSaleSupported: true,
    bulkPriceDiscovery: looksRareBulkPriceDiscovery,
    fee: 200,
  },
  {
    name: "x2y2.io",
    address: ["0xD823C605807cC5E6Bd6fC0d7e4eEa50d3e2d66cd"],
    marketplaceAddress: "0x74312363e45dcaba76c59ec49a7aa8a65a67eed3",
    bulkSaleSupported: true,
    bulkPriceDiscovery: x2y2BulkPriceDiscovery,
    fee: 50,
  },
  {
    name: "Reservoir x2y2.io Proxy",
    address: ["0xD823C605807cC5E6Bd6fC0d7e4eEa50d3e2d66cd"],
    marketplaceAddress: "0x9ebfb53fa8526906738856848a27cb11b0285c3f",
    bulkSaleSupported: true,
    bulkPriceDiscovery: x2y2BulkPriceDiscovery,
    fee: 50,
  },
  {
    name: "Reservoir looksrare.org Proxy",
    address: ["0x5924A28caAF1cc016617874a2f0C3710d881f3c1"],
    marketplaceAddress: "0x9ebfb53fa8526906738856848a27cb11b0285c3f",
    bulkSaleSupported: true,
    bulkPriceDiscovery: looksRareBulkPriceDiscovery,
    fee: 200,
  },
  {
    name: "Reservoir opensea.io Proxy",
    address: [
      "0x0000a26b00c1F0DF003000390027140000fAa719",
      "0x8De9C5A032463C561423387a9648c5C7BCC5BC90",
      "0x34BA0f2379bF9B81D09f7259892e26A8b0885095",
    ],
    marketplaceAddress: "0x9ebfb53fa8526906738856848a27cb11b0285c3f",
    bulkSaleSupported: true,
    bulkPriceDiscovery: openSeaBulkPriceDiscovery,
    fee: 250,
  },
  {
    name: "Reservoir ens.vision Proxy",
    address: ["0xA7673aB3B0949a0EfCd818c86C71FFf7CD645ac7"],
    marketplaceAddress: "0x9ebfb53fa8526906738856848a27cb11b0285c3f",
    bulkSaleSupported: true,
    bulkPriceDiscovery: openSeaBulkPriceDiscovery,
    fee: 150,
  },
];
