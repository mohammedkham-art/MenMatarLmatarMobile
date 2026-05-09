import type {
  Deal,
  Destination,
  TripSimulationRequest,
  TripSimulationResult,
} from './types';

const defaultApiBaseUrl = 'https://menmatarlmatar.ma';

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl;

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, init);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'Le simulateur met trop de temps à répondre. Essaie avec une durée plus courte ou relance dans quelques secondes.',
      );
    }

    throw new Error(
      'Impossible de joindre le serveur. Vérifie ta connexion internet et réessaie.',
    );
  }

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Une erreur est survenue.');
  }

  return payload;
}

export async function fetchDeals() {
  const payload = await requestJson<{ deals: Deal[] }>('/api/mobile/deals', {
    signal: AbortSignal.timeout(15_000),
  });

  return payload.deals;
}

export async function fetchDestinations(mode: 'public' | 'simulator') {
  const suffix = mode === 'simulator' ? '?mode=simulator' : '';
  const payload = await requestJson<{ destinations: Destination[] }>(
    `/api/mobile/destinations${suffix}`,
    { signal: AbortSignal.timeout(15_000) },
  );

  return payload.destinations;
}

export async function simulateTrip(params: TripSimulationRequest) {
  const payload = await requestJson<{
    plan?: TripSimulationResult;
    error?: string;
  }>('/api/simulator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(55_000),
  });

  if (!payload.plan) {
    throw new Error(payload.error ?? 'Impossible de générer le séjour.');
  }

  return payload.plan;
}
