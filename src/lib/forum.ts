import { FirebaseError } from 'firebase/app';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

import { sendForumLikePushNotification } from '../services/notificationService';
import { db } from './firebase';

/**
 * Curte ou descurte uma conversa. As regras do Firestore só aceitam a curtida
 * junto com o contador da conversa, na mesma transação.
 */
export async function alternarCurtida(
  conversationId: string,
  userId: string,
): Promise<{ liked: boolean; likes: number }> {
  const firestore = db;
  if (!firestore) throw new Error('Firebase não está configurado.');

  const conversationRef = doc(firestore, 'conversations', conversationId);
  const likeRef = doc(firestore, 'conversations', conversationId, 'likes', userId);

  let targetAuthorUid = '';
  let conversationTitle = 'sua conversa';
  let regionId: string | undefined;

  const result = await runTransaction(firestore, async (transaction) => {
    const [conversationSnapshot, likeSnapshot] = await Promise.all([
      transaction.get(conversationRef),
      transaction.get(likeRef),
    ]);
    if (!conversationSnapshot.exists()) throw new Error('Conversa não encontrada.');

    const data = conversationSnapshot.data();
    targetAuthorUid = typeof data.author_uid === 'string' ? data.author_uid : '';
    conversationTitle =
      typeof data.title === 'string' && data.title.trim()
        ? data.title.trim()
        : 'sua conversa';
    regionId = typeof data.region_id === 'string' ? data.region_id : undefined;

    const wasLiked = likeSnapshot.exists();
    const atual = data.like_count;
    const likeCount = Math.max(0, (typeof atual === 'number' ? atual : 0) + (wasLiked ? -1 : 1));

    if (wasLiked) {
      transaction.delete(likeRef);
    } else {
      transaction.set(likeRef, { user_uid: userId, created_at: serverTimestamp() });
    }
    transaction.update(conversationRef, { like_count: likeCount });

    return { liked: !wasLiked, likes: likeCount };
  });

  // Dispara notificação apenas quando o utilizador dá "gostei" (não ao remover curtida)
  if (result.liked && targetAuthorUid && targetAuthorUid !== userId) {
    void sendForumLikePushNotification({
      senderUid: userId,
      recipientUid: targetAuthorUid,
      conversationId,
      conversationTitle,
      regionId,
    });
  }

  return result;
}

/** Traduz os erros do Firestore, que chegam em inglês, para mostrar ao usuário. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof FirebaseError) {
    switch (erro.code) {
      case 'permission-denied':
        return 'Você não tem permissão para fazer isso.';
      case 'unavailable':
        return 'Sem conexão. Verifique sua internet e tente novamente.';
      case 'not-found':
        return 'Não encontramos o que você procurava.';
      default:
        return padrao;
    }
  }
  return erro instanceof Error ? erro.message : padrao;
}