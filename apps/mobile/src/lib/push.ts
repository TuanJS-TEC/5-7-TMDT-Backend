import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../api/client';

export async function registerPushToken(userId: string): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  let pushToken: string;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    pushToken = tokenData.data;
  } catch {
    // Push tokens are unavailable in Expo Go without a real projectId — skip silently
    return;
  }

  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  await api('/notifications/devices/register', {
    method: 'POST',
    body: JSON.stringify({ userId, token: pushToken, platform }),
  });
}
