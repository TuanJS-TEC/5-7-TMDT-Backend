import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter, Redirect } from 'expo-router';
import { useState } from 'react';
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
import { api } from '../../src/api/client';
import { uploadListingImage } from '../../src/api/uploadListingImage';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

interface LocalImage {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function CreateListingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('Toyota Camry — một chủ');
  const [description, setDescription] = useState('Xe zin, bảo dưỡng định kỳ.');
  const [carMake, setCarMake] = useState('Toyota');
  const [carModel, setCarModel] = useState('Camry');
  const [carYear, setCarYear] = useState('2020');
  const [mileageKm, setMileageKm] = useState('45000');
  const [priceVnd, setPriceVnd] = useState('720000000');
  const [packageType, setPackageType] = useState<'basic' | 'premium' | 'vip'>('basic');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== 'seller') {
    return <Redirect href="/(auth)/login" />;
  }

  async function pickImages() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked: LocalImage[] = [];
    for (const asset of result.assets) {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      picked.push({
        uri: manipulated.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
    }
    setImages((prev) => [...prev, ...picked].slice(0, 15));
  }

  async function onSubmit() {
    if (images.length < 1) {
      setError('Chọn ít nhất 1 ảnh');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          priceVnd: Number(priceVnd),
          packageType,
          imageUrls: [],
          carMake,
          carModel,
          carYear: Number(carYear),
          mileageKm: Number(mileageKm),
          fuelType: 'petrol',
          transmission: 'automatic',
        }),
      });
      for (const img of images) {
        await uploadListingImage(res.id, img.uri, img.fileName, img.mimeType);
      }
      router.replace('/seller');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tạo tin thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput style={styles.input} placeholder="Tiêu đề" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Mô tả"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Hãng" value={carMake} onChangeText={setCarMake} />
        <TextInput style={[styles.input, styles.half]} placeholder="Model" value={carModel} onChangeText={setCarModel} />
      </View>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} placeholder="Năm" keyboardType="numeric" value={carYear} onChangeText={setCarYear} />
        <TextInput style={[styles.input, styles.half]} placeholder="Km" keyboardType="numeric" value={mileageKm} onChangeText={setMileageKm} />
      </View>
      <TextInput style={styles.input} placeholder="Giá VND" keyboardType="numeric" value={priceVnd} onChangeText={setPriceVnd} />
      <View style={styles.row}>
        {(['basic', 'premium', 'vip'] as const).map((p) => (
          <Pressable
            key={p}
            style={[styles.chip, packageType === p && styles.chipActive]}
            onPress={() => setPackageType(p)}
          >
            <Text style={packageType === p ? styles.chipTextActive : styles.chipText}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.pickBtn} onPress={() => void pickImages()}>
        <Text style={styles.pickBtnText}>+ Chọn ảnh ({images.length})</Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((img) => (
          <Image key={img.uri} source={{ uri: img.uri }} style={styles.thumb} />
        ))}
      </ScrollView>
      <Pressable style={styles.btn} onPress={() => void onSubmit()} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Đăng tin</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  error: { color: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  chip: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.muted, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  pickBtn: {
    borderWidth: 1,
    borderColor: colors.brand600,
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickBtnText: { color: colors.brand600, fontWeight: '600' },
  thumb: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
