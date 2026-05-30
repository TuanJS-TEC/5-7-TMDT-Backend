import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RevenueDashboardDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { PageError, PageLoading } from '../../src/components/PageState';
import { formatPrice } from '../../src/utils/format';
import { colors } from '../../src/theme/colors';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Redirect href="/" />;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => api<RevenueDashboardDto>('/admin/revenue/dashboard'),
  });

  if (isLoading) return <PageLoading />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : 'Lỗi'} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Tổng doanh thu</Text>
        <Text style={styles.statValue}>{formatPrice(data?.totalRevenueVnd ?? 0)}</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statLabel}>Số đơn</Text>
        <Text style={styles.statValue}>{data?.totalOrders ?? 0}</Text>
      </View>
      <Text style={styles.section}>Giao dịch gần đây</Text>
      {(data?.recentTransactions ?? []).map((tx) => (
        <View key={tx.id} style={styles.row}>
          <Text style={styles.rowId}>{tx.id.slice(0, 8)}…</Text>
          <Text>{formatPrice(tx.amountVnd)}</Text>
          <Text style={styles.status}>{tx.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: 16, gap: 12 },
  stat: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: { color: colors.muted, fontSize: 13 },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.brand900, marginTop: 4 },
  section: { fontWeight: '700', color: colors.brand900, marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowId: { color: colors.muted, fontSize: 12 },
  status: { color: colors.brand600, fontSize: 12 },
});
