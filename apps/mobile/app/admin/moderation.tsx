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
import type { ListingDto } from '@car-marketplace/api-contract';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { PageError, PageLoading } from '../../src/components/PageState';
import { colors } from '../../src/theme/colors';

interface PendingResult {
  items: ListingDto[];
  total: number;
}

export default function AdminModerationScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [modifyId, setModifyId] = useState<string | null>(null);
  const [modifyDetails, setModifyDetails] = useState('');
  const isAdmin = !!user && user.role === 'admin';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () =>
      api<PendingResult>('/listings/admin/moderation/pending?page=1&limit=50'),
    enabled: isAdmin,
  });

  const approve = useMutation({
    mutationFn: (id: string) =>
      api(`/listings/admin/moderation/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ moderatorId: user!.id }),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-pending'] }),
  });

  const reject = useMutation({
    mutationFn: () =>
      api(`/listings/admin/moderation/${rejectId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ moderatorId: user!.id, reason: reason.trim() }),
      }),
    onSuccess: () => {
      setRejectId(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
    },
  });

  const requestMod = useMutation({
    mutationFn: () =>
      api(`/listings/admin/moderation/${modifyId}/request-modification`, {
        method: 'PATCH',
        body: JSON.stringify({ moderatorId: user!.id, details: modifyDetails.trim() }),
      }),
    onSuccess: () => {
      setModifyId(null);
      setModifyDetails('');
      void queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
    },
  });

  if (!isAdmin) return <Redirect href="/" />;
  if (isLoading) return <PageLoading />;
  if (isError) {
    return (
      <PageError
        message={error instanceof Error ? error.message : 'Lỗi'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.meta}>{item.status}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.approve} onPress={() => approve.mutate(item.id)}>
                <Text style={styles.btnText}>Duyệt</Text>
              </Pressable>
              <Pressable style={styles.reject} onPress={() => setRejectId(item.id)}>
                <Text style={styles.rejectText}>Từ chối</Text>
              </Pressable>
              <Pressable style={styles.modify} onPress={() => setModifyId(item.id)}>
                <Text style={styles.modifyText}>Yêu cầu sửa</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      {rejectId ? (
        <View style={styles.sheet}>
          <TextInput
            style={styles.input}
            placeholder="Lý do từ chối (≥10 ký tự)"
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Pressable style={styles.approve} onPress={() => reject.mutate()}>
            <Text style={styles.btnText}>Gửi từ chối</Text>
          </Pressable>
          <Pressable onPress={() => setRejectId(null)}>
            <Text style={styles.cancel}>Hủy</Text>
          </Pressable>
        </View>
      ) : null}
      {modifyId ? (
        <View style={styles.sheet}>
          <TextInput
            style={styles.input}
            placeholder="Nội dung yêu cầu sửa"
            value={modifyDetails}
            onChangeText={setModifyDetails}
            multiline
          />
          <Pressable style={styles.modify} onPress={() => requestMod.mutate()}>
            <Text style={styles.modifyText}>Gửi yêu cầu</Text>
          </Pressable>
          <Pressable onPress={() => setModifyId(null)}>
            <Text style={styles.cancel}>Hủy</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brand50 },
  list: { padding: 12, paddingBottom: 120 },
  card: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: '600', fontSize: 15, color: colors.brand900 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  approve: { backgroundColor: colors.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reject: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  modify: { backgroundColor: colors.brand100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  modifyText: { color: colors.brand700, fontWeight: '600', fontSize: 13 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  cancel: { textAlign: 'center', color: colors.muted, padding: 8 },
});
