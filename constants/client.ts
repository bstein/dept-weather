import { SearchResultCity } from '../models/cities';

export const APP_TITLE = 'DEPT® Weather';
export const APP_DESCRIPTION = `The ${APP_TITLE} app provides up-to-date weather information and forecasts for locations across the U.S.`;
export const APP_URL = 'https://dept-weather.vercel.app';
export const APP_THEME_COLOR = '#ffffff';
export const APP_MASK_ICON_COLOR = '#000000';
export const GID_CACHE_FILENAME = 'cities-top10000-gid-cache.json';
export const UI_ANIMATION_DURATION = 300;
export const GEOPOSITION_PERMISSION_DENIED_ERROR_CODE = 1;

export const CURRENT_LOCATION: SearchResultCity = {
  cityAndStateCode: 'Current Location',
  geonameid: 0
} as SearchResultCity;

export const CITY_SEARCH_DEBOUNCE_MS = 250;

export const LOCAL_STORAGE_RECENT_CITIES_KEY = 'recentCities';

export const IME_UNSETTLED_KEY_CODE = '229';
