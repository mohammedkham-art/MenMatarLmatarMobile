import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Deal } from '../types';

/**
 * Snapshot d'un deal sauvegardé localement, suffisant pour rendre la
 * DealCard hors ligne (sans appel API). Le `bookingUrl` est conservé
 * pour permettre l'ouverture du lien même hors connexion.
 */
export type FavoriteDealSnapshot = Pick<
  Deal,
  | 'id'
  | 'title'
  | 'fromCity'
  | 'toCity'
  | 'fromAirport'
  | 'toAirport'
  | 'countryCode'
  | 'visaType'
  | 'priceMad'
  | 'airline'
  | 'departureDate'
  | 'returnDate'
  | 'bookingUrl'
  | 'tags'
  | 'lastCheckedAt'
  | 'createdAt'
> & {
  savedAt: string;
};

const STORAGE_KEY = 'favorites:deals:v1';

export function dealToSnapshot(deal: Deal): FavoriteDealSnapshot {
  return {
    id: deal.id,
    title: deal.title,
    fromCity: deal.fromCity,
    toCity: deal.toCity,
    fromAirport: deal.fromAirport,
    toAirport: deal.toAirport,
    countryCode: deal.countryCode,
    visaType: deal.visaType,
    priceMad: deal.priceMad,
    airline: deal.airline,
    departureDate: deal.departureDate,
    returnDate: deal.returnDate,
    bookingUrl: deal.bookingUrl,
    tags: deal.tags,
    lastCheckedAt: deal.lastCheckedAt,
    createdAt: deal.createdAt,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Reconstitue un objet `Deal` complet à partir d'un snapshot,
 * en remplissant les champs manquants par des valeurs neutres.
 * Utilisé pour passer la snapshot à <DealCard deal={...} />.
 */
export function snapshotToDeal(snapshot: FavoriteDealSnapshot): Deal {
  return {
    ...snapshot,
    isActive: true,
    isFeatured: false,
    score: 0,
    updatedAt: snapshot.savedAt,
  };
}

export async function loadFavorites(): Promise<FavoriteDealSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as FavoriteDealSnapshot[];
  } catch {
    return [];
  }
}

export async function saveFavorites(
  favorites: FavoriteDealSnapshot[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Stockage indisponible : on ignore silencieusement.
    // L'état en mémoire reste correct pour la session en cours.
  }
}

export async function clearFavorites(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
