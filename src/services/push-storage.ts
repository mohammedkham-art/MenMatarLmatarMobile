import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local persistence for the push-notification state.
 *
 * Atomic and standalone — does NOT depend on src/services/notifications.ts
 * or on the API client. The orchestration that ties these together lives
 * in higher-level hooks / layouts (4.4 / 4.5).
 *
 * Storage key is versioned (`v1`) so we can ship a migration later
 * (mirror of the favorites snapshot pattern).
 */

export type PushPreferences = {
  cheap: boolean;
  flash: boolean;
};

export type PushState = {
  token: string | null;
  prefs: PushPreferences;
  lastRegisterAt: string | null;
  appVersionAtRegister: string | null;
  onboardingDone: boolean;
};

const STORAGE_KEY = 'push:state:v1';

const DEFAULT_STATE: PushState = {
  token: null,
  prefs: { cheap: true, flash: true },
  lastRegisterAt: null,
  appVersionAtRegister: null,
  onboardingDone: false,
};

/**
 * Defensive parse: never throws. Returns the defaults when the stored
 * payload is missing, malformed, or partially shaped (older schema).
 * Unknown extra keys are dropped silently.
 */
function reconcile(raw: unknown): PushState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE };

  const parsed = raw as Partial<PushState> & {
    prefs?: Partial<PushPreferences>;
  };

  return {
    token: typeof parsed.token === 'string' ? parsed.token : null,
    prefs: {
      cheap:
        typeof parsed.prefs?.cheap === 'boolean'
          ? parsed.prefs.cheap
          : DEFAULT_STATE.prefs.cheap,
      flash:
        typeof parsed.prefs?.flash === 'boolean'
          ? parsed.prefs.flash
          : DEFAULT_STATE.prefs.flash,
    },
    lastRegisterAt:
      typeof parsed.lastRegisterAt === 'string' ? parsed.lastRegisterAt : null,
    appVersionAtRegister:
      typeof parsed.appVersionAtRegister === 'string'
        ? parsed.appVersionAtRegister
        : null,
    onboardingDone:
      typeof parsed.onboardingDone === 'boolean'
        ? parsed.onboardingDone
        : DEFAULT_STATE.onboardingDone,
  };
}

export async function loadPushState(): Promise<PushState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return reconcile(JSON.parse(raw) as unknown);
  } catch {
    // Storage unavailable or JSON corrupt — return defaults rather than crash.
    return { ...DEFAULT_STATE };
  }
}

/**
 * Merge a partial update into the current state and persist it.
 * `prefs` is shallow-merged so callers can update one toggle without
 * having to read the other.
 */
export async function savePushState(partial: Partial<PushState>): Promise<void> {
  try {
    const current = await loadPushState();
    const next: PushState = {
      ...current,
      ...partial,
      prefs: {
        ...current.prefs,
        ...(partial.prefs ?? {}),
      },
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: in-memory caller state remains correct for
    // the current session; we just lose persistence.
  }
}

export async function clearPushState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
