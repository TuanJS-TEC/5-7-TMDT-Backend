import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [make, setMake] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const queryKey = ['listings', debouncedSearch, make];

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '20', status: 'approved' });
      if (make) params.set('make', make);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {['', ...makes].map((item) => (
          <PressableChip
            key={item || 'all'}
            label={item || 'Tất cả'}
            active={make === item}
            onPress={() => setMake(item)}
          />
        ))}
      </ScrollView>
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
  chipsScroll: { marginBottom: 15 },
  chipsContent: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    width: 100,
    height: 80,

    marginRight: 10,
    borderRadius: 20,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },

  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },

  chipTextActive: {
    fontSize: 14,      
    fontWeight: '500', 
    color: '#fff',
  },
  list: { paddingBottom: 24 },
  count: { color: colors.muted, marginBottom: 8, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
