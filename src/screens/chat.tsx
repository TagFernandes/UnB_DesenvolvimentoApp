import { Ionicons } from '@expo/vector-icons';
import { Bubble, GiftedChat, InputToolbar, Send, type IMessage } from 'react-native-gifted-chat';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  limit,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth, db } from '../lib/firebase';
import { chatColors as colors } from '../theme/colors';

type MessageData = {
  createdAt?: Timestamp | null;
  senderId?: string;
  text?: string;
};

const MESSAGE_PAGE_SIZE = 30;

function buildDirectChatId(participants: string[]): string {
  const uniqueParticipants = [...new Set(participants.map((participant) => participant.trim()).filter(Boolean))]
    .sort();

  return `direct_${uniqueParticipants.map((participant) => encodeURIComponent(participant)).join('_')}`;
}

function resolveLegacyDirectChatIds(chatId: string | undefined, recipientUid?: string, userId?: string): string[] {
  const candidates = new Set<string>();

  if (chatId) {
    candidates.add(chatId);

    const legacySuffix = chatId.startsWith('direct_') ? chatId.slice('direct_'.length) : '';
    if (legacySuffix) {
      try {
        const decodedSuffix = decodeURIComponent(legacySuffix);
        const parsedParticipants = JSON.parse(decodedSuffix);
        if (Array.isArray(parsedParticipants) && parsedParticipants.every((value) => typeof value === 'string')) {
          candidates.add(buildDirectChatId(parsedParticipants));
        }
      } catch {
        // Legacy IDs may have been encoded differently or may already be in the new format.
      }
    }
  }

  if (userId && recipientUid) {
    candidates.add(buildDirectChatId([userId, recipientUid].sort()));
  }

  return [...candidates];
}

function mapMessage(
  messageDocument: QueryDocumentSnapshot,
): IMessage {
  const data = messageDocument.data({ serverTimestamps: 'estimate' }) as MessageData;
  if (typeof data.text !== 'string' || typeof data.senderId !== 'string') {
    throw new Error(`A mensagem ${messageDocument.id} tem dados inválidos.`);
  }

  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate()
    : messageDocument.metadata.hasPendingWrites
      ? new Date()
      : null;
  if (!createdAt) {
    throw new Error(`A mensagem ${messageDocument.id} não tem uma data válida.`);
  }

  return {
    _id: messageDocument.id,
    text: data.text,
    createdAt,
    user: { _id: data.senderId },
  };
}

export default function ChatScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chatId, recipientUid, title } = useLocalSearchParams<{
    chatId?: string;
    recipientUid?: string;
    title?: string;
  }>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [hasEarlierMessages, setHasEarlierMessages] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ _id: string; name: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const oldestMessageRef = useRef<QueryDocumentSnapshot | null>(null);
  const hasMoreMessagesRef = useRef(true);
  const isLoadingEarlierRef = useRef(false);
  const hasInitializedCursorRef = useRef(false);
  const loadedMessageIdsRef = useRef(new Map<string, IMessage>());

  useEffect(() => {
    let active = true;
    let stopListening: (() => void) | undefined;
    oldestMessageRef.current = null;
    hasMoreMessagesRef.current = true;
    isLoadingEarlierRef.current = false;
    hasInitializedCursorRef.current = false;
    loadedMessageIdsRef.current = new Map();
    setMessages([]);
    setIsLoadingEarlier(false);
    setHasEarlierMessages(false);

    async function listenToChat(): Promise<void> {
      setLoading(true);
      setError(null);
      setChatReady(false);

      try {
        const firestore = db;
        const user = auth?.currentUser;
        if (!firestore) throw new Error('Firebase não está configurado.');
        if (!user) throw new Error('Entre na sua conta para abrir este chat.');

        if (!chatId) {
          if (!recipientUid) throw new Error('Não foi informado qual chat abrir.');
          if (recipientUid === user.uid) throw new Error('Você não pode iniciar um chat consigo mesmo.');
          if (!active) return;

          setCurrentUser({ _id: user.uid, name: user.displayName || 'Você' });
          setChatReady(true);
          setLoading(false);
          return;
        }

        const chatCandidates = resolveLegacyDirectChatIds(chatId, recipientUid, user.uid);

        let chatRef: ReturnType<typeof doc> | null = null;
        let chatSnapshot: Awaited<ReturnType<typeof getDoc>> | null = null;
        for (const candidateId of chatCandidates) {
          const candidateRef = doc(firestore, 'chats', candidateId);
          const candidateSnapshot = await getDoc(candidateRef);
          if (candidateSnapshot.exists()) {
            chatRef = candidateRef;
            chatSnapshot = candidateSnapshot;
            break;
          }
        }

        if (!chatRef || !chatSnapshot || !chatSnapshot.exists()) {
          throw new Error('Este chat não existe mais.');
        }
        const data = chatSnapshot.data() as { participants?: unknown };
        const participants = data.participants;
        if (!Array.isArray(participants) || !participants.includes(user.uid)) {
          throw new Error('Você não participa deste chat.');
        }
        if (!active) return;

        setCurrentUser({ _id: user.uid, name: user.displayName || 'Você' });
        setChatReady(true);

        const messagesQuery = query(
          collection(chatRef, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(MESSAGE_PAGE_SIZE),
        );
        stopListening = onSnapshot(
          messagesQuery,
          (snapshot) => {
            if (!active) return;
            try {
              if (!hasInitializedCursorRef.current) {
                oldestMessageRef.current = snapshot.docs.at(-1) ?? null;
                hasMoreMessagesRef.current = snapshot.docs.length === MESSAGE_PAGE_SIZE;
                hasInitializedCursorRef.current = true;
              }
              snapshot.docs.forEach((messageDocument) => {
                const mappedMessage = mapMessage(messageDocument);
                loadedMessageIdsRef.current.set(String(mappedMessage._id), mappedMessage);
              });
              const nextMessages = [...loadedMessageIdsRef.current.values()]
                .sort((first, second) =>
                  new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
                );
              setMessages(nextMessages);
              setHasEarlierMessages(hasMoreMessagesRef.current);
              setError(null);
              setLoading(false);
            } catch (mappingError) {
              setError(
                mappingError instanceof Error
                  ? mappingError.message
                  : 'Não foi possível interpretar as mensagens deste chat.',
              );
              setLoading(false);
            }
          },
          (listenerError) => {
            if (!active) return;
            setError(listenerError.message || 'Não foi possível carregar as mensagens.');
            setLoading(false);
          },
        );
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível abrir este chat.');
        setLoading(false);
      }
    }

    void listenToChat();
    return () => {
      active = false;
      stopListening?.();
    };
  }, [chatId, recipientUid, retryCount]);

  const loadEarlierMessages = useCallback(async (): Promise<void> => {
    const firestore = db;
    const cursor = oldestMessageRef.current;
    if (
      !firestore ||
      !chatId ||
      !cursor ||
      !hasMoreMessagesRef.current ||
      isLoadingEarlierRef.current
    ) {
      return;
    }

    isLoadingEarlierRef.current = true;
    setIsLoadingEarlier(true);
    setError(null);
    try {
      const olderMessagesQuery = query(
        collection(firestore, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(cursor),
        limit(MESSAGE_PAGE_SIZE),
      );
      const snapshot = await getDocs(olderMessagesQuery);
      const olderMessages = snapshot.docs.map(mapMessage);
      snapshot.docs.forEach((messageDocument, index) => {
        const message = olderMessages[index];
        if (message) loadedMessageIdsRef.current.set(String(message._id), message);
      });

      oldestMessageRef.current = snapshot.docs.at(-1) ?? cursor;
      hasMoreMessagesRef.current = snapshot.docs.length === MESSAGE_PAGE_SIZE;
      setHasEarlierMessages(hasMoreMessagesRef.current);
      setMessages([...loadedMessageIdsRef.current.values()].sort((first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      ));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Não foi possível carregar as mensagens anteriores.',
      );
    } finally {
      isLoadingEarlierRef.current = false;
      setIsLoadingEarlier(false);
    }
  }, [chatId]);

  async function sendMessages(newMessages: IMessage[]): Promise<void> {
    const firestore = db;
    const user = auth?.currentUser;
    const message = newMessages[0];

    if (!message || !message.text.trim()) return;
    if (!firestore || !user || (!chatId && !recipientUid)) {
      setError('Não foi possível enviar a mensagem. Verifique sua conexão e tente novamente.');
      return;
    }

    setError(null);
    try {
      const text = message.text.trim();
      if (chatId) {
        const chatRef = doc(firestore, 'chats', chatId);
        const messageRef = doc(collection(chatRef, 'messages'));
        const batch = writeBatch(firestore);
        const timestamp = serverTimestamp();

        batch.set(messageRef, {
          createdAt: timestamp,
          senderId: user.uid,
          text,
        });
        batch.update(chatRef, {
          lastMessageAt: timestamp,
          lastMessage: {
            createdAt: timestamp,
            senderId: user.uid,
            text,
          },
          lastMessageId: messageRef.id,
          [`lastRead.${user.uid}`]: timestamp,
        });

        await batch.commit();
      } else {
        const otherUserId = recipientUid;
        if (!otherUserId || otherUserId === user.uid) {
          throw new Error('Não foi possível identificar o outro participante.');
        }

        const participants = [user.uid, otherUserId].sort();
        const directChatId = buildDirectChatId(participants);
        const chatRef = doc(firestore, 'chats', directChatId);
        const messageRef = doc(collection(chatRef, 'messages'));
        const timestamp = serverTimestamp();

        await runTransaction(firestore, async (transaction) => {
          const chatSnapshot = await transaction.get(chatRef);
          if (chatSnapshot.exists()) {
            const existingParticipants = chatSnapshot.data().participants;
            if (
              !Array.isArray(existingParticipants)
              || existingParticipants.length !== 2
              || !participants.every((participant) => existingParticipants.includes(participant))
            ) {
              throw new Error('O identificador do chat já está em uso.');
            }

            transaction.set(messageRef, {
              createdAt: timestamp,
              senderId: user.uid,
              text,
            });
            transaction.update(chatRef, {
              lastMessageAt: timestamp,
              lastMessage: { createdAt: timestamp, senderId: user.uid, text },
              lastMessageId: messageRef.id,
              [`lastRead.${user.uid}`]: timestamp,
            });
            return;
          }

          transaction.set(chatRef, {
            participants,
            lastRead: { [user.uid]: timestamp },
            lastMessageAt: timestamp,
            lastMessage: { createdAt: timestamp, senderId: user.uid, text },
            lastMessageId: messageRef.id,
          });
          transaction.set(messageRef, {
            createdAt: timestamp,
            senderId: user.uid,
            text,
          });
        });

        router.replace({
          pathname: '/chat',
          params: { chatId: directChatId, title: title ?? 'Chat' },
        });
      }
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Não foi possível enviar a mensagem.');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar para os chats"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title || 'Chat'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {error && chatReady ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.accentDark} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !chatReady || !currentUser ? (
        <View style={styles.loadingState}>
          <Ionicons name="chatbubbles-outline" size={42} color={colors.accent} />
          <Text style={styles.errorText}>
            {error ?? 'Não foi possível abrir este chat.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            onPress={() => setRetryCount((count) => count + 1)}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <GiftedChat
          messages={messages}
          onSend={(outgoingMessages) => void sendMessages(outgoingMessages)}
          loadEarlierMessagesProps={{
            isAvailable: hasEarlierMessages,
            isInfiniteScrollEnabled: Platform.OS !== 'web',
            isLoading: isLoadingEarlier,
            label: 'Carregar mensagens anteriores',
            onPress: () => void loadEarlierMessages(),
          }}
          user={currentUser}
          colorScheme="light"
          isTyping={false}
          textInputProps={{
            placeholder: 'Escreva uma mensagem...',
            placeholderTextColor: colors.secondary,
            style: styles.composer,
          }}
          locale="pt-BR"
          messagesContainerStyle={styles.messages}
          keyboardAvoidingViewProps={{ keyboardVerticalOffset: insets.top + 60 }}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: styles.incomingBubble,
                right: styles.outgoingBubble,
              }}
              textStyle={{
                left: styles.incomingMessageText,
                right: styles.outgoingMessageText,
              }}
              bottomContainerStyle={{
                left: styles.incomingMeta,
                right: styles.outgoingMeta,
              }}
            />
          )}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={styles.inputToolbar}
              primaryStyle={styles.inputToolbarPrimary}
            />
          )}
          renderSend={(props) => (
            <Send
              {...props}
              containerStyle={styles.sendContainer}
              sendButtonProps={{ accessibilityLabel: 'Enviar mensagem' }}
            >
              <View style={styles.sendButton}>
                <Ionicons name="send" size={17} color={colors.white} />
              </View>
            </Send>
          )}
          isAvatarOnTop
          timeTextStyle={{
            left: { color: colors.secondary, fontFamily: 'Inter_400Regular', fontSize: 10 },
            right: { color: colors.white, fontFamily: 'Inter_400Regular', fontSize: 10 },
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  title: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    textAlign: 'center',
  },
  messages: {
    backgroundColor: colors.background,
  },
  incomingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  outgoingBubble: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  incomingMessageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.body,
  },
  outgoingMessageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  incomingMeta: {
    paddingTop: 4,
  },
  outgoingMeta: {
    paddingTop: 4,
  },
  inputToolbar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  inputToolbarPrimary: {
    alignItems: 'flex-end',
    gap: 8,
  },
  composer: {
    minHeight: 42,
    maxHeight: 112,
    marginLeft: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  sendContainer: {
    marginBottom: 1,
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.accent,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FCE5ED',
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.accentDark,
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
