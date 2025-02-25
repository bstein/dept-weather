import { Color } from 'models';
import { Observations, SunTimesObservations } from 'models/api';
import StandardCardHeader from './CardHeader/StandardCardHeader';
import Condition from './Condition/Condition';
import CurrentTemp from './CurrentTemp/CurrentTemp';
import { AirQuality, Humidity, Precipitation, Pressure, UVIndex, Wind } from './Measurement';
import styles from './Card.module.css';

const getIsNight = (sunData?: SunTimesObservations) => {
  let isNight = false;
  if (sunData?.sunrise != null && sunData?.sunset != null) {
    const now = new Date();
    const sunrise = new Date(sunData.sunrise * 1_000);
    const sunset = new Date(sunData.sunset * 1_000);
    isNight = now < sunrise || sunset < now;
  }
  return isNight;
};

export default function ObservationsCard({
  isLoading,
  latestReadTime,
  observations
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  observations?: Observations;
}) {
  return (
    <article className={styles.card}>
      <StandardCardHeader
        isLoading={isLoading}
        lastUpdatedTime={latestReadTime}
        label="Now"
        backgroundColor={Color.INDIGO}
      ></StandardCardHeader>
      <div className={styles['card-contents']}>
        <div className={styles['card-contents__overview']}>
          <CurrentTemp observations={observations?.wl ?? observations?.nws}></CurrentTemp>
          <Condition
            condition={observations?.nws?.textDescription}
            size="large"
            isNight={getIsNight(observations?.sun)}
          ></Condition>
        </div>
        <div className={styles['card-contents__measurements']}>
          <Wind wind={observations?.wl?.wind ?? observations?.nws?.wind} includeGustSpeed={true}></Wind>
          <UVIndex epaData={observations?.epa}></UVIndex>
          <AirQuality airnowData={observations?.airnow}></AirQuality>
          <Humidity humidity={observations?.wl?.humidity ?? observations?.nws?.humidity}></Humidity>
          <Pressure pressure={observations?.wl?.pressure ?? observations?.nws?.pressure}></Pressure>
          {observations?.wl?.rainfall?.last24Hrs != null ? (
            <Precipitation
              precipitation={observations.wl.rainfall.last24Hrs}
              label="Last 24hr Rainfall"
            ></Precipitation>
          ) : (
            <Precipitation
              precipitation={observations?.nws?.precipitation?.last6Hrs}
              label="Last 6hr Precip"
            ></Precipitation>
          )}
        </div>
      </div>
    </article>
  );
}
