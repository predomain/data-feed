import { generalConfigurations } from "src/configurations";
import { LogErrorTypesEnum } from "src/models/log";

const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m", // Scarlet
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m",
  },
};

export class LogService {
  getLogTime(color = colours.fg.green) {
    const time = new Date();
    return (
      "[" +
      color +
      time.toLocaleDateString(generalConfigurations.serverLocale) +
      " " +
      time.toLocaleTimeString(generalConfigurations.serverLocale) +
      colours.reset +
      "]"
    );
  }

  error(type: LogErrorTypesEnum, message: any, extraData: any = null) {
    let err = message;
    if (typeof message === "object") {
      err = JSON.stringify(err);
    }
    process.stdout.write(this.getLogTime(colours.fg.red) + ": " + err + "\n");
  }

  print(message: any) {
    process.stdout.write(this.getLogTime() + ": " + message + "\n");
  }

  /**
   * Used to hang up the application and prevent it from exiting
   */
  hangUp() {
    setInterval(() => {}, 1000);
  }
}
