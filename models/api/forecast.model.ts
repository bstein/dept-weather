import { DataSource } from 'models';
import { Wind } from './observations.model';
import { QueriedCityInfo } from './queried-location-info.model';
import { BaseData } from './response.model';

export interface Forecast extends QueriedCityInfo {
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsForecast;
}

export interface NwsForecast extends BaseData {
  periods: NwsPeriod[];
}

export interface NwsPeriod {
  dayName: string;
  shortDateName: string;
  dayForecast: NwsPeriodForecast | null;
  dayHourlyForecasts: NwsHourlyPeriodForecast[];
  nightForecast: NwsPeriodForecast | null;
  nightHourlyForecasts: NwsHourlyPeriodForecast[];
}

export interface NwsPeriodForecast {
  start: number;
  startIsoTz: string;
  condition: string | null;
  temperature: number | null;
  wind: Wind;
  chanceOfPrecip: number | null;
}

export interface NwsHourlyPeriodForecast extends NwsPeriodForecast {
  startLabel: string;
  feelsLike: number | null;
  dewPoint: number | null;
  humidity: number | null;
  precipAmount: number | null;
}
