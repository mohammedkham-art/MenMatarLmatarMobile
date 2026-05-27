import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Airline, AirlineFare, Deal } from '../types';

/**
 * Snapshot d'un deal sauvegardé localement, suffisant pour rendre la
 * DealCard hors ligne (sans appel API). Le `bookingUrl` est conservé
 * pour permettre l'ouverture du lien même hors connexion.
 *
 * Les sous-objets airlineDetails / fare reprennent EXACTEMENT la forme
 * du backend (Deal.airlineDetails = Omit<Airline,'fares'>, Deal.fare =
 * AirlineFare) — coût de stockage négligeable, on garde KISS.
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
  airlineDetails: Omit<Airline, 'fares'> | null;
  fare: AirlineFare | null;
};

const STORAGE_KEY = 'favorites:deals:v2';
const LEGACY_STORAGE_KEY_V1 = 'favorites:deals:v1';

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
    airlineDetails: deal.airlineDetails,
    fare: deal.fare,
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
    slug: '',
    airlineId: snapshot.airlineDetails?.id ?? null,
    fareId: snapshot.fare?.id ?? null,
    isActive: true,
    isFeatured: false,
    isFlash: false,
    isTest: false,
    score: 0,
    updatedAt: snapshot.savedAt,
  };
}

export async function loadFavorites(): Promise<FavoriteDealSnapshot[]> {
  try {
    const rawV2 = await AsyncStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as unknown;
      return Array.isArray(parsed) ? (parsed as FavoriteDealSnapshot[]) : [];
    }

    // Migration douce depuis v1 : on enrichit chaque entrée des nouveaux
    // champs (null), on écrit v2, puis on supprime v1.
    const rawV1 = await AsyncStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (!rawV1) return [];

    const legacy = JSON.parse(rawV1) as unknown;
    if (!Array.isArray(legacy)) return [];

    const migrated = (
      legacy as Array<Omit<FavoriteDealSnapshot, 'airlineDetails' | 'fare'>>
    ).map((entry) => ({
      ...entry,
      airlineDetails: null,
      fare: null,
    }));

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    } catch {
      // Migration best-effort : on garde quand même la valeur en mémoire.
    }

    return migrated;
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
