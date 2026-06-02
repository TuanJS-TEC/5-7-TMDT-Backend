import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { PageError, PageLoading } from '../../src/components/PageState';
import { formatPrice, FUEL_LABELS, TRANS_LABELS } from '../../src/utils/format';
import { resolveListingImageUrl, fallbackListingImage } from '../../src/utils/image';
import { colors } from '../../src/theme/colors';

type Detail = ListingDto & {
  seller?: { fullName?: string; accountType?: string; displayPhone?: string };
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [phone, setPhone] = useState<string | null>(null);
  const [favMsg, setFavMsg] = useState<string | null>(null);

  const { data: listing, isLoading, isError, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api<Detail>(`/listings/${id}`),
    enabled: !!id,
  });

  const revealPhone = useMutation({
    mutationFn: () => api<{ phone: string }>(`/listings/${id}/phone`),
    onSuccess: (res) => setPhone(res.phone),
  });

  const addFavorite = useMutation({
    mutationFn: () =>
      api<{ message: string }>(`/listings/${id}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ userId: user!.id }),
      }),
    onSuccess: (res) => setFavMsg(res.message ?? 'Đã lưu'),
  });

  if (!id) return <PageError message="Thiếu mã tin" />;
  if (isLoading) return <PageLoading />;
  if (isError || !listing) {
    return <PageError message={error instanceof Error ? error.message : 'Không tải được tin'} />;
  }

  const img = resolveListingImageUrl(listing.imageUrls[0], listing.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: img }} style={styles.hero} defaultSource={{ uri: fallbackListingImage(listing.id) }} />
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.price}>{formatPrice(listing.priceVnd)}</Text>
      <Text style={styles.meta}>
        {listing.carMake} {listing.carModel} · {listing.carYear} ·{' '}
        {new Intl.NumberFormat('vi-VN').format(listing.mileageKm)} km
      </Text>
      <Text style={styles.meta}>
        {FUEL_LABELS[listing.fuelType] ?? listing.fuelType} ·{' '}
        {TRANS_LABELS[listing.transmission] ?? listing.transmission}
      </Text>
      <Text style={styles.desc}>{listing.description}</Text>
      {listing.seller?.fullName ? (
        <Text style={styles.seller}>Người bán: {listing.seller.fullName}</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.btn}
          onPress={() => revealPhone.mutate()}
          disabled={revealPhone.isPending || !!phone}
        >
          {revealPhone.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{phone ? phone : 'Hiện SĐT'}</Text>
          )}
        </Pressable>
        {phone ? (
          <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => void Linking.openURL(`tel:${phone}`)}>
            <Text style={styles.btnOutlineText}>Gọi</Text>
          </Pressable>
        ) : null}
        {user ? (
          <Pressable
            style={[styles.btn, styles.btnOutline]}
            onPress={() => addFavorite.mutate()}
            disabled={addFavorite.isPending}
          >
            <Text style={styles.btnOutlineText}>{favMsg ?? 'Lưu yêu thích'}</Text>
          </Pressable>
        ) : (
          <Link href="/(auth)/login" asChild>
            <Pressable style={[styles.btn, styles.btnOutline]}>
              <Text style={styles.btnOutlineText}>Đăng nhập để lưu</Text>
            </Pressable>
          </Link>
        )}
        <Pressable
          style={[styles.btn, styles.btnOutline]}
          onPress={() =>
            void Share.share({
              message: `${listing.title} — ${formatPrice(listing.priceVnd)}`,
              url: `carmarketplace://listing/${listing.id}`,
            })
          }
        >
          <Text style={styles.btnOutlineText}>Chia sẻ</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 40 },
  hero: { width: '100%', height: 240 },
  title: { fontSize: 20, fontWeight: '700', color: colors.brand900, padding: 16, paddingBottom: 4 },
  price: { fontSize: 22, fontWeight: '700', color: colors.brand700, paddingHorizontal: 16 },
  meta: { color: colors.muted, paddingHorizontal: 16, marginTop: 4 },
  desc: { padding: 16, lineHeight: 22, color: colors.ink },
  seller: { paddingHorizontal: 16, color: colors.brand800, fontWeight: '600' },
  actions: { padding: 16, gap: 10 },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.brand600 },
  btnOutlineText: { color: colors.brand600, fontWeight: '600' },
});
