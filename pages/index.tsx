import Head from 'next/head';
import { NextRouter, useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { Footer, ForecastCard, Header, ObservationsCard } from '../components';
import { API_GEONAMEID_KEY, APP_TITLE, DEFAULT_CITY } from '../constants';
import { APIRoute, Forecast, getPath, NwsForecastPeriod, Observations, Response, QueryParams } from '../models/api';
import { City } from '../models/cities';
import styles from '../styles/Home.module.css';

const getGeonameidFromUrl = (router: NextRouter) => {
  let geonameidStr = router.query[API_GEONAMEID_KEY];
  if (typeof geonameidStr === 'string' && geonameidStr.length) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid >= 0) {
      return geonameid;
    }
  }
  return undefined;
};

const getQueryParamsForGeonameid = (geonameid: number): QueryParams => ({
  [API_GEONAMEID_KEY]: geonameid
});

const fetcher = (key: string) => fetch(key).then(res => res.json());

const useObservations = (
  queryParams: QueryParams
): { observations?: Response<Observations>; isLoading: boolean; isError: boolean } => {
  const { data, error } = useSWR<Response<Observations>>(
    queryParams != null ? getPath(APIRoute.CURRENT, queryParams) : null,
    fetcher
  );

  return {
    observations: data,
    isLoading: !error && !data,
    isError: error
  };
};

const useForecast = (
  queryParams: QueryParams
): { forecast?: Response<Forecast>; forecastIsLoading: boolean; forecastIsError: boolean } => {
  const { data, error } = useSWR<Response<Forecast>>(
    queryParams != null ? getPath(APIRoute.FORECAST, queryParams) : null,
    fetcher
  );

  return {
    forecast: data,
    forecastIsLoading: !error && !data,
    forecastIsError: error
  };
};

const ForecastCards = ({
  latestReadTime,
  forecasts
}: {
  latestReadTime: number;
  forecasts: Array<NwsForecastPeriod>;
}) => {
  const cards = [];

  let i = 0;
  if (!forecasts[0].isDaytime) {
    cards.push(<ForecastCard nightForecast={forecasts[0]} latestReadTime={latestReadTime} key={i++} />);
  }

  for (; i < forecasts.length; i += 2) {
    cards.push(
      <ForecastCard
        dayForecast={forecasts[i]}
        nightForecast={i + 1 < forecasts.length ? forecasts[i + 1] : undefined}
        latestReadTime={latestReadTime}
        key={i}
      />
    );
  }
  return cards;
};

export default function Home() {
  const router = useRouter();
  const geonameid = getGeonameidFromUrl(router);
  const [selectedCity, setSelectedCity] = useState<City | undefined>(undefined);
  const [queryParams, setQueryParams] = useState<QueryParams>(undefined);
  const controllerRef = useRef<AbortController | undefined>();

  useEffect(() => {
    if (geonameid != null) {
      setQueryParams(getQueryParamsForGeonameid(geonameid));
    } else if (selectedCity != null) {
      setQueryParams(getQueryParamsForGeonameid(selectedCity.geonameid));
    }
  }, [geonameid, selectedCity]);

  useEffect(() => {
    const searchAndSetSelectedCity = async (searchQueryParams: QueryParams) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const res = await fetch(getPath(APIRoute.CITY_SEARCH, searchQueryParams), {
          signal: controllerRef.current?.signal
        });
        const resJSON = await res.json();
        if (resJSON.data?.length) {
          setSelectedCity(resJSON.data[0]);
        } else {
          throw new Error('API did not return a result');
        }
      } catch (e) {
        if (e instanceof Error && e?.name !== 'AbortError') {
          setSelectedCity(DEFAULT_CITY);
        }
      }
    };

    if (geonameid != null) {
      if (selectedCity == null) {
        searchAndSetSelectedCity(getQueryParamsForGeonameid(geonameid));
      }
    } else if (router.isReady) {
      setSelectedCity(DEFAULT_CITY);
    }
  }, [geonameid, selectedCity, router.isReady]);

  useEffect(() => {
    if (selectedCity != null && geonameid !== selectedCity.geonameid) {
      const href = `/?${API_GEONAMEID_KEY}=${selectedCity.geonameid}`;
      router.push(href, href, { shallow: true });
    }
  }, [geonameid, selectedCity, router]);

  const { observations, isLoading, isError } = useObservations(queryParams);
  const { forecast, forecastIsLoading, forecastIsError } = useForecast(queryParams);

  const [showSearchOverlay, setShowSearchOverlay] = useState<boolean>(false);
  useEffect(() => {
    const className = 'overflow-y-hidden';
    showSearchOverlay ? document.body.classList.add(className) : document.body.classList.remove(className);
  }, [showSearchOverlay]);

  return (
    <div className={`${styles.container} ${showSearchOverlay ? styles['container--overlay-visible'] : ''}`}>
      <Head>
        <title>
          {selectedCity != null ? `${selectedCity.cityName}, ${selectedCity.stateCode} | ${APP_TITLE}` : APP_TITLE}
        </title>
        <meta
          name="description"
          content={`The ${APP_TITLE} app provides up-to-date weather information and forecasts for locations across the U.S.`}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header
        showSearchOverlay={showSearchOverlay}
        setShowSearchOverlay={setShowSearchOverlay}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      ></Header>
      <main className={styles.container__content}>
        {observations ? (
          !isError && observations.data ? (
            <ObservationsCard observations={observations}></ObservationsCard>
          ) : (
            <h2>Couldn’t fetch current conditions</h2>
          )
        ) : (
          <h2>Loading observations...</h2>
        )}
        {forecast ? (
          !forecastIsError && forecast.data?.nws?.forecasts?.length ? (
            ForecastCards({
              latestReadTime: forecast.latestReadTime,
              forecasts: forecast.data.nws.forecasts
            })
          ) : (
            <h2>Couldn’t fetch forecast</h2>
          )
        ) : (
          <h2>Loading forecast...</h2>
        )}
      </main>
      <Footer></Footer>
    </div>
  );
}
