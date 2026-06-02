import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { t } from '../i18n';

export function PageLoading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand600} />
      <Text style={styles.muted}>{label ?? t('loading')}</Text>
    </View>
  );
}

export function PageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.error}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>{t('retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PageEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.muted}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  muted: { color: colors.muted, textAlign: 'center' },
  error: { color: colors.danger, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: colors.brand900 },
  btn: {
    backgroundColor: colors.brand600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
