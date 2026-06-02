import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { formatPrice } from '../../src/utils/format';

interface PackageInfo {
  type: string;
  name: string;
  priceVnd: number;
  durationDays: number;
}

interface OrderView {
  orderId: string;
  status: string;
  amountVnd: number;
  vietQr?: {
    imageUrl?: string;
    transferContent?: string;
    bankName?: string;
    accountNoMasked?: string;
  };
}

export default function SellerOrdersScreen() {
  const { user } = useAuth();
  const { listingId: listingIdParam } = useLocalSearchParams<{ listingId?: string }>();
  const [listingId, setListingId] = useState(listingIdParam ?? '');
  const [pkgType, setPkgType] = useState('premium');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: () => api<PackageInfo[]>('/listings/packages'),
  });

  const { data: order, refetch: refetchOrder } = useQuery({
    queryKey: ['payment-order', lastOrderId],
    queryFn: () =>
      api<{ success: boolean; data: OrderView }>(
        `/payments/orders/${encodeURIComponent(lastOrderId!)}`,
      ).then((r) => r.data),
    enabled: !!lastOrderId,
    refetchInterval: (q) => (q.state.data?.status === 'success' ? false : 3000),
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      const pkg = packages?.find((p) => p.type === pkgType);
      const res = await api<{ success: boolean; data: { orderId: string } }>('/payments/orders', {
        method: 'POST',
        body: JSON.stringify({
          listingPackageType: pkgType,
          amountVnd: pkg?.priceVnd ?? 199_000,
          listingId: listingId.trim() || undefined,
          paymentMethod: 'qr_banking',
        }),
      });
      return res.data.orderId;
    },
    onSuccess: async (orderId) => {
      setLastOrderId(orderId);
      await api(`/payments/orders/${encodeURIComponent(orderId)}/vietqr`, { method: 'POST' });
      void refetchOrder();
    },
  });

  useEffect(() => {
    if (listingIdParam) setListingId(listingIdParam);
  }, [listingIdParam]);

  if (!user || user.role !== 'seller') {
    return <Redirect href="/(auth)/login" />;
  }

  const selectedPkg = packages?.find((p) => p.type === pkgType);
  const qrContent = order?.vietQr?.transferContent ?? order?.vietQr?.imageUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Mã tin (tùy chọn)</Text>
      <TextInput style={styles.input} value={listingId} onChangeText={setListingId} placeholder="listing-id" />
      <Text style={styles.label}>Gói tin</Text>
      <View style={styles.row}>
        {(packages ?? []).map((p) => (
          <Pressable
            key={p.type}
            style={[styles.chip, pkgType === p.type && styles.chipActive]}
            onPress={() => setPkgType(p.type)}
          >
            <Text style={pkgType === p.type ? styles.chipTextActive : styles.chipText}>{p.name}</Text>
          </Pressable>
        ))}
      </View>
      {selectedPkg ? (
        <Text style={styles.meta}>
          {formatPrice(selectedPkg.priceVnd)} · {selectedPkg.durationDays} ngày
        </Text>
      ) : null}
      <Pressable
        style={styles.btn}
        onPress={() => createOrder.mutate()}
        disabled={createOrder.isPending}
      >
        {createOrder.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Tạo đơn & VietQR</Text>
        )}
      </Pressable>
      {order ? (
        <View style={styles.orderBox}>
          <Text style={styles.orderTitle}>Đơn {order.orderId}</Text>
          <Text style={styles.meta}>Trạng thái: {order.status}</Text>
          {order.status === 'success' ? (
            <Text style={styles.success}>Thanh toán thành công!</Text>
          ) : null}
          {order.vietQr?.imageUrl ? (
            <Image source={{ uri: order.vietQr.imageUrl }} style={styles.qrImage} />
          ) : qrContent ? (
            <View style={styles.qrWrap}>
              <QRCode value={qrContent} size={200} />
            </View>
          ) : null}
          {order.vietQr?.transferContent ? (
            <Text style={styles.transfer}>{order.vietQr.transferContent}</Text>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  label: { fontWeight: '600', color: colors.brand900 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  meta: { color: colors.muted },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  orderBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: { fontWeight: '700', fontSize: 16 },
  success: { color: colors.success, fontWeight: '600' },
  qrImage: { width: 220, height: 220 },
  qrWrap: { padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  transfer: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
