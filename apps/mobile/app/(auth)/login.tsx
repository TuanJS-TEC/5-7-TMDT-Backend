import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiError } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const normalized = phone.trim().replace(/\s+/g, '');
    if (!/^0\d{9,10}$/.test(normalized) || password.length < 8) {
      setError('SĐT hoặc mật khẩu không hợp lệ');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(normalized, password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="0912 345 678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.btn} onPress={() => void onSubmit()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Đăng nhập</Text>
        )}
      </Pressable>
      <Link href="/(auth)/register">
        <Text style={styles.link}>Chưa có tài khoản? Đăng ký</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.brand50, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.brand900 },
  error: { color: colors.danger },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: colors.brand600, textAlign: 'center', marginTop: 16 },
});
