import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { db } from '../lib/firebase';

let activeChatId: string | null = null;
let activePeerUid: string | null = null;
let activeConversationId: string | null = null;

/**
 * Regista qual chat está aberto no ecrã para evitar notificações duplicadas
 * quando o utilizador já está a ver a conversa em primeiro plano.
 */
export function setActiveChatContext(chatId: string | null, peerUid: string | null): void {
  activeChatId = chatId;
  activePeerUid = peerUid;
}

/**
 * Regista qual tópico do fórum está aberto no ecrã para não exibir banner duplicado.
 */
export function setActiveConversationContext(conversationId: string | null): void {
  activeConversationId = conversationId;
}

// Configura o comportamento quando a notificação chega com a aplicação aberta
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as
      | { chatId?: string; senderId?: string; conversationId?: string }
      | undefined;

    const isSameChatOpen =
      (Boolean(activeChatId) && data?.chatId === activeChatId) ||
      (Boolean(activePeerUid) && data?.senderId === activePeerUid);

    const isSameForumOpen =
      Boolean(activeConversationId) && data?.conversationId === activeConversationId;

    if (isSameChatOpen || isSameForumOpen) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

/**
 * Pede permissão ao utilizador e obtém o ExpoPushToken do dispositivo.
 */
export async function getDevicePushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mensagens', {
      name: 'Mensagens',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId ??
      '909aa052-ad6b-4ef7-8cb5-740a1e160d23';

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenResponse.data;
  } catch (error) {
    // No Expo Go o push remoto não é suportado; falha silenciosamente sem quebrar a app
    console.warn('Não foi possível obter o ExpoPushToken:', error);
    return null;
  }
}

/**
 * Guarda o token do dispositivo atual no array pushTokens do utilizador no Firestore.
 */
export async function registerAndSavePushToken(userId: string): Promise<void> {
  if (!db || !userId) return;

  try {
    const token = await getDevicePushToken();
    if (!token) return;

    await setDoc(
      doc(db, 'users', userId),
      { pushTokens: arrayUnion(token) },
      { merge: true },
    );
  } catch (error) {
    console.warn('Erro ao guardar push token no Firestore:', error);
  }
}

/**
 * Remove o token do dispositivo ao terminar sessão para não receber alertas de outra conta.
 */
export async function removePushTokenOnSignOut(userId: string): Promise<void> {
  if (!db || !userId) return;

  try {
    const token = await getDevicePushToken();
    if (!token) return;

    await updateDoc(doc(db, 'users', userId), {
      pushTokens: arrayRemove(token),
    });
  } catch {
    // Ignora erro caso o documento ou token não exista
  }
}

/**
 * Função auxiliar interna para disparar notificações para um utilizador específico
 * e limpar tokens inválidos (DeviceNotRegistered).
 */
async function dispatchPushToRecipient(params: {
  recipientUid: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<void> {
  const { recipientUid, title, body, data } = params;
  if (!db || !recipientUid) return;

  const recipientRef = doc(db, 'users', recipientUid);
  const recipientSnap = await getDoc(recipientRef);
  if (!recipientSnap.exists()) return;

  const rawTokens = recipientSnap.data()?.pushTokens;
  const tokens = Array.isArray(rawTokens)
    ? [...new Set(rawTokens.filter((t): t is string => typeof t === 'string' && Boolean(t.trim())))]
    : [];

  if (tokens.length === 0) return;

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    channelId: 'mensagens',
    data,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  if (Array.isArray(result?.data)) {
    for (let i = 0; i < result.data.length; i++) {
      const ticket = result.data[i];
      if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered') {
        const invalidToken = tokens[i];
        if (invalidToken) {
          await updateDoc(recipientRef, {
            pushTokens: arrayRemove(invalidToken),
          }).catch(() => {});
        }
      }
    }
  }
}

/**
 * Envia notificação de nova mensagem no Chat Direto.
 */
export async function sendChatPushNotification(params: {
  senderUid: string;
  recipientUid: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const { senderUid, recipientUid, chatId, text } = params;
  if (!db || !recipientUid || senderUid === recipientUid) return;

  try {
    const senderSnap = await getDoc(doc(db, 'users', senderUid));
    const senderNameRaw = senderSnap.data()?.nome;
    const senderName =
      typeof senderNameRaw === 'string' && senderNameRaw.trim()
        ? senderNameRaw.trim()
        : 'Nova mensagem';

    await dispatchPushToRecipient({
      recipientUid,
      title: senderName,
      body: text,
      data: {
        chatId,
        senderId: senderUid,
        senderName,
      },
    });
  } catch (error) {
    console.warn('Falha ao enviar notificação push de chat:', error);
  }
}

/**
 * Envia notificação quando alguém dá "gostei" numa conversa/publicação do fórum.
 */
export async function sendForumLikePushNotification(params: {
  senderUid: string;
  recipientUid: string;
  conversationId: string;
  conversationTitle: string;
  regionId?: string;
}): Promise<void> {
  const { senderUid, recipientUid, conversationId, conversationTitle, regionId } = params;
  if (!db || !recipientUid || senderUid === recipientUid) return;

  try {
    const senderSnap = await getDoc(doc(db, 'users', senderUid));
    const senderNameRaw = senderSnap.data()?.nome;
    const senderName =
      typeof senderNameRaw === 'string' && senderNameRaw.trim()
        ? senderNameRaw.trim()
        : 'Alguém';

    await dispatchPushToRecipient({
      recipientUid,
      title: 'Curtiram sua conversa no fórum',
      body: `${senderName} curtiu "${conversationTitle}"`,
      data: {
        conversationId,
        ...(regionId ? { regionId } : {}),
      },
    });
  } catch (error) {
    console.warn('Falha ao enviar notificação de curtida no fórum:', error);
  }
}

/**
 * Envia notificação quando alguém comenta/responde num tópico do fórum:
 * 1. Notifica o autor da conversa.
 * 2. Notifica outros utilizadores que também já comentaram naquele tópico.
 */
export async function sendForumCommentPushNotification(params: {
  senderUid: string;
  senderName: string;
  conversationId: string;
  conversationTitle: string;
  regionId?: string;
  postAuthorUid?: string;
  participantUids: string[];
  commentText: string;
}): Promise<void> {
  const {
    senderUid,
    senderName,
    conversationId,
    conversationTitle,
    regionId,
    postAuthorUid,
    participantUids,
    commentText,
  } = params;

  if (!db) return;

  try {
    const displaySender = senderName && senderName !== '-' ? senderName : 'Alguém';
    const payloadData: Record<string, string> = {
      conversationId,
      ...(regionId ? { regionId } : {}),
    };

    const tasks: Promise<void>[] = [];

    // 1. Notifica o autor do tópico (se não for ele mesmo a comentar)
    if (postAuthorUid && postAuthorUid !== senderUid) {
      tasks.push(
        dispatchPushToRecipient({
          recipientUid: postAuthorUid,
          title: `Novo comentário em "${conversationTitle}"`,
          body: `${displaySender}: ${commentText}`,
          data: payloadData,
        }),
      );
    }

    // 2. Notifica quem já tinha comentado no tópico (sem repetir o autor do post nem quem enviou)
    const uniqueParticipants = [...new Set(participantUids)].filter(
      (uid) => Boolean(uid) && uid !== senderUid && uid !== postAuthorUid,
    );

    for (const participantUid of uniqueParticipants) {
      tasks.push(
        dispatchPushToRecipient({
          recipientUid: participantUid,
          title: `Nova resposta em "${conversationTitle}"`,
          body: `${displaySender} também comentou: ${commentText}`,
          data: payloadData,
        }),
      );
    }

    await Promise.all(tasks);
  } catch (error) {
    console.warn('Falha ao enviar notificação de comentário no fórum:', error);
  }
}