import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../lib/firebase';
import { useFotoPerfil } from '../lib/fotoPerfil';

const colors = {
  background: '#FDF4F6',
  surface: '#FFFFFF',
  border: '#EFD9E1',
  text: '#1C1C1E',
  body: '#4A4A4E',
  secondary: '#8A8A8E',
  accent: '#E8508A',
  onAccent: '#FFFFFF',
  back: '#6F8F1F',
  error: '#B4233D',
  avatarBg: '#E4D3D9',
  avatarText: '#6B5860',
} as const;

/** Limite de caracteres de um comentário. */
const MAX_COMMENT_LENGTH = 500;
/** Um batch do Firestore aceita até 500 operações; sobra margem para a conversa e a região. */
const BATCH_LIMIT = 450;

type ConversationData = {
  author_name?: string;
  author_uid?: string;
  body?: string;
  created_at?: Timestamp;
  like_count?: number;
  reply_count?: number;
  region_id?: string;
  title?: string;
};

type CommentData = {
  author_name?: string;
  author_uid?: string;
  body?: string;
  created_at?: Timestamp;
};

type RegionData = {
  last_activity_at?: Timestamp;
  last_conversation_id?: string;
};

type Conversation = {
  authorUid: string;
  title: string;
  body: string;
  author: string;
  time: string;
  likes: number;
  comments: number;
};

type Comment = {
  id: string;
  authorUid: string;
  author: string;
  initials: string;
  body: string;
  time: string;
};

function formatTime(date?: Date): string {
  if (!date) return 'Agora';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : date.toLocaleDateString('pt-BR');
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR') || 'M';
}

function mapComment(id: string, data: CommentData): Comment {
  const author = data.author_name?.trim() || 'Autor desconhecido';
  return {
    id,
    authorUid: data.author_uid ?? '',
    author,
    initials: getInitials(author),
    body: data.body ?? '',
    time: formatTime(data.created_at?.toDate()),
  };
}

function CommentAvatar({ comment }: { comment: Comment }): React.JSX.Element {
  const foto = useFotoPerfil(comment.authorUid);
  return (
    <View style={styles.avatar} accessibilityLabel={`Foto de ${comment.author}`}>
      {foto ? (
        <Image source={{ uri: foto }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{comment.initials}</Text>
      )}
    </View>
  );
}

export default function ConversaScreen(): React.JSX.Element {
  const router = useRouter();
  const { conversationId, regionId } = useLocalSearchParams<{
    conversationId?: string;
    regionId?: string;
  }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deletingPost, setDeletingPost] = useState(false);
  const currentUid = auth?.currentUser?.uid;

  useEffect(() => {
    let active = true;

    async function loadConversation(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        if (!db) throw new Error('Firebase não está configurado.');
        if (!conversationId) throw new Error('Não foi informada uma conversa.');

        const conversationRef = doc(db, 'conversations', conversationId);
        const [conversationSnapshot, commentsSnapshot] = await Promise.all([
          getDoc(conversationRef),
          getDocs(query(collection(conversationRef, 'comments'), orderBy('created_at', 'asc'))),
        ]);
        if (!conversationSnapshot.exists()) throw new Error('Conversa não encontrada.');

        const data = conversationSnapshot.data() as ConversationData;
        if (!active) return;
        setConversation({
          authorUid: data.author_uid ?? '',
          title: data.title?.trim() || 'Conversa sem título',
          body: data.body ?? '',
          author: data.author_name?.trim() || 'Autor desconhecido',
          time: formatTime(data.created_at?.toDate()),
          likes: data.like_count ?? 0,
          comments: data.reply_count ?? 0,
        });
        setComments(commentsSnapshot.docs.map((item) => mapComment(item.id, item.data() as CommentData)));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar a conversa.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadConversation();
    return () => {
      active = false;
    };
  }, [conversationId]);

  async function sendComment(): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText || sending || !conversationId) return;

    setSending(true);
    setError(null);
    try {
      const firestore = db;
      if (!firestore) throw new Error('Firebase não está configurado.');
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('Entre na sua conta para comentar.');

      const profile = await getDoc(doc(firestore, 'users', currentUser.uid));
      const profileName = profile.data()?.nome;
      const authorName = typeof profileName === 'string' && profileName.trim()
        ? profileName.trim()
        : '-';

      const conversationRef = doc(firestore, 'conversations', conversationId);
      // O ID é gerado no cliente para o comentário poder ser gravado dentro da transação.
      const commentRef = doc(collection(conversationRef, 'comments'));

      const replyCount = await runTransaction(firestore, async (transaction) => {
        const conversationSnapshot = await transaction.get(conversationRef);
        if (!conversationSnapshot.exists()) throw new Error('Conversa não encontrada.');
        const data = conversationSnapshot.data() as ConversationData;

        const regionRef = data.region_id ? doc(firestore, 'regions', data.region_id) : null;
        const regionSnapshot = regionRef ? await transaction.get(regionRef) : null;

        const nextReplyCount = (data.reply_count ?? 0) + 1;
        transaction.set(commentRef, {
          body: cleanText,
          author_name: authorName,
          author_uid: currentUser.uid,
          created_at: serverTimestamp(),
        });
        // last_comment_change_id permite que as regras confiram que o comentário foi criado junto.
        transaction.update(conversationRef, {
          reply_count: nextReplyCount,
          last_comment_change_id: commentRef.id,
        });

        // O card da região no Fórum mostra os números da conversa mais recente.
        if (regionRef && regionSnapshot?.exists()) {
          const region = regionSnapshot.data() as RegionData;
          const isLatestConversation = region.last_conversation_id === conversationId || (
            !region.last_conversation_id &&
            region.last_activity_at !== undefined &&
            data.created_at !== undefined &&
            region.last_activity_at.isEqual(data.created_at)
          );
          if (isLatestConversation) {
            transaction.update(regionRef, { last_conversation_reply_count: nextReplyCount });
          }
        }

        return nextReplyCount;
      });

      setComments((current) => [
        ...current,
        { id: commentRef.id, authorUid: currentUser.uid, author: authorName, initials: getInitials(authorName), body: cleanText, time: 'Agora' },
      ]);
      setConversation((current) => (current ? { ...current, comments: replyCount } : current));
      setText('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Não foi possível enviar o comentário.');
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(comment: Comment): Promise<void> {
    if (!conversationId || deletingIds.includes(comment.id)) return;

    setDeletingIds((current) => [...current, comment.id]);
    setError(null);
    try {
      const firestore = db;
      if (!firestore) throw new Error('Firebase não está configurado.');
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('Entre na sua conta para excluir o comentário.');

      const conversationRef = doc(firestore, 'conversations', conversationId);
      const commentRef = doc(conversationRef, 'comments', comment.id);

      const replyCount = await runTransaction(firestore, async (transaction) => {
        const [conversationSnapshot, commentSnapshot] = await Promise.all([
          transaction.get(conversationRef),
          transaction.get(commentRef),
        ]);
        if (!conversationSnapshot.exists()) throw new Error('Conversa não encontrada.');
        const data = conversationSnapshot.data() as ConversationData;
        // Já excluído (por exemplo, em outro aparelho): só atualiza a tela.
        if (!commentSnapshot.exists()) return data.reply_count ?? 0;
        if ((commentSnapshot.data() as CommentData).author_uid !== currentUser.uid) {
          throw new Error('Você só pode excluir os seus comentários.');
        }

        const regionRef = data.region_id ? doc(firestore, 'regions', data.region_id) : null;
        const regionSnapshot = regionRef ? await transaction.get(regionRef) : null;

        const nextReplyCount = Math.max(0, (data.reply_count ?? 0) - 1);
        transaction.delete(commentRef);
        transaction.update(conversationRef, {
          reply_count: nextReplyCount,
          last_comment_change_id: comment.id,
        });

        if (regionRef && regionSnapshot?.exists()) {
          const region = regionSnapshot.data() as RegionData;
          const isLatestConversation = region.last_conversation_id === conversationId || (
            !region.last_conversation_id &&
            region.last_activity_at !== undefined &&
            data.created_at !== undefined &&
            region.last_activity_at.isEqual(data.created_at)
          );
          if (isLatestConversation) {
            transaction.update(regionRef, { last_conversation_reply_count: nextReplyCount });
          }
        }

        return nextReplyCount;
      });

      setComments((current) => current.filter((item) => item.id !== comment.id));
      setConversation((current) => (current ? { ...current, comments: replyCount } : current));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir o comentário.');
    } finally {
      setDeletingIds((current) => current.filter((id) => id !== comment.id));
    }
  }

  async function deletePost(): Promise<void> {
    if (!conversationId || deletingPost) return;

    setDeletingPost(true);
    setError(null);
    try {
      const firestore = db;
      if (!firestore) throw new Error('Firebase não está configurado.');
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('Entre na sua conta para excluir a conversa.');

      const conversationRef = doc(firestore, 'conversations', conversationId);
      const conversationSnapshot = await getDoc(conversationRef);
      if (!conversationSnapshot.exists()) {
        goBack();
        return;
      }
      const data = conversationSnapshot.data() as ConversationData;
      if (data.author_uid !== currentUser.uid) throw new Error('Você só pode excluir as suas conversas.');

      // O Firestore não apaga subcoleções junto com o documento: curtidas e comentários saem antes.
      const [likesSnapshot, commentsSnapshot, regionSnapshot] = await Promise.all([
        getDocs(collection(conversationRef, 'likes')),
        getDocs(collection(conversationRef, 'comments')),
        data.region_id
          ? getDocs(query(collection(firestore, 'conversations'), where('region_id', '==', data.region_id)))
          : null,
      ]);
      const childRefs: DocumentReference[] = [
        ...likesSnapshot.docs.map((item) => item.ref),
        ...commentsSnapshot.docs.map((item) => item.ref),
      ];

      // Só lotes que não cabem no último batch são enviados antes (conversas com muitas interações).
      while (childRefs.length > BATCH_LIMIT) {
        const batch = writeBatch(firestore);
        childRefs.splice(0, BATCH_LIMIT).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      const batch = writeBatch(firestore);
      childRefs.forEach((ref) => batch.delete(ref));
      batch.delete(conversationRef);

      // O card da região mostra a conversa mais recente; recalcula com as que sobraram.
      if (data.region_id && regionSnapshot) {
        const remaining = regionSnapshot.docs
          .filter((item) => item.id !== conversationId)
          .map((item) => ({ id: item.id, data: item.data() as ConversationData }))
          .sort((first, second) =>
            (second.data.created_at?.toMillis() ?? 0) - (first.data.created_at?.toMillis() ?? 0));
        const latest = remaining[0];
        batch.set(doc(firestore, 'regions', data.region_id), latest
          ? {
            conversation_count: remaining.length,
            last_activity_at: latest.data.created_at ?? deleteField(),
            last_conversation_id: latest.id,
            last_conversation_title: latest.data.title ?? '',
            last_conversation_like_count: latest.data.like_count ?? 0,
            last_conversation_reply_count: latest.data.reply_count ?? 0,
          }
          : {
            conversation_count: 0,
            last_activity_at: deleteField(),
            last_conversation_id: deleteField(),
            last_conversation_title: deleteField(),
            last_conversation_like_count: deleteField(),
            last_conversation_reply_count: deleteField(),
          }, { merge: true });
      }

      await batch.commit();
      goBack();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a conversa.');
      setDeletingPost(false);
    }
  }

  function confirmAction(title: string, message: string, onConfirm: () => void): void {
    // No web, Alert.alert não mostra botões; usa a confirmação do navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: onConfirm },
    ]);
  }

  function confirmDelete(comment: Comment): void {
    confirmAction('Excluir comentário?', 'Esse comentário será removido da conversa.', () => {
      void deleteComment(comment);
    });
  }

  function confirmDeletePost(): void {
    confirmAction(
      'Excluir conversa?',
      'A conversa será apagada junto com todos os comentários e curtidas.',
      () => void deletePost(),
    );
  }

  function goBack(): void {
    if (router.canGoBack()) {
      router.back();
    } else if (regionId) {
      router.replace({ pathname: '/conversas', params: { regionId } });
    } else {
      router.replace('/forum');
    }
  }

  const renderComment: ListRenderItem<Comment> = ({ item }) => (
    <View style={styles.comment}>
      <CommentAvatar comment={item} />
      <View style={styles.commentContent}>
        <Text style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>{item.author}</Text> • {item.time}
        </Text>
        <Text style={styles.commentBody}>{item.body}</Text>
      </View>
      {item.authorUid === currentUid ? (
        deletingIds.includes(item.id) ? (
          <ActivityIndicator style={styles.deleteButton} size="small" color={colors.secondary} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Excluir comentário"
            hitSlop={8}
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.secondary} />
          </Pressable>
        )
      ) : null}
    </View>
  );

  const renderHeader = (): React.JSX.Element | null => {
    if (!conversation) return null;
    return (
      <View>
        <View style={styles.post}>
          <View style={styles.postHeader}>
            <Text style={styles.postTitle} accessibilityRole="header">{conversation.title}</Text>
            {conversation.authorUid === currentUid ? (
              deletingPost ? (
                <ActivityIndicator style={styles.deleteButton} size="small" color={colors.secondary} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Excluir conversa"
                  hitSlop={8}
                  style={styles.deleteButton}
                  onPress={confirmDeletePost}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.secondary} />
                </Pressable>
              )
            ) : null}
          </View>
          <Text style={styles.postMeta}>{conversation.author} • {conversation.time}</Text>
          <Text style={styles.postBody}>{conversation.body}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat} accessibilityLabel={`${conversation.comments} comentários`}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.secondary} />
              <Text style={styles.statText}>{conversation.comments}</Text>
            </View>
            <View style={styles.stat} accessibilityLabel={`${conversation.likes} curtidas`}>
              <Ionicons name="heart-outline" size={14} color={colors.secondary} />
              <Text style={styles.statText}>{conversation.likes}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Comentários</Text>
      </View>
    );
  };

  const canSend = text.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={4}
            style={styles.backButton}
            onPress={goBack}
          >
            <Ionicons name="arrow-back" size={20} color={colors.onAccent} />
          </Pressable>
          <Text style={styles.heading} accessibilityRole="header">Conversa</Text>
        </View>

        <FlatList<Comment>
          style={styles.flex}
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.emptyState} size="large" color={colors.accent} />
            ) : conversation ? (
              <Text style={styles.emptyText}>Nenhum comentário ainda. Seja a primeira pessoa a comentar.</Text>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />

        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}

        {conversation ? (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Escreva um comentário..."
              placeholderTextColor={colors.secondary}
              value={text}
              onChangeText={setText}
              maxLength={MAX_COMMENT_LENGTH}
              multiline
              accessibilityLabel="Comentário"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar comentário"
              accessibilityState={{ disabled: !canSend, busy: sending }}
              disabled={!canSend}
              style={[styles.sendButton, !canSend && styles.sendDisabled]}
              onPress={() => void sendComment()}
            >
              {sending
                ? <ActivityIndicator color={colors.onAccent} />
                : <Ionicons name="send" size={18} color={colors.onAccent} />}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.back,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  listContent: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 24 },
  post: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  postTitle: { flex: 1, fontSize: 20, fontWeight: '700', lineHeight: 26, color: colors.text },
  postMeta: { fontSize: 12, color: colors.secondary, marginTop: 4 },
  postBody: { fontSize: 14, lineHeight: 20, color: colors.body, marginTop: 12 },
  statsRow: { flexDirection: 'row', marginTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { fontSize: 12, color: colors.secondary, marginLeft: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 8 },
  comment: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 11, fontWeight: '700', color: colors.avatarText },
  commentContent: { flex: 1 },
  commentMeta: { fontSize: 12, color: colors.secondary },
  commentAuthor: { fontWeight: '600', color: colors.text },
  deleteButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  commentBody: { fontSize: 14, lineHeight: 20, color: colors.body, marginTop: 2 },
  emptyState: { marginTop: 24 },
  emptyText: { marginTop: 16, color: colors.secondary, textAlign: 'center' },
  error: { color: colors.error, fontSize: 13, paddingHorizontal: 20, paddingBottom: 8 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
