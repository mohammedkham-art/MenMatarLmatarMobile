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
  clearFavorites as clearFavoritesStorage,
  dealToSnapshot,
  loadFavorites,
  saveFavorites,
  type FavoriteDealSnapshot,
} from '../services/storage';
import type { Deal } from '../types';

type FavoritesContextValue = {
  favorites: FavoriteDealSnapshot[];
  count: number;
  isReady: boolean;
  has: (dealId: string) => boolean;
  add: (deal: Deal) => void;
  remove: (dealId: string) => void;
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteDealSnapshot[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Hydrate depuis AsyncStorage au montage.
  useEffect(() => {
    let isMounted = true;

    loadFavorites().then((stored) => {
      if (isMounted) {
        setFavorites(stored);
        setIsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persiste à chaque changement (sauf pendant l'hydratation initiale).
  useEffect(() => {
    if (!isReady) return;
    saveFavorites(favorites);
  }, [favorites, isReady]);

  const has = useCallback(
    (dealId: string) => favorites.some((favorite) => favorite.id === dealId),
    [favorites],
  );

  const add = useCallback((deal: Deal) => {
    setFavorites((current) => {
      if (current.some((favorite) => favorite.id === deal.id)) {
        return current;
      }
      return [dealToSnapshot(deal), ...current];
    });
  }, []);

  const remove = useCallback((dealId: string) => {
    setFavorites((current) =>
      current.filter((favorite) => favorite.id !== dealId),
    );
  }, []);

  const clear = useCallback(() => {
    setFavorites([]);
    clearFavoritesStorage();
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      count: favorites.length,
      isReady,
      has,
      add,
      remove,
      clear,
    }),
    [favorites, isReady, has, add, remove, clear],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
