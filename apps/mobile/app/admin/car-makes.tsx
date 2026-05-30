import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { PageLoading } from '../../src/components/PageState';
import { colors } from '../../src/theme/colors';

interface CarMake {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function AdminCarMakesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  if (!user || user.role !== 'admin') return <Redirect href="/" />;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-car-makes'],
    queryFn: () => api<{ items: CarMake[] }>('/listings/admin/car-makes'),
  });

  const create = useMutation({
    mutationFn: () =>
      api('/listings/admin/car-makes', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), isActive: true, showOnHome: true }),
      }),
    onSuccess: () => {
      setName('');
      void queryClient.invalidateQueries({ queryKey: ['admin-car-makes'] });
    },
  });

  if (isLoading) return <PageLoading />;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Tên hãng xe mới"
          value={name}
          onChangeText={setName}
        />
        <Pressable style={styles.btn} onPress={() => create.mutate()} disabled={!name.trim()}>
          <Text style={styles.btnText}>Thêm</Text>
        </Pressable>
      </View>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.slug}>{item.slug}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50, padding: 12 },
  form: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.brand600,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  row: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontWeight: '600', color: colors.brand900 },
  slug: { color: colors.muted, fontSize: 12 },
});
