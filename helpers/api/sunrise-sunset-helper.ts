import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getSunrise, getSunset } from 'sunrise-sunset-js';
import { SunriseSunsetObservations } from '../../models/api';
import { QueriedLocation } from '../../models/cities';
import { SunriseSunset } from '../../models/sunrise-sunset';
import { CoordinatesHelper } from '../';
import { Cached, CacheEntry } from './cached';

dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.extend(utc);

type SunriseSunsetWithTz = { sunriseSunset: SunriseSunset } & Pick<QueriedLocation, 'timeZone'>;

export class SunriseSunsetHelper {
  static getSun(riseOrSet: 'rise' | 'set', queriedLocation: QueriedLocation, day: Dayjs) {
    try {
      const coordinatesNumArr = CoordinatesHelper.cityToNumArr(queriedLocation);
      const sunFn = riseOrSet === 'rise' ? getSunrise : getSunset;
      return dayjs(sunFn(coordinatesNumArr[0], coordinatesNumArr[1], day.toDate()));
    } catch (err) {
      console.log(
        `[SunriseSunsetHelper.getSun()]`,
        `Couldn't get sun${riseOrSet} for "${CoordinatesHelper.cityToStr(queriedLocation)}"`,
        err
      );
    }
  }

  private static readonly sunrisesunset = new Cached<SunriseSunsetWithTz, QueriedLocation>(
    async (queriedLocation: QueriedLocation) => {
      const currentLocalTime = dayjs().tz(queriedLocation.timeZone);

      let sunrise = this.getSun('rise', queriedLocation, currentLocalTime);
      if (sunrise != null) {
        if (sunrise.isBefore(currentLocalTime.startOf('day'))) {
          sunrise = this.getSun('rise', queriedLocation, currentLocalTime.add(1, 'day'));
        } else if (sunrise.isAfter(currentLocalTime.endOf('day'))) {
          sunrise = this.getSun('rise', queriedLocation, currentLocalTime.subtract(1, 'day'));
        }
      }

      let sunset = this.getSun('set', queriedLocation, currentLocalTime);
      if (sunrise != null && sunset != null) {
        if (sunset.isBefore(sunrise)) {
          sunset = this.getSun('set', queriedLocation, currentLocalTime.add(1, 'day'));
        } else if (sunset.isAfter(currentLocalTime.endOf('day'))) {
          sunset = this.getSun('rise', queriedLocation, currentLocalTime.subtract(1, 'day'));
        }
      }

      return {
        timeZone: queriedLocation.timeZone,
        sunriseSunset: {
          sunrise: sunrise?.unix() ?? null,
          sunset: sunset?.unix() ?? null
        }
      };
    },
    async (_: string, newItem: SunriseSunsetWithTz) => dayjs().tz(newItem.timeZone).endOf('day').unix(),
    true,
    '[SunriseSunsetHelper.sunrisesunset]'
  );
  static async getSunriseSunset(queriedLocation: QueriedLocation) {
    return this.sunrisesunset.get(CoordinatesHelper.cityToStr(queriedLocation), queriedLocation);
  }

  static mapSunriseSunsetToSunriseSunsetObservations(
    cacheEntry: CacheEntry<SunriseSunsetWithTz>
  ): SunriseSunsetObservations {
    return {
      ...cacheEntry.item.sunriseSunset,
      readTime: dayjs().tz(cacheEntry.item.timeZone).startOf('day').unix(),
      validUntil: cacheEntry.validUntil
    };
  }
}
