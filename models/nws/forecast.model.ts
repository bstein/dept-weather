import { WindDirection } from '../wind-direction.enum';
import { Geometry } from './geometry.model';
import { QuantitativeMinMaxValue, QuantitativeValue } from './quantitative-value.model';

export interface ForecastResponse {
  geometry: Geometry;
  properties: Forecast;
}

export interface Forecast {
  units: string;
  forecastGenerator: string;
  generatedAt: string;
  updateTime: string;
  validTimes: string;
  elevation: QuantitativeValue;
  periods: ForecastPeriod[];
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: QuantitativeValue;
  temperatureTrend: TemperatureTrend | null;
  windSpeed: QuantitativeValue | QuantitativeMinMaxValue;
  windGust: QuantitativeValue | QuantitativeMinMaxValue;
  windDirection: WindDirection | DetailedWindDirection;
  shortForecast: string;
  detailedForecast: string;
}

export enum TemperatureTrend {
  RISING = 'rising',
  FALLING = 'falling'
}

export enum DetailedWindDirection {
  NNE = 'NNE',
  ENE = 'ENE',
  ESE = 'ESE',
  SSE = 'SSE',
  SSW = 'SSW',
  WSW = 'WSW',
  WNW = 'WNW',
  NNW = 'NNW'
}
