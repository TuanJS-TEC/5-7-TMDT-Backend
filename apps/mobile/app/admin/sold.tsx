import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { ListingCard } from '../../src/components/ListingCard';
import { PageLoading } from '../../src/components/PageState';
import { colors } from '../../src/theme/colors';

export default function AdminSoldScreen() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Redirect href="/" />;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sold'],
    queryFn: () => api<ListingDto[]>('/listings/admin/sold'),
  });

  if (isLoading) return <PageLoading />;

  return (
    <FlatList
      style={styles.container}
      data={data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <ListingCard listing={item} />}
      ListEmptyComponent={<Text style={styles.empty}>Chưa có tin đã bán</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  list: { padding: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
