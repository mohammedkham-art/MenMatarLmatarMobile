import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchCountries,
  fetchDeals,
  fetchDestinations,
} from '../services/api';
import type { Country, Deal, Destination } from '../types';

type AppDataContextValue = {
  deals: Deal[];
  countries: Country[];
  simulatorDestinations: Destination[];
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  refresh: () => void;
  retry: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [simulatorDestinations, setSimulatorDestinations] = useState<
    Destination[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [nextDeals, nextCountries, nextSimulatorDestinations] =
          await Promise.all([
            fetchDeals(),
            fetchCountries(),
            fetchDestinations('simulator'),
          ]);

        if (!isMounted) {
          return;
        }

        setDeals(nextDeals);
        setCountries(nextCountries);
        setSimulatorDestinations(nextSimulatorDestinations);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les données.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRetryKey((key) => key + 1);
  }, []);

  const retry = useCallback(() => {
    setRetryKey((key) => key + 1);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      deals,
      countries,
      simulatorDestinations,
      isLoading,
      isRefreshing,
      loadError,
      refresh,
      retry,
    }),
    [
      deals,
      countries,
      simulatorDestinations,
      isLoading,
      isRefreshing,
      loadError,
      refresh,
      retry,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}
