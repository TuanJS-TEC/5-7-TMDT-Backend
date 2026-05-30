import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '../api/client';

export async function registerPushToken(userId: string): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  await api('/notifications/devices/register', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      token: tokenData.data,
      platform,
    }),
  });
}
