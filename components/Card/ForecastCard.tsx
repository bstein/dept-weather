import { useState } from 'react';
import { Color } from 'models';
import { NwsPeriod } from 'models/api';
import CardHeader from './CardHeader/CardHeader';
import Forecast from './Forecast/Forecast';
import ForecastTemps from './ForecastTemps/ForecastTemps';
import styles from './Card.module.css';

export default function ForecastCard({
  isLoading,
  latestReadTime,
  period,
  _key
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  period: NwsPeriod;
  _key: string;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <article className={styles.card}>
      <CardHeader
        isLoading={isLoading}
        lastUpdatedTime={latestReadTime}
        label={period.dayName}
        secondaryLabel={period.shortDateName}
        backgroundColor={Color.ONYX}
      ></CardHeader>
      <div className={styles['card-contents']}>
        <div className={`${styles['card-contents__overview']} ${styles['card-contents__overview--forecast']}`}>
          <ForecastTemps
            highTemperature={period.dayForecast?.temperature}
            lowTemperature={period.nightForecast?.temperature}
          ></ForecastTemps>
        </div>
        <div className={styles['card-contents__forecasts']}>
          <Forecast
            isDaytime={true}
            isExpanded={isExpanded}
            summaryForecast={period.dayForecast}
            hourlyForecasts={period.dayHourlyForecasts}
            _key={_key}
          ></Forecast>
          <Forecast
            isDaytime={false}
            isExpanded={isExpanded}
            summaryForecast={period.nightForecast}
            hourlyForecasts={period.nightHourlyForecasts}
            _key={_key}
          ></Forecast>
        </div>
      </div>
    </article>
  );
}
