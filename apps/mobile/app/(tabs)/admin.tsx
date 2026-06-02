import { Link, Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function AdminHubScreen() {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Redirect href="/" />;
  }

  const links = [
    { href: '/admin/moderation' as const, label: 'Kiểm duyệt tin' },
    { href: '/admin/dashboard' as const, label: 'Doanh thu' },
    { href: '/admin/car-makes' as const, label: 'Hãng xe' },
    { href: '/admin/sold' as const, label: 'Tin đã bán' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản trị</Text>
      {links.map((link) => (
        <Link key={link.href} href={link.href} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardText}>{link.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.brand50, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.brand900, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: { fontSize: 16, fontWeight: '600', color: colors.brand800 },
});
