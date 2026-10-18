import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';

/**
 * Perfil de uma RA em region_profiles/{regionId}. Os dados são gravados pelo
 * scripts/seed_regioes.py; o app só lê. Fica separado de regions/{id}, que
 * guarda os contadores do fórum e é escrito pelos próprios usuários.
 */
const COLECAO_PERFIS = 'region_profiles';

export type ModosTransporte = { metro: boolean; bus: boolean; bike: boolean };
export type ItemPercentual = { label: string; percent: number };
export type ItemRanking = { regionId: string; name: string; value: number };
export type Ocorrencia = { label: string; value: number };

export type PerfilRegiao = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  photos: string[];
  mapImageUrl: string | null;
  mapAttribution: string | null;
  lat: number | null;
  lng: number | null;
  mobility: { summary: string; modes: ModosTransporte; source: string };
  leisure: { items: ItemPercentual[]; source: string };
  infrastructure: { items: string[]; source: string };
  income: { summary: string; ranking: ItemRanking[]; source: string };
  safety: {
    summary: string;
    crimes: Ocorrencia[];
    ticks: number[];
    source: string;
    note: string | null;
  };
};

export type DestaqueForum = {
  id: string;
  author: string;
  initials: string;
  body: string;
  likes: number;
};

/** Escala padrão do gráfico de segurança, igual ao design. */
export const TICKS_SEGURANCA = [0, 10, 25, 50, 100, 150];

/* ---------- Leitura defensiva: o documento vem sem tipo do Firestore ---------- */

type Bruto = Record<string, unknown>;

function objeto(valor: unknown): Bruto {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Bruto) : {};
}

function texto(valor: unknown, padrao = ''): string {
  return typeof valor === 'string' ? valor : padrao;
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

function lista(valor: unknown): unknown[] {
  return Array.isArray(valor) ? valor : [];
}

function textos(valor: unknown): string[] {
  return lista(valor).filter((item): item is string => typeof item === 'string' && !!item);
}

function lerPerfil(id: string, dados: Bruto): PerfilRegiao {
  const mobility = objeto(dados.mobility);
  const modes = objeto(mobility.modes);
  const leisure = objeto(dados.leisure);
  const infrastructure = objeto(dados.infrastructure);
  const income = objeto(dados.income);
  const safety = objeto(dados.safety);
  const ticks = lista(safety.ticks)
    .map(numero)
    .filter((tick): tick is number => tick !== null);

  return {
    id,
    name: texto(dados.name, id),
    description: texto(dados.description),
    tags: textos(dados.tags),
    photos: textos(dados.photos),
    mapImageUrl: texto(dados.map_image_url) || null,
    mapAttribution: texto(dados.map_attribution) || null,
    lat: numero(dados.lat),
    lng: numero(dados.lng),
    mobility: {
      summary: texto(mobility.summary),
      modes: { metro: modes.metro === true, bus: modes.bus === true, bike: modes.bike === true },
      source: texto(mobility.source),
    },
    leisure: {
      items: lista(leisure.items).map((item) => {
        const bruto = objeto(item);
        return { label: texto(bruto.label), percent: numero(bruto.percent) ?? 0 };
      }),
      source: texto(leisure.source),
    },
    infrastructure: {
      items: textos(infrastructure.items),
      source: texto(infrastructure.source),
    },
    income: {
      summary: texto(income.summary),
      ranking: lista(income.ranking).map((item) => {
        const bruto = objeto(item);
        return {
          regionId: texto(bruto.region_id),
          name: texto(bruto.name),
          value: numero(bruto.value) ?? 0,
        };
      }),
      source: texto(income.source),
    },
    safety: {
      summary: texto(safety.summary),
      crimes: lista(safety.crimes).map((item) => {
        const bruto = objeto(item);
        return { label: texto(bruto.label), value: numero(bruto.value) ?? 0 };
      }),
      ticks: ticks.length >= 2 ? ticks : TICKS_SEGURANCA,
      source: texto(safety.source),
      note: texto(safety.note) || null,
    },
  };
}

function exigirDb() {
  if (!db) throw new Error('Firebase não está configurado.');
  return db;
}

/* ---------- Consultas ---------- */

/** Retorna null quando a RA ainda não tem perfil cadastrado. */
export async function buscarPerfilRegiao(regionId: string): Promise<PerfilRegiao | null> {
  const snapshot = await getDoc(doc(exigirDb(), COLECAO_PERFIS, regionId));
  return snapshot.exists() ? lerPerfil(snapshot.id, snapshot.data()) : null;
}

export async function listarPerfisRegioes(): Promise<PerfilRegiao[]> {
  const snapshot = await getDocs(collection(exigirDb(), COLECAO_PERFIS));
  return snapshot.docs
    .map((documento) => lerPerfil(documento.id, documento.data()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
}

/**
 * Conversas mais curtidas da RA. Ordena no app, como em conversas.tsx, para
 * não exigir índice composto (region_id + like_count) no Firestore.
 */
export async function buscarDestaquesForum(
  regionId: string,
  limite = 2,
): Promise<DestaqueForum[]> {
  const snapshot = await getDocs(
    query(collection(exigirDb(), 'conversations'), where('region_id', '==', regionId)),
  );
  return snapshot.docs
    .map((documento) => {
      const dados = documento.data();
      const author = texto(dados.author_name).trim() || 'Autor desconhecido';
      return {
        id: documento.id,
        author,
        initials: iniciais(author),
        body: texto(dados.body).trim() || texto(dados.title),
        likes: numero(dados.like_count) ?? 0,
      };
    })
    .sort((a, b) => b.likes - a.likes)
    .slice(0, limite);
}

/* ---------- Favoritos: users/{uid}/favorite_regions/{regionId} ---------- */

function refFavorito(uid: string, regionId: string) {
  return doc(exigirDb(), 'users', uid, 'favorite_regions', regionId);
}

export async function regiaoFavoritada(uid: string, regionId: string): Promise<boolean> {
  return (await getDoc(refFavorito(uid, regionId))).exists();
}

export async function definirFavorito(
  uid: string,
  regionId: string,
  favoritar: boolean,
): Promise<void> {
  const ref = refFavorito(uid, regionId);
  if (favoritar) {
    await setDoc(ref, { region_id: regionId, created_at: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}

/* ---------- Gráfico de segurança ---------- */

/**
 * Posição (0 a 1, de baixo para cima) de um valor numa escala por faixas: os
 * ticks ficam igualmente espaçados e o valor é interpolado dentro da faixa.
 */
export function posicaoNaEscala(valor: number, ticks: number[]): number {
  const ultimo = ticks.length - 1;
  if (valor <= ticks[0]) return 0;
  if (valor >= ticks[ultimo]) return 1;
  const faixa = ticks.findIndex((tick, i) => i < ultimo && valor <= ticks[i + 1]);
  const inicio = ticks[faixa];
  const fim = ticks[faixa + 1];
  return (faixa + (valor - inicio) / (fim - inicio)) / ultimo;
}
