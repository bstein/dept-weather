import { DetailedWindDirection, WindDirection } from 'models';
import { Geometry } from './geometry.model';
import { QuantitativeMinMaxValue, QuantitativeValue } from './quantitative-value.model';

export interface SummaryForecastResponse {
  geometry: Geometry;
  properties: SummaryForecast;
}

export interface SummaryForecast {
  units: string;
  forecastGenerator: string;
  generatedAt: string;
  updateTime: string;
  validTimes: string;
  elevation: QuantitativeValue;
  periods: SummaryForecastPeriod[];
}

export interface SummaryForecastPeriod {
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
