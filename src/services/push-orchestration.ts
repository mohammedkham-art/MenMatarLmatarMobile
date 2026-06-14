import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { registerPushToken } from './api';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from './notifications';
import { loadPushState, savePushState } from './push-storage';

/**
 * Orchestrates the three atomic modules (notifications / push-storage / api)
 * to decide whether a /register call is needed and, if so, perform it.
 *
 * This module never throws: every failure path is reported via the
 * `reason` field of the result, plus an optional `error` string.
 *
 * NOTE: not called from anywhere yet — wiring into app/_layout.tsx
 * happens in 4.5 (first-launch onboarding + automatic refresh).
 */

export type EnsurePushTokenReason =
  | 'first_register'
  | 'token_changed'
  | 'expired_24h'
  | 'version_changed'
  | 'skipped'
  | 'permission_denied'
  | 'no_device'
  | 'error';

export type EnsurePushTokenResult = {
  didRegister: boolean;
  reason: EnsurePushTokenReason;
  error?: string;
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function isOlderThan24h(iso: string | null): boolean {
  if (!iso) return true;
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > TWENTY_FOUR_HOURS_MS;
}

function getCurrentAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}

/**
 * Full registration flow.
 *
 * Decision tree once a token is obtained (status === 'ok'):
 *
 *   ┌─ stored token is null                  → 'first_register'  → POST
 *   ├─ stored token !== fresh token           → 'token_changed'   → POST
 *   ├─ lastRegisterAt > 24h ago               → 'expired_24h'     → POST
 *   ├─ appVersionAtRegister !== current ver.  → 'version_changed' → POST
 *   └─ otherwise                              → 'skipped'         (no-op)
 *
 * Storage is updated only when the POST succeeds. If the POST fails,
 * the next launch will retry naturally (the conditions still hold).
 */
export async function ensurePushTokenRegistered(): Promise<EnsurePushTokenResult> {
  const state = await loadPushState();
  const registration = await registerForPushNotifications();

  switch (registration.status) {
    case 'not_a_device':
      return { didRegister: false, reason: 'no_device' };
    case 'permission_denied':
      return { didRegister: false, reason: 'permission_denied' };
    case 'missing_project_id':
      return {
        didRegister: false,
        reason: 'error',
        error: 'missing_project_id',
      };
    case 'error':
      return {
        didRegister: false,
        reason: 'error',
        error:
          registration.error instanceof Error
            ? registration.error.message
            : 'unknown',
      };
    case 'ok':
      break;
  }

  const { token } = registration;
  const currentVersion = getCurrentAppVersion();

  let reason: Exclude<
    EnsurePushTokenReason,
    'permission_denied' | 'no_device' | 'error' | 'skipped'
  > | null = null;

  if (state.token === null) {
    reason = 'first_register';
  } else if (state.token !== token) {
    reason = 'token_changed';
  } else if (isOlderThan24h(state.lastRegisterAt)) {
    reason = 'expired_24h';
  } else if (state.appVersionAtRegister !== currentVersion) {
    reason = 'version_changed';
  }

  if (reason === null) {
    return { didRegister: false, reason: 'skipped' };
  }

  const result = await registerPushToken({
    token,
    prefs: state.prefs,
    appVersion: currentVersion ?? undefined,
  });

  if (!result.ok) {
    return { didRegister: false, reason: 'error', error: result.error };
  }

  await savePushState({
    token,
    lastRegisterAt: new Date().toISOString(),
    appVersionAtRegister: currentVersion,
  });

  return { didRegister: true, reason };
}

export type DisablePushNotificationsResult = {
  ok: boolean;
  error?: string;
};

/**
 * Tell the backend to drop our token, then clear the locally-stored
 * token / lastRegisterAt / appVersionAtRegister. Keeps onboardingDone
 * and prefs intact so the user is not nagged again.
 *
 * If the backend call fails, local state is NOT cleared so the next
 * launch / user retry can finish the job.
 */
export async function disablePushNotifications(): Promise<DisablePushNotificationsResult> {
  const state = await loadPushState();

  if (!state.token) {
    // Nothing registered server-side; just make sure local state is consistent.
    await savePushState({
      token: null,
      lastRegisterAt: null,
      appVersionAtRegister: null,
    });
    return { ok: true };
  }

  const result = await unregisterPushNotifications(state.token);

  if (result.ok) {
    await savePushState({
      token: null,
      lastRegisterAt: null,
      appVersionAtRegister: null,
    });
  }

  return result;
}

/**
 * Subscribe to Expo's token-rotation event and re-register automatically
 * whenever the token changes. Returns a handle the caller MUST call
 * `.remove()` on at unmount.
 *
 * Expo rotates tokens rarely (FCM credential rotation, OS reinstall,
 * etc.) but when it does, the stored token becomes useless until we
 * re-register.
 */
export function subscribeToTokenRotation(): { remove: () => void } {
  const subscription = Notifications.addPushTokenListener(() => {
    ensurePushTokenRegistered().catch(() => undefined);
  });

  return { remove: () => subscription.remove() };
}
