import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider } from '../src/context/AuthContext';
import { QueryProvider } from '../src/context/QueryProvider';
import { initSentry } from '../src/lib/sentry';

export default function RootLayout() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <QueryProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerTintColor: '#1e3a5f' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ title: 'Đăng nhập' }} />
          <Stack.Screen name="(auth)/register" options={{ title: 'Đăng ký' }} />
          <Stack.Screen name="listing/[id]" options={{ title: 'Chi tiết xe' }} />
          <Stack.Screen name="seller/create" options={{ title: 'Đăng tin mới' }} />
          <Stack.Screen name="seller/edit/[id]" options={{ title: 'Sửa tin' }} />
          <Stack.Screen name="seller/orders" options={{ title: 'Thanh toán gói tin' }} />
          <Stack.Screen name="admin/moderation" options={{ title: 'Kiểm duyệt' }} />
          <Stack.Screen name="admin/dashboard" options={{ title: 'Doanh thu' }} />
          <Stack.Screen name="admin/car-makes" options={{ title: 'Hãng xe' }} />
          <Stack.Screen name="admin/sold" options={{ title: 'Đã bán' }} />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  );
}
