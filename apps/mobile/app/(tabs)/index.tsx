import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CarMakeOption, ListingListResult } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { ListingCard } from '../../src/components/ListingCard';
import { PageError, PageLoading } from '../../src/components/PageState';
import { colors } from '../../src/theme/colors';

const DEFAULT_MAKES = ['Toyota', 'Honda', 'Mazda', 'Hyundai', 'Kia', 'VinFast'];

function PressableChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');

  const queryKey = ['listings', search, make];

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '20', status: 'approved' });
      if (make) params.set('make', make);
      if (search.trim()) params.set('search', search.trim());
      return api<ListingListResult>(`/listings?${params}`);
    },
  });

  const { data: carMakes } = useQuery({
    queryKey: ['car-makes'],
    queryFn: async () => {
      const res = await api<{ items: CarMakeOption[] }>('/listings/car-makes');
      return res.items;
    },
  });

  const makes = carMakes?.map((m) => m.name) ?? DEFAULT_MAKES;

  const renderItem = useCallback(
    ({ item }: { item: ListingListResult['items'][0] }) => <ListingCard listing={item} />,
    [],
  );

  if (isLoading) return <PageLoading />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Car Marketplace</Text>
      <TextInput
        style={styles.input}
        placeholder="Tìm xe, hãng, model…"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      <FlatList
        horizontal
        data={['', ...makes]}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <PressableChip label={item || 'Tất cả'} active={make === item} onPress={() => setMake(item)} />
        )}
      />
      {isError ? (
        <PageError
          message={error instanceof Error ? error.message : 'Lỗi tải danh sách'}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Không tìm thấy tin đăng phù hợp</Text>
          }
          ListHeaderComponent={
            data ? (
              <Text style={styles.count}>{data.total} tin đăng</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50, padding: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.brand900, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  chips: { maxHeight: 40, marginBottom: 8 },
  chip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.muted, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 24 },
  count: { color: colors.muted, marginBottom: 8, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
