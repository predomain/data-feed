import { ethers } from "ethers";
import { GlobalModel } from "src/models/global.model";
import { EnsService } from "src/services/ens";
import { MiscService } from "src/services/misc";
import { CategoryDataModel } from "./models";
const globalAny: GlobalModel = global as any;

export class DomainsService {
  constructor(
    protected miscService: MiscService,
    protected ensService: EnsService
  ) {}

  getDataSourceIdFromName(
    name: string,
    nameHash: string,
    dataSourceSets: CategoryDataModel
  ) {
    const isAlpha = this.miscService.testAlpha().test(name);
    const isNumeric = this.miscService.testIntNumeric().test(name);
    const isEmoji = this.miscService.testEmoji().test(name);
    const nameLength = this.ensService.getNameLength(name);
    const nameFirstChar = name[0];
    const nameSecondChar = name[1];
    const nameCodeHash = ethers.BigNumber.from(nameHash).toString();
    const idFirstChar = nameCodeHash[0];
    const idSecondChar = nameCodeHash[1];
    const pattern = new RegExp(dataSourceSets.pattern);
    if (isEmoji === false && dataSourceSets.max_length < nameLength) {
      return false;
    }
    if (
      isEmoji === true &&
      dataSourceSets.patterned === false &&
      idFirstChar in dataSourceSets.optimised === true &&
      idSecondChar in dataSourceSets.optimised === true &&
      dataSourceSets.optimised[idFirstChar][idSecondChar].includes(
        nameCodeHash
      ) === true
    ) {
      return dataSourceSets.category;
    }
    if (
      dataSourceSets.patterned === false &&
      nameFirstChar in dataSourceSets.optimised === true &&
      nameSecondChar in dataSourceSets.optimised === true &&
      dataSourceSets.optimised[nameFirstChar][nameSecondChar].includes(name) ===
        true
    ) {
      return dataSourceSets.category;
    }
    if (dataSourceSets.patterned === true && pattern.test(name) === true) {
      return dataSourceSets.category;
    }
    return false;
  }
}
