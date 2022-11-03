import { useEffect, useRef, useState } from 'react';
import { CITY_SEARCH_DEBOUNCE_MS } from '../../constants';
import { CoordinatesHelper } from '../../helpers/coordinates-helper';
import { useDebounce } from '../../hooks';
import { APIRoute, getPath } from '../../models/api';
import { City } from '../../models/cities';
import styles from './SearchOverlay.module.css';
import homeStyles from '../../styles/Home.module.css';
import { US_STATE_CODES } from './us-state-codes';

const replaceLastSeparated = (query: string, splitOn: string) => {
  let fullStateName: string;
  const separatedQuery = query.split(splitOn);
  const lastIdx = separatedQuery.length - 1;
  if (
    separatedQuery.length > 1 &&
    Object.keys(US_STATE_CODES).includes((fullStateName = separatedQuery[lastIdx].trim().toUpperCase()))
  ) {
    console.log('found', fullStateName);
    separatedQuery[lastIdx] = separatedQuery[lastIdx].replace(
      new RegExp(fullStateName, 'i'),
      US_STATE_CODES[fullStateName]
    );
    console.log(separatedQuery[lastIdx]);
    const returnVal = separatedQuery.join(splitOn);
    console.log(returnVal);
    return returnVal;
  }
};

const formatQuery = (query: string) => {
  const formattedQuery = query.replaceAll('  ', ' ');
  return replaceLastSeparated(formattedQuery, ',') ?? replaceLastSeparated(formattedQuery, ' ') ?? formattedQuery;
};

export default function SearchOverlay({
  isInputFocused,
  rawSearchQuery
}: {
  isInputFocused: boolean;
  rawSearchQuery: string;
}) {
  const [formattedQuery, setFormattedQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const controllerRef = useRef<AbortController | undefined>();

  useEffect(() => {
    setFormattedQuery(formatQuery(rawSearchQuery));
  }, [rawSearchQuery]);

  const debouncedSearchQuery: string = useDebounce<string>(formattedQuery, CITY_SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const search = async (formattedQuery: string) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        setIsSearching(true);
        const res = await fetch(`${getPath(APIRoute.CITY_SEARCH)}?query=${formattedQuery}`, {
          signal: controllerRef.current?.signal
        });
        const resJSON = await res.json();
        setResults(resJSON.data);
        setIsSearching(false);
      } catch (e) {
        if (e instanceof Error && e?.name !== 'AbortError') {
          setResults([]);
          setIsSearching(false);
        }
      }
    };

    if (debouncedSearchQuery) {
      search(debouncedSearchQuery);
    } else {
      setResults([]);
    }
  }, [debouncedSearchQuery]);

  return (
    <div
      className={`${styles.search__overlay} ${
        isInputFocused ? styles['search__overlay--visible'] : styles['search__overlay--hidden']
      }`}
    >
      <div className={`${styles.search__overlay__inner} ${homeStyles['container__content--no-padding']}`}>
        {results.map((result, idx) => (
          // TODO - create css classes for the paragragh styles
          <p
            key={CoordinatesHelper.numArrToStr([result.latitude, result.longitude])}
            style={{
              textAlign: 'right',
              fontSize: '1.5rem',
              padding: '1rem 2.5rem 0rem',
              margin: '0rem',
              fontWeight: idx === 0 ? 700 : 300
            }}
          >{`${result.cityName}, ${result.stateCode}`}</p>
        ))}
      </div>
    </div>
  );
}
