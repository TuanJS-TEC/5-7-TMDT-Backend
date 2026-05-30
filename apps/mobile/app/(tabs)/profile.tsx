import { Link, Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { t } from '../../src/i18n';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Chào mừng</Text>
        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>{t('login')}</Text>
        </Link>
        <Link href="/(auth)/register" style={styles.linkSecondary}>
          <Text style={styles.linkSecondaryText}>{t('register')}</Text>
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.fullName}</Text>
      <Text style={styles.meta}>SĐT: {user.phone}</Text>
      <Text style={styles.meta}>
        Vai trò: {user.role} · {user.accountType}
      </Text>
      {user.role === 'seller' && (
        <Text style={styles.meta}>Tin miễn phí còn: {user.freeListingCredits}</Text>
      )}
      {user.role === 'seller' && (
        <Link href="/seller/create" asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Đăng tin mới</Text>
          </Pressable>
        </Link>
      )}
      {user.role === 'seller' && (
        <Link href="/seller/orders" asChild>
          <Pressable style={[styles.btn, styles.btnOutline]}>
            <Text style={styles.btnOutlineText}>Thanh toán gói tin</Text>
          </Pressable>
        </Link>
      )}
      <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => void logout()}>
        <Text style={styles.btnText}>{t('logout')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.brand50, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.brand900 },
  meta: { color: colors.muted, fontSize: 15 },
  link: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkSecondary: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brand600,
  },
  linkSecondaryText: { color: colors.brand600, fontWeight: '600' },
  btn: {
    backgroundColor: colors.brand600,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.brand600 },
  btnOutlineText: { color: colors.brand600, fontWeight: '600' },
  btnDanger: { backgroundColor: colors.danger, marginTop: 24 },
});
