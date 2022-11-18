import { NextApiRequest, NextApiResponse } from 'next';
import {
  AirNowHelper,
  CacheEntry,
  CitiesReqQueryHelper,
  EpaHelper,
  LoggerHelper,
  NwsHelper,
  SunTimesHelper,
  WeatherlinkHelper
} from 'helpers/api';
import { DataSource } from 'models';
import { APIRoute, BaseObservations, getPath, Observations, Response } from 'models/api';

const LOGGER_LABEL = getPath(APIRoute.CURRENT);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { queriedLocation, warnings } = await CitiesReqQueryHelper.parseQueriedLocation(req.query);
    const promises: Array<Promise<CacheEntry<any>>> = [
      NwsHelper.getCurrent(queriedLocation),
      AirNowHelper.getCurrent(queriedLocation),
      EpaHelper.getHourly(queriedLocation),
      SunTimesHelper.getTimes(queriedLocation)
    ];
    if (WeatherlinkHelper.shouldUse(queriedLocation)) {
      promises.push(WeatherlinkHelper.getCurrent());
    }

    const results = await Promise.all(promises);
    const validUntil = Math.min(...results.map(result => result.validUntil));
    const maxAge = Math.min(...results.map(result => result.maxAge));

    const data: Observations = {
      [DataSource.NATIONAL_WEATHER_SERVICE]: NwsHelper.mapCurrentToNwsObservations(results[0], req.query),
      [DataSource.AIRNOW]: AirNowHelper.mapCurrentToAirNowObservations(results[1]),
      [DataSource.ENVIRONMENTAL_PROTECTION_AGENCY]: EpaHelper.mapHourlyToEpaHourlyForecast(results[2]),
      [DataSource.SUN_TIMES]: SunTimesHelper.mapTimesToSunTimesObservations(results[3]),
      [DataSource.QUERIED_LOCATION]: queriedLocation
    };
    if (results.length > 4) {
      data[DataSource.WEATHERLINK] = WeatherlinkHelper.mapCurrentToWlObservations(results[4], req.query);
    }
    const latestReadTime = Math.max(
      ...Object.values(data)
        .map((observation: BaseObservations) => observation.readTime)
        .filter(readTime => Number.isInteger(readTime))
    );

    const response: Response<Observations> = {
      data,
      warnings,
      errors: [],
      validUntil,
      latestReadTime
    };
    if (process.env.NODE_ENV !== 'development') {
      res.setHeader('Cache-Control', `public, immutable, stale-while-revalidate, max-age=${maxAge}`);
    }
    res.status(200).json(response);
  } catch (err) {
    LoggerHelper.getLogger(LOGGER_LABEL).error(err);
    const errorResponse: Response<null> = {
      data: null,
      warnings: [],
      errors: ['Failed to fetch data'],
      validUntil: 0,
      latestReadTime: 0
    };
    res.status(500).json(errorResponse);
  }
}
