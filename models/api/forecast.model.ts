import { DataSource } from '../data-source.enum';
import { WindDirection } from '../wind-direction.enum';
import { Wind } from './observations.model';

export interface Forecast {
  [DataSource.NATIONAL_WEATHER_SERVICE]?: NwsForecast;
  // [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]?: EpaHourlyForecast;
  // [DataSource.SUNRISE_SUNSET]?: SunriseSunsetObservations;
}

export interface BaseForecast {
  readTime: number;
  validUntil: number;
}

export interface NwsForecast extends BaseForecast {
  forecasts: Array<NwsForecastPeriod>;
}

export interface NwsForecastPeriod {
  name: string | null;
  periodStart: number | null;
  periodEnd: number | null;
  isDaytime: boolean | null;
  temperature: number | null;
  wind: WindForecast | null;
  shortForecast: string | null;
  detailedForecast: string | null;
}

export interface WindForecast extends Omit<Wind, 'direction'> {
  minSpeed: number | null;
  maxSpeed: number | null;
  minGustSpeed: number | null;
  maxGustSpeed: number | null;
  direction: WindDirection | null;
}
