import Fuse from 'fuse.js';
import { readFile } from 'fs/promises';
import path from 'path';
import turf from '@turf/distance';
import {
  API_COORDINATES_KEY,
  API_GEONAMEID_KEY,
  CITY_SEARCH_CITIES_BY_ID_FILENAME,
  CITY_SEARCH_CITIES_FILENAME,
  CITY_SEARCH_DATA_FOLDER,
  CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL,
  CITY_SEARCH_FUSE_OPTIONS,
  CITY_SEARCH_INDEX_FILENAME,
  CITY_SEARCH_POPULATION_SORT_THRESHOLD,
  CITY_SEARCH_QUERY_CACHE_FILENAME,
  CITY_SEARCH_RESULT_LIMIT
} from '@constants';
import { CoordinatesHelper, NumberHelper, SearchQueryHelper } from 'helpers';
import { CitiesById, CitiesQueryCache, City, ClosestCity, FullCity, InputCity } from 'models/cities';
import { Unit } from 'models';
import { LoggerHelper } from './logger-helper';

export class CitiesHelper {
  private static readonly CLASS_NAME = 'CitiesHelper';

  private static sortByPopulation(a: FullCity, b: FullCity) {
    return b.population - a.population;
  }

  private static mapToCity(extendedCity: City): City {
    return {
      cityName: extendedCity.cityName,
      stateCode: extendedCity.stateCode,
      latitude: extendedCity.latitude,
      longitude: extendedCity.longitude,
      timeZone: extendedCity.timeZone,
      geonameid: extendedCity.geonameid
    };
  }

  private static async getFile(fName: string) {
    const dataDirectory = path.join(process.cwd(), CITY_SEARCH_DATA_FOLDER);
    const fileContents = await readFile(path.join(dataDirectory, fName), 'utf8');
    return JSON.parse(fileContents);
  }

  private static usCitiesPromise: Promise<FullCity[]> = (async () => {
    const inputCities = (await this.getFile(CITY_SEARCH_CITIES_FILENAME)) as InputCity[];
    return inputCities.map(
      (inputCity: InputCity): FullCity => ({
        ...inputCity,
        cityAndStateCode: SearchQueryHelper.getCityAndStateCode(inputCity)
      })
    );
  })();
  private static usTopCitiesPromise: Promise<FullCity[]> = (async () => {
    const usCities = await this.usCitiesPromise;
    return [...usCities].sort(this.sortByPopulation).slice(0, CITY_SEARCH_RESULT_LIMIT);
  })();
  private static usCitiesByIdPromise: Promise<CitiesById> = (async () => {
    const citiesById = (await this.getFile(CITY_SEARCH_CITIES_BY_ID_FILENAME)) as CitiesById;
    return citiesById;
  })();
  private static queryCachePromise: Promise<CitiesQueryCache> = (async () => {
    return this.getFile(CITY_SEARCH_QUERY_CACHE_FILENAME);
  })();

  private static fuseIndexPromise: Promise<Fuse.FuseIndex<FullCity>> = (async () => {
    const unparsedIndex = await this.getFile(CITY_SEARCH_INDEX_FILENAME);
    return Fuse.parseIndex(unparsedIndex);
  })();
  private static fusePromise: Promise<Fuse<FullCity>> = (async () => {
    const usCities = await this.usCitiesPromise;
    const fuseIndex = await this.fuseIndexPromise;
    return new Fuse(usCities, CITY_SEARCH_FUSE_OPTIONS, fuseIndex);
  })();

  private static getFromCache = async (query: string) => {
    const queryCache = await this.queryCachePromise;
    const usCities = await this.usCitiesPromise;

    const item = queryCache[query.toLowerCase()];
    if (item?.length >= CITY_SEARCH_RESULT_LIMIT) {
      return item.map(refIndex => usCities[refIndex]);
    }

    return undefined;
  };

  private static getIdxOfDuplicateToRemove(topResults: Fuse.FuseResult<FullCity>[]) {
    // Loop through array backwards and compare i index with first occurring element with the same cityAndStateCode
    for (let i = topResults.length - 1; i > 0; --i) {
      const firstMatchIdxInArr = topResults.findIndex(
        (result: Fuse.FuseResult<FullCity>) => result.item.cityAndStateCode === topResults[i].item.cityAndStateCode
      );
      if (firstMatchIdxInArr !== i) {
        // There is more than one element with the same cityAndStateCode
        //  Return the index of the first occurring element if the population of the last occurring element is greater
        const idxToRemove =
          topResults[firstMatchIdxInArr].item.population < topResults[i].item.population ? firstMatchIdxInArr : i;
        return idxToRemove;
      }
    }
    return undefined;
  }

  private static getTopResults(results: Fuse.FuseResult<FullCity>[]) {
    const desiredSize = Math.min(results.length, CITY_SEARCH_RESULT_LIMIT);
    let idxOfNextElem = desiredSize;
    const topResults = results.slice(0, idxOfNextElem);

    // Greedily remove duplicates from topResults and replace them if there are more elements in results
    let idxOfDuplicateToRemove: number | undefined;
    while ((idxOfDuplicateToRemove = this.getIdxOfDuplicateToRemove(topResults)) !== undefined) {
      topResults.splice(idxOfDuplicateToRemove, 1);
      if (results.length > idxOfNextElem) {
        topResults.push(results[idxOfNextElem++]);
      }
    }

    // Sort results that score below (i.e., numerically greater than) threshold by population
    const firstBeyondThreshold = topResults.findIndex(
      result => !result.score || result.score > CITY_SEARCH_POPULATION_SORT_THRESHOLD
    );
    const resultsBeyondThreshold = firstBeyondThreshold >= 0 ? topResults.splice(firstBeyondThreshold) : [];
    resultsBeyondThreshold.sort((a, b) => this.sortByPopulation(a.item, b.item));
    topResults.push(...resultsBeyondThreshold);
    return topResults;
  }

  static async searchFor(query: string) {
    const perfStart = performance.now();
    if (!query.length) {
      return (await this.usTopCitiesPromise).map(this.mapToCity);
    }

    let cities = await this.getFromCache(query);
    if (cities == null) {
      const fuse = await this.fusePromise;
      const results = fuse.search(query);
      const topResults = this.getTopResults(results);
      cities = topResults.map(result => result.item);
    }

    const duration = performance.now() - perfStart;
    const formattedDuration = duration < 1000 ? `${duration}ms` : `${NumberHelper.round(duration / 1_000, 2)}s`;
    LoggerHelper.getLogger(`${this.CLASS_NAME}.searchFor()`).verbose(`"${query}" took ${formattedDuration}`);
    return cities.map(this.mapToCity);
  }

  static async getCityWithId(geonameidStr: string) {
    const geonameid = Number(geonameidStr);
    if (Number.isInteger(geonameid) && geonameid > 0) {
      const usCitiesById = await this.usCitiesByIdPromise;
      const match = usCitiesById[String(geonameid)];
      if (match != null) {
        return this.mapToCity({
          ...match,
          geonameid: geonameid
        });
      }
    }
  }

  static async getClosestCity(coordinatesNumArr: number[]): Promise<ClosestCity | undefined> {
    const usCities = await this.usCitiesPromise;
    let radDistanceToClosestCity = Number.MAX_SAFE_INTEGER;
    let closestCity: FullCity | undefined;
    for (const city of usCities) {
      const radDistanceToCity = turf(coordinatesNumArr, CoordinatesHelper.cityToNumArr(city), { units: 'radians' });
      if (radDistanceToCity < radDistanceToClosestCity) {
        closestCity = city;
        radDistanceToClosestCity = radDistanceToCity;
      }
    }
    return closestCity != null
      ? {
          ...this.mapToCity(closestCity),
          distanceFromQueried: NumberHelper.round(
            turf(coordinatesNumArr, CoordinatesHelper.cityToNumArr(closestCity), {
              units: Unit.MILES
            }),
            CITY_SEARCH_DISTANCE_TO_QUERIED_ROUNDING_LEVEL
          ) as number
        }
      : undefined;
  }
}
