export interface CategoryDataModel {
  _id?: string;
  id?: string;
  category: string;
  ticker: string;
  data_providers: string[];
  patterned: boolean;
  pattern: string;
  alphabetical: boolean;
  numeric: boolean;
  emojis: boolean;
  special_characters: boolean;
  max_length: number;
  version: number;
  statistics: {
    previous_daily_volume: number;
    daily_volume: number;
    "daily_volume_timestamp:": number;
    previous_hourly_volume: number;
    hourly_volume: number;
    hourly_volume_timestamp: number;
    hourly_sales: number;
    previous_hourly_sales: number;
    hourly_sales_timestamp: number;
  };
  optimised?: any;
  valid_names: string[];
}
