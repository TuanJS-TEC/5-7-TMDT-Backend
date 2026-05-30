import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, ApiError } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function RegisterScreen() {
  const { registerVerify } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'showroom'>('personal');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ message: string }>('/auth/register/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          password,
          accountType,
        }),
        skipAuth: true,
      });
      setInfo(res.message);
      setStep(1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      await registerVerify(phone.trim(), code.trim());
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Xác thực thất bại');
    } finally {
      setLoading(false);
    }
  }

  if (step === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đăng ký</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="Họ tên" value={fullName} onChangeText={setFullName} />
        <TextInput
          style={styles.input}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu (chữ + số, ≥8)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, accountType === 'personal' && styles.chipActive]}
            onPress={() => setAccountType('personal')}
          >
            <Text style={accountType === 'personal' ? styles.chipTextActive : styles.chipText}>
              Cá nhân
            </Text>
          </Pressable>
          <Pressable
            style={[styles.chip, accountType === 'showroom' && styles.chipActive]}
            onPress={() => setAccountType('showroom')}
          >
            <Text style={accountType === 'showroom' ? styles.chipTextActive : styles.chipText}>
              Showroom
            </Text>
          </Pressable>
        </View>
        <Pressable style={styles.btn} onPress={() => void requestOtp()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Gửi OTP</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhập mã OTP</Text>
      {info ? <Text style={styles.info}>{info}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="6 chữ số"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <Pressable style={styles.btn} onPress={() => void verify()} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Hoàn tất</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.brand50, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.brand900 },
  error: { color: colors.danger },
  info: { color: colors.muted, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.brand600, borderColor: colors.brand600 },
  chipText: { color: colors.muted },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
