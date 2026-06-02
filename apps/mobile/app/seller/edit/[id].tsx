import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../../src/api/client';
import { useAuth } from '../../../src/context/AuthContext';
import { PageError, PageLoading } from '../../../src/components/PageState';
import { colors } from '../../../src/theme/colors';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceVnd, setPriceVnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['seller-listing', id],
    queryFn: () => api<ListingDto>(`/listings/me/${id}`),
    enabled: !!id && user?.role === 'seller',
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setDescription(data.description);
      setPriceVnd(String(data.priceVnd));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description,
          priceVnd: Number(priceVnd),
          carMake: data?.carMake,
          carModel: data?.carModel,
          carYear: data?.carYear,
          mileageKm: data?.mileageKm,
          fuelType: data?.fuelType,
          transmission: data?.transmission,
        }),
      }),
    onSuccess: () => router.back(),
    onError: (e) => setError(e instanceof Error ? e.message : 'Lỗi lưu'),
  });

  if (!user || user.role !== 'seller') return <Redirect href="/(auth)/login" />;
  if (isLoading) return <PageLoading />;
  if (isError || !data) {
    return <PageError message={loadError instanceof Error ? loadError.message : 'Không tải tin'} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {data.modificationRequestDetails ? (
        <Text style={styles.warn}>Admin yêu cầu: {data.modificationRequestDetails}</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Tiêu đề" />
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Mô tả"
        multiline
      />
      <TextInput
        style={styles.input}
        value={priceVnd}
        onChangeText={setPriceVnd}
        keyboardType="numeric"
        placeholder="Giá VND"
      />
      <Pressable style={styles.btn} onPress={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Lưu & gửi duyệt lại</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: 16, gap: 10 },
  warn: { color: colors.warning, backgroundColor: '#fef3c7', padding: 12, borderRadius: 8 },
  error: { color: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
