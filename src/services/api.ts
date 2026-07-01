import { Platform } from 'react-native';

import type {
  Country,
  Deal,
  Destination,
  TripSimulationRequest,
  TripSimulationResult,
} from '../types';
import type { PushPreferences } from './push-storage';

const defaultApiBaseUrl = 'https://menmatarlmatar.ma';

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl;

// AbortSignal.timeout() n'est pas supporté par Hermes (moteur JS de React Native).
// On utilise AbortController + setTimeout comme alternative compatible.
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

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
    signal: timeoutSignal(15_000),
  });

  return payload.deals;
}

export async function fetchDeal(id: string) {
  const payload = await requestJson<{ deal: Deal }>(`/api/mobile/deals/${id}`, {
    signal: timeoutSignal(15_000),
  });

  return payload.deal;
}

export async function fetchCountries() {
  const payload = await requestJson<{ countries: Country[] }>(
    '/api/mobile/countries',
    {
      signal: timeoutSignal(15_000),
    },
  );

  return payload.countries;
}

export async function fetchDestinations(mode: 'public' | 'simulator') {
  const suffix = mode === 'simulator' ? '?mode=simulator' : '';
  const payload = await requestJson<{ destinations: Destination[] }>(
    `/api/mobile/destinations${suffix}`,
    { signal: timeoutSignal(15_000) },
  );

  return payload.destinations;
}

export type RegisterPushTokenInput = {
  token: string;
  prefs: PushPreferences;
  appVersion?: string;
  /**
   * Forward-compat hooks: not currently consumed by the backend
   * validator (lib/validators/push.ts) but sent in the payload so a
   * future server update can pick them up without a mobile release.
   */
  locale?: string;
  region?: string;
};

export type RegisterPushTokenResult =
  | { ok: true }
  | { ok: false; error: string };

export type UnregisterPushTokenResult = RegisterPushTokenResult;

const PUSH_RETRY_DELAYS_MS = [1000, 3000, 9000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shared POST-with-retry helper for the push endpoints. Never throws.
 *
 * Retries 3 times with backoff 1s / 3s / 9s on network errors and on
 * 5xx / 429. Stops immediately on 4xx (other than 429) — those mean
 * the payload is invalid, retrying won't help.
 */
async function pushPostWithRetry(
  path: string,
  payload: unknown,
): Promise<RegisterPushTokenResult> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { ok: false, error: 'unsupported_platform' };
  }

  const body = JSON.stringify(payload);
  const url = `${apiBaseUrl}${path}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: timeoutSignal(15_000),
      });

      if (response.ok) {
        return { ok: true };
      }

      // 4xx (except 429): client error, retrying won't help.
      if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429
      ) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        return {
          ok: false,
          error: data.error ?? `http_${response.status}`,
        };
      }

      // 5xx or 429: fall through to retry.
    } catch {
      // Network / abort / unknown: fall through to retry.
    }

    if (attempt < PUSH_RETRY_DELAYS_MS.length - 1) {
      await sleep(PUSH_RETRY_DELAYS_MS[attempt]);
    }
  }

  return { ok: false, error: 'network' };
}

export async function registerPushToken(
  input: RegisterPushTokenInput,
): Promise<RegisterPushTokenResult> {
  return pushPostWithRetry('/api/mobile/push/register', {
    expoPushToken: input.token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    appVersion: input.appVersion,
    notifyCheapDeals: input.prefs.cheap,
    notifyFlashDeals: input.prefs.flash,
    locale: input.locale,
    region: input.region,
  });
}

export async function unregisterPushToken(
  token: string,
): Promise<UnregisterPushTokenResult> {
  return pushPostWithRetry('/api/mobile/push/unregister', {
    expoPushToken: token,
  });
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
    signal: timeoutSignal(55_000),
  });

  if (!payload.plan) {
    throw new Error(payload.error ?? 'Impossible de générer le séjour.');
  }

  return payload.plan;
}
