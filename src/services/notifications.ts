import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { unregisterPushToken } from './api';
import { colors } from '../theme/colors';

/**
 * Atomic push-notification service.
 *
 * This module knows how to obtain an Expo push token from the device.
 * It does NOT call the backend, persist anything, or orchestrate any
 * first-launch flow — that lives in 4.3 / 4.4 / 4.5.
 *
 * Public API:
 *   - registerForPushNotifications(): get the Expo push token
 *   - ANDROID_NOTIFICATION_CHANNEL_ID: name of the channel we create
 */

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'default';

export type PushRegistrationResult =
  | { status: 'ok'; token: string }
  | { status: 'permission_denied'; permissionStatus: 'denied' | 'undetermined' }
  | { status: 'not_a_device' }
  | { status: 'missing_project_id' }
  | { status: 'error'; error: unknown };

/**
 * Create / update the Android notification channel. No-op on iOS.
 * Idempotent — safe to call every launch.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(
    ANDROID_NOTIFICATION_CHANNEL_ID,
    {
      name: 'Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: colors.primary,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    },
  );
}

/**
 * Read the current permission status; ask only if not yet granted.
 * The Android 13+ POST_NOTIFICATIONS prompt is handled automatically
 * by expo-notifications via the plugin.
 */
async function ensurePermission(): Promise<Notifications.NotificationPermissionsStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return current;
  return Notifications.requestPermissionsAsync();
}

/**
 * Atomic registration: create the Android channel, ensure permission,
 * fetch the Expo push token tied to our EAS projectId.
 *
 * Never throws on expected failure paths (simulator, denied permission,
 * missing projectId). Wraps everything in a try/catch so unexpected
 * errors are reported as { status: 'error' } rather than crashing the
 * caller.
 */
export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  try {
    if (!Device.isDevice) {
      return { status: 'not_a_device' };
    }

    await ensureAndroidChannel();

    const permission = await ensurePermission();
    if (permission.status !== 'granted') {
      return {
        status: 'permission_denied',
        permissionStatus: permission.status,
      };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as
      | string
      | undefined;
    if (!projectId) {
      return { status: 'missing_project_id' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return { status: 'ok', token };
  } catch (error) {
    return { status: 'error', error };
  }
}

export type UnregisterPushResult = { ok: boolean; error?: string };

/**
 * Tell the backend to drop our token from push_tokens. Idempotent on
 * the server side (returns ok even if the token was unknown).
 *
 * Note: the OS-level notification permission is NOT revoked — that's
 * only possible from the system settings. This call just stops the
 * server from sending us anything new.
 */
export async function unregisterPushNotifications(
  token: string,
): Promise<UnregisterPushResult> {
  return unregisterPushToken(token);
}
