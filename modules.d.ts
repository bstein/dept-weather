declare module 'weatherlink' {
  function WeatherLink(arg: Record<'apiKey' | 'apiSecret', string>): {
    getAllStations: () => Promise<import('./models/weatherlink').Stations>;
    getStations: (arg: { stationIds: number[] }) => Promise<import('./models/weatherlink').Stations>;
    getAllSensors: () => Promise<any>;
    getSensors: (arg: { sensorIds: number[] }) => Promise<any>;
    getSensorCatalog: () => Promise<any>;
    getAllSensorsWithSpecs: () => Promise<any>;
    getCurrent: (arg: { stationId: number }) => Promise<import('./models/weatherlink').CurrentConditions>;
    getHistoric: (arg: { stationId: number; startTimestamp: string; endTimestamp: string }) => Promise<any>;
  };

  export default WeatherLink;
}

declare module 'feels' {
  export interface Options {
    temp?: number | null;
    humidity?: number | null;
    speed?: number | null;
    dewPoint?: number | null;
    wvp?: number | null;
    round?: boolean | ((temp: number, from: string, to: string) => number);
    units?: {
      temp: string;
      speed: string;
    };
  }

  export type Method = 'HI' | 'AWBGT' | 'HI_CA' | 'AAT' | 'WCI';

  class Feels {
    constructor(opts: Options);
    like(methods: Method[] | Method): number;
  }

  export default Feels;
}

declare module 'geo2zip' {
  export declare type PointInput = string | number;
  export interface Options {
    limit: number;
  }
  export type ZIPCode = string;

  function geo2zip(location: PointInput[], extraOptions: Partial<Options> = {}): Promise<ZIPCode[]>;

  export default geo2zip;
}

declare module 'geodist' {
  export declare type Point = number[] | { lat: number; lon: number };
  export interface Options {
    exact?: boolean;
    limit?: number;
    unit?: string;
  }

  function getDistance(start: Point, end: Point, options?: Options): number;

  export default getDistance;
}
