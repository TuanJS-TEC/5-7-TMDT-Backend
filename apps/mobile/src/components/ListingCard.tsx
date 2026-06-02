import type { ListingDto } from '@car-marketplace/api-contract';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { formatPrice, FUEL_LABELS, TRANS_LABELS } from '../utils/format';
import { fallbackListingImage, resolveListingImageUrl } from '../utils/image';
import { colors } from '../theme/colors';

export function ListingCard({ listing }: { listing: ListingDto }) {
  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable style={styles.card}>
        <Image
          source={{ uri: resolveListingImageUrl(listing.imageUrls[0], listing.id) }}
          style={styles.image}
          defaultSource={{ uri: fallbackListingImage(listing.id) }}
        />
        <View style={styles.body}>
          <Text style={styles.make}>
            {listing.carMake} {listing.carModel}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.meta}>
            {listing.carYear} · {new Intl.NumberFormat('vi-VN').format(listing.mileageKm)} km ·{' '}
            {FUEL_LABELS[listing.fuelType] ?? listing.fuelType} ·{' '}
            {TRANS_LABELS[listing.transmission] ?? listing.transmission}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.priceVnd)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  image: { width: '100%', height: 180 },
  body: { padding: 12, gap: 4 },
  make: { fontSize: 12, color: colors.muted },
  title: { fontSize: 16, fontWeight: '600', color: colors.brand900 },
  meta: { fontSize: 12, color: colors.muted },
  price: { fontSize: 18, fontWeight: '700', color: colors.brand700, marginTop: 4 },
});
