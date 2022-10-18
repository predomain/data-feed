import { TaskTimingEnum } from "src/models/task";

export const volumeCheckConf = {
  ensRegistrarAddress: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
  ensTransferTopicIndicator:
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  salesDataRetentionForMs: 7889400000,
  salesMinimumDataToRetain: 500,
  maxTopSales: 5,
  maxTopCategory: 5,
  maxRecentSales: 5,
  updateMaxTopDataEvery: TaskTimingEnum.MINUTELY,
  dataFigures: {
    key: "volume",
    figures: {
      previous_minutely_volume: 0,
      minutely_volume: 0,
      previous_hourly_sales: 0,
      hourly_volume: 0,
      previous_hourly_volume: 0,
      daily_volume: 0,
      previous_daily_volume: 0,
      hourly_sales: 0,
      sales: [],
    },
  },
  rootVolumeDataFigure: {
    id: "root_volume",
    top_categories: [],
    top_sales: [],
    recent_sales: [],
    categories_daily_volume: [],
    categories_monthly_volume: [],
  },
};
