import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Redirect } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { PageEmpty, PageError, PageLoading } from '../../src/components/PageState';
import { formatPrice } from '../../src/utils/format';
import { colors } from '../../src/theme/colors';

export default function SellerListingsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  if (!user || user.role !== 'seller') {
    return <Redirect href="/(auth)/login" />;
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => api<ListingDto[]>('/listings/me'),
  });

  const markSold = useMutation({
    mutationFn: (id: string) =>
      api(`/listings/${id}/mark-sold`, { method: 'PATCH' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['seller-listings'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/listings/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['seller-listings'] }),
  });

  if (isLoading) return <PageLoading />;
  if (isError) {
    return (
      <PageError
        message={error instanceof Error ? error.message : 'Lỗi'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Link href="/seller/create" asChild>
        <Pressable style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ Đăng tin mới</Text>
        </Pressable>
      </Link>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<PageEmpty title="Chưa có tin đăng" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {item.status} · {formatPrice(item.priceVnd)}
            </Text>
            {item.modificationRequestDetails ? (
              <Text style={styles.warn}>Cần chỉnh: {item.modificationRequestDetails}</Text>
            ) : null}
            <View style={styles.actions}>
              {(item.status === 'pending' || item.modificationRequestDetails) && (
                <Link href={`/seller/edit/${item.id}`} asChild>
                  <Pressable style={styles.actionBtn}>
                    <Text style={styles.actionText}>Sửa</Text>
                  </Pressable>
                </Link>
              )}
              {item.status === 'approved' && (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                    Alert.alert('Đánh dấu đã bán?', item.title, [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xác nhận',
                        onPress: () => markSold.mutate(item.id),
                      },
                    ])
                  }
                >
                  <Text style={styles.actionText}>Đã bán</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, styles.dangerBtn]}
                onPress={() =>
                  Alert.alert('Xóa tin?', undefined, [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xóa', style: 'destructive', onPress: () => remove.mutate(item.id) },
                  ])
                }
              >
                <Text style={styles.dangerText}>Xóa</Text>
              </Pressable>
              {item.status === 'approved' && (
                <Link href={`/seller/orders?listingId=${item.id}`} asChild>
                  <Pressable style={styles.actionBtn}>
                    <Text style={styles.actionText}>Nâng gói</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50, padding: 12 },
  createBtn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.brand900 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  warn: { color: colors.warning, marginTop: 6, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.brand100,
  },
  actionText: { color: colors.brand700, fontWeight: '600', fontSize: 13 },
  dangerBtn: { backgroundColor: '#fee2e2' },
  dangerText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
});
