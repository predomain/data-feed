import * as ethers from "ethers";

export class MiscService {
  testJSON(json: string) {
    const str = json.toString();
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Checks if the given string is a checksummed ethereum wallet address
   *
   * @param {String} address the given HEX adress
   * @return {Boolean}
   */
  checksumEtheruemAddress(address: string) {
    try {
      return ethers.utils.getAddress(address) === address;
    } catch (e) {
      return false;
    }
  }

  testIP() {
    const regTest = /^([0-9]+(\.|$)){4}/;
    return regTest;
  }

  testSerial() {
    const regTest = new RegExp("^[0-9]+$");
    return regTest;
  }

  testDecimal() {
    const regTest = new RegExp(/^-?\d+\.?\d*$/);
    return regTest;
  }

  testInteger() {
    const regTest = new RegExp("^[0-9]+$");
    return regTest;
  }

  testSQLInjectionCode() {
    const regTest = new RegExp(
      "('(''|[^'])*')|(;)|(=)|(\b(ALTER|CREATE|SHOW|TRUNCATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|UNION( +ALL){0,1})\b)"
    );
    return regTest;
  }

  testNumeric() {
    const reg = new RegExp(/^(0|[1-9]\d*)(\.\d+)?$/);
    return reg;
  }

  testAlphaNumeric() {
    const reg = new RegExp("^(?=.*[0-9])(?=.*[a-zA-Z])([a-zA-Z0-9]+)$");
    return reg;
  }

  testAlpha() {
    const reg = new RegExp("^[A-Za-z]+$");
    return reg;
  }

  testEmoji() {
    const reg = new RegExp(/\p{Extended_Pictographic}{1,1000}/u);
    return reg;
  }

  testIntNumeric() {
    const reg = new RegExp("^[0-9]+$");
    return reg;
  }
}
