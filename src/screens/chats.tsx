import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Timestamp,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../lib/firebase';
import { useFotoPerfil } from '../lib/fotoPerfil';
import { chatColors as colors } from '../theme/colors';

type LastMessage = {
  createdAt?: Timestamp;
  senderId?: string;
  text?: string;
};

type ChatData = {
  lastMessageAt?: Timestamp;
  lastMessage?: LastMessage;
  participants?: string[];
};

type Chat = {
  id: string;
  title: string;
  initials: string;
  avatarUid?: string;
  lastMessage: string;
  lastMessageAt?: Date;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR') || 'C';
}

function formatTime(date?: Date): string {
  if (!date) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

  return date.toLocaleDateString(
    'pt-BR',
    date.getFullYear() === now.getFullYear()
      ? { day: '2-digit', month: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: '2-digit' },
  );
}

// Os nomes ficam em cache entre atualizações para não buscar o perfil de todo mundo a cada mensagem.
async function buildChats(
  firestore: Firestore,
  userId: string,
  docs: QueryDocumentSnapshot[],
  participantNames: Map<string, string>,
): Promise<Chat[]> {
  const chatDocuments = docs.map((chatDocument) => ({
    id: chatDocument.id,
    data: chatDocument.data() as ChatData,
  }));

  const otherParticipantIds = [
    ...new Set(
      chatDocuments.flatMap(({ data }) =>
        (Array.isArray(data.participants) ? data.participants : [])
          .filter((participantId) => participantId !== userId),
      ),
    ),
  ].filter((participantId) => !participantNames.has(participantId));

  await Promise.all(otherParticipantIds.map(async (participantId) => {
    const profile = await getDoc(doc(firestore, 'users', participantId));
    const name = profile.data()?.nome;
    participantNames.set(
      participantId,
      typeof name === 'string' && name.trim() ? name.trim() : 'Usuário',
    );
  }));

  return chatDocuments
    .map(({ id, data }) => {
      const otherParticipants = (Array.isArray(data.participants) ? data.participants : [])
        .filter((participantId) => participantId !== userId);
      const names = otherParticipants.map((participantId) =>
        participantNames.get(participantId) ?? 'Usuário',
      );
      const title = names.length > 2
        ? `${names.slice(0, 2).join(', ')} e mais ${names.length - 2}`
        : names.join(', ') || 'Chat';
      const lastMessageAt = data.lastMessageAt instanceof Timestamp
        ? data.lastMessageAt.toDate()
        : undefined;

      return {
        id,
        title,
        initials: getInitials(names[0] ?? title),
        avatarUid: otherParticipants[0],
        lastMessage: typeof data.lastMessage?.text === 'string'
          ? data.lastMessage.text
          : 'Sem mensagens ainda.',
        lastMessageAt,
      };
    })
    .sort((first, second) =>
      (second.lastMessageAt?.getTime() ?? 0) - (first.lastMessageAt?.getTime() ?? 0),
    );
}

function ChatCard({
  chat,
  onPress,
}: {
  chat: Chat;
  onPress: () => void;
}): React.JSX.Element {
  const photo = useFotoPerfil(chat.avatarUid);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir chat com ${chat.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.avatar}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{chat.initials}</Text>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle} numberOfLines={1}>{chat.title}</Text>
          <Text style={styles.time}>{formatTime(chat.lastMessageAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>{chat.lastMessage}</Text>
      </View>
    </Pressable>
  );
}

export default function ChatsScreen(): React.JSX.Element {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const participantNamesRef = useRef(new Map<string, string>());

  // Escuta os chats em tempo real enquanto a tela está em foco.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      // Garante que uma atualização lenta não sobrescreva uma mais recente.
      let latestSnapshot = 0;
      setLoading(true);
      setError(null);

      const firestore = db;
      const userId = auth?.currentUser?.uid;
      if (!firestore || !userId) {
        setError(firestore ? 'Entre na sua conta para ver seus chats.' : 'Firebase não está configurado.');
        setLoading(false);
        setRefreshing(false);
        return undefined;
      }

      const chatsQuery = query(
        collection(firestore, 'chats'),
        where('participants', 'array-contains', userId),
      );
      const stopListening = onSnapshot(
        chatsQuery,
        (snapshot) => {
          const snapshotNumber = ++latestSnapshot;
          buildChats(firestore, userId, snapshot.docs, participantNamesRef.current)
            .then((items) => {
              if (!active || snapshotNumber !== latestSnapshot) return;
              setChats(items);
              setError(null);
            })
            .catch((loadError) => {
              if (!active) return;
              setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os chats.');
            })
            .finally(() => {
              if (!active) return;
              setLoading(false);
              setRefreshing(false);
            });
        },
        (listenerError) => {
          if (!active) return;
          setError(listenerError.message || 'Não foi possível carregar os chats.');
          setLoading(false);
          setRefreshing(false);
        },
      );

      return () => {
        active = false;
        stopListening();
      };
    }, [reloadKey]),
  );

  const renderChat: ListRenderItem<Chat> = ({ item }) => (
    <ChatCard
      chat={item}
      onPress={() =>
        router.push({ pathname: '/chat', params: { chatId: item.id, title: item.title } })
      }
    />
  );

  const emptyContent = loading ? (
    <ActivityIndicator size="large" color={colors.accent} />
  ) : error ? (
    <View style={styles.emptyState}>
      <Ionicons name="cloud-offline-outline" size={38} color={colors.accentDark} />
      <Text style={styles.emptyTitle}>Não foi possível carregar os chats</Text>
      <Text style={styles.emptyText}>{error}</Text>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        onPress={() => setReloadKey((current) => current + 1)}
      >
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>
    </View>
  ) : (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={42} color={colors.accent} />
      <Text style={styles.emptyTitle}>Ainda não há chats</Text>
      <Text style={styles.emptyText}>Quando você iniciar uma conversa, ela aparecerá aqui.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title} accessibilityRole="header">Chats</Text>
          <Text style={styles.subtitle}>
            {chats.length} {chats.length === 1 ? 'conversa' : 'conversas'}
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={emptyContent}
        contentContainerStyle={[styles.listContent, chats.length === 0 && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              // A lista já é em tempo real; puxar para atualizar recarrega nomes e reconecta.
              participantNamesRef.current = new Map();
              setRefreshing(true);
              setReloadKey((current) => current + 1);
            }}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  heading: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.secondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.05)',
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: colors.avatarBg,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.avatarText,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  time: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.secondary,
  },
  lastMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.body,
  },
  separator: {
    height: 10,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.secondary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.white,
  },
  pressed: {
    opacity: 0.75,
  },
});
