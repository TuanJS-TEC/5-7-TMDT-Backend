import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { ListingCard } from '../../src/components/ListingCard';
import { PageEmpty, PageError, PageLoading } from '../../src/components/PageState';
import { colors } from '../../src/theme/colors';

export default function FavoritesScreen() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () =>
      api<ListingDto[]>(`/listings/favorites?userId=${encodeURIComponent(user!.id)}`),
    enabled: !!user,
  });

  if (!user) return <Redirect href="/(auth)/login" />;

  if (isLoading) return <PageLoading label="Đang tải yêu thích…" />;
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
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <PageEmpty
            title="Chưa có xe yêu thích"
            description="Mở chi tiết xe và nhấn Lưu yêu thích"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50, padding: 12 },
  list: { paddingBottom: 24 },
});
