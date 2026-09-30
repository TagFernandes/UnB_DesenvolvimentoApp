import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import type { User } from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from './firebase';

export type OrigemFoto = 'camera' | 'galeria';

/**
 * A foto fica em fotosPerfil/{uid}, separada de users/{uid}: quem lê o perfil
 * não baixa a imagem junto, e a foto só é buscada onde um avatar aparece.
 */
const COLECAO_FOTOS = 'fotosPerfil';

/** Lado da foto salva. O avatar aparece com 96pt (até ~288px em telas 3x). */
const TAMANHO_FOTO = 256;
/** Qualidade do JPEG (0 a 1). Com 256px a foto fica em torno de 15–30 KB. */
const QUALIDADE_FOTO = 0.6;
/** Margem de segurança bem abaixo do limite de 1 MB por documento do Firestore. */
const LIMITE_BYTES = 200_000;

/**
 * Abre a câmera ou a galeria já com recorte quadrado.
 * Retorna a URI local da imagem, ou null se o usuário cancelar.
 */
export async function escolherFoto(origem: OrigemFoto): Promise<string | null> {
  const permissao =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    throw new Error(
      origem === 'camera'
        ? 'Permita o acesso à câmera nas configurações do aparelho.'
        : 'Permita o acesso às fotos nas configurações do aparelho.',
    );
  }

  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  };

  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);

  if (resultado.canceled || !resultado.assets[0]) return null;
  return resultado.assets[0].uri;
}

/** Reduz a foto para 256px e recomprime em JPEG. Retorna uma data URI. */
export async function compactarFoto(uri: string): Promise<string> {
  const imagem = await ImageManipulator.manipulate(uri)
    .resize({ width: TAMANHO_FOTO })
    .renderAsync();
  const resultado = await imagem.saveAsync({
    base64: true,
    compress: QUALIDADE_FOTO,
    format: SaveFormat.JPEG,
  });
  if (!resultado.base64) {
    throw new Error('Não foi possível processar a imagem.');
  }
  return `data:image/jpeg;base64,${resultado.base64}`;
}

/** Compacta a foto e salva em fotosPerfil/{uid}. Retorna a data URI salva. */
export async function enviarFotoPerfil(usuario: User, uri: string): Promise<string> {
  if (!db) {
    throw new Error('Firebase não configurado. Preencha o .env.local e reinicie o servidor.');
  }

  const foto = await compactarFoto(uri);
  if (foto.length > LIMITE_BYTES) {
    throw new Error('A foto ficou grande demais. Tente outra imagem.');
  }

  await setDoc(doc(db, COLECAO_FOTOS, usuario.uid), {
    foto,
    atualizadoEm: serverTimestamp(),
  });

  cacheFotos.set(usuario.uid, Promise.resolve(foto));
  return foto;
}

/** Busca a foto de perfil de um usuário, ou null se ele não tiver foto. */
export async function buscarFotoPerfil(uid: string): Promise<string | null> {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, COLECAO_FOTOS, uid));
  const foto = snapshot.data()?.foto;
  return typeof foto === 'string' ? foto : null;
}

/** Apaga a foto de perfil. O avatar volta a mostrar as iniciais. */
export async function removerFotoPerfil(uid: string): Promise<void> {
  if (!db) {
    throw new Error('Firebase não configurado. Preencha o .env.local e reinicie o servidor.');
  }
  await deleteDoc(doc(db, COLECAO_FOTOS, uid));
  cacheFotos.set(uid, Promise.resolve(null));
}

/**
 * Fotos já buscadas nesta sessão, por uid. Guarda a Promise para que vários
 * avatares do mesmo autor (ex.: vários comentários) façam uma leitura só.
 */
const cacheFotos = new Map<string, Promise<string | null>>();

/** Igual a buscarFotoPerfil, mas reaproveita o resultado das buscas anteriores. */
export function buscarFotoPerfilEmCache(uid: string): Promise<string | null> {
  const emCache = cacheFotos.get(uid);
  if (emCache) return emCache;

  const busca = buscarFotoPerfil(uid).catch(() => {
    // Sem cache em caso de erro, para tentar de novo na próxima vez.
    cacheFotos.delete(uid);
    return null;
  });
  cacheFotos.set(uid, busca);
  return busca;
}

/** Foto de perfil de um usuário para os avatares em miniatura; null mostra as iniciais. */
export function useFotoPerfil(uid: string | null | undefined): string | null {
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    setFoto(null);
    if (!uid) return;
    let ativo = true;
    void buscarFotoPerfilEmCache(uid).then((resultado) => {
      if (ativo) setFoto(resultado);
    });
    return () => {
      ativo = false;
    };
  }, [uid]);

  return foto;
}
