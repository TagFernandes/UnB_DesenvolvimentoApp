import BarraNavegacao from '../components/BarraNavegacao';

import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { collection, getDocs, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';


/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const colors = {
  background: '#FDF8FA',
  surface: '#FFFFFF',
  border: '#EBCFD9',
  textPrimary: '#1C1C1E',
  textSecondary: '#8A8A8E',
  textBody: '#5E5E62',
  searchBg: '#EBEBEB',
  searchText: '#8A8A8E',
  accent: '#E0457B',
  badgeBg: '#FBD3E4',
  badgeText: '#B4185F',
  online: '#5C7F1E',
  offline: '#B5B5B8',
  tabBg: '#FFFFFF',
  tabBorder: '#EBCFD9',
  tabIcon: '#9A9A9E',
  decoration: '#FBF3D0',
} as const;

const fontSizes = {
  title: 32,
  subtitle: 14,
  search: 14,
  cardTitle: 15,
  badge: 10,
  body: 13,
  meta: 11,
} as const;

const spacing = {
  screen: 20,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

const radius = {
  card: 14,
  pill: 999,
  badge: 6,
} as const;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type ForumItem = {
  id: string;
  region: string;
  conversations: number;
  description: string;
  online: boolean;
  activity: string;
  comments: number;
  likes: number;
};

type RegionData = {
  name?: string;
  conversation_count?: number;
  last_activity_at?: Timestamp;
  last_conversation_like_count?: number;
  last_conversation_reply_count?: number;
  last_conversation_title?: string;
};

type ForumCardProps = {
  item: ForumItem;
  onPress: () => void;
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */
function ForumCard({ item, onPress }: ForumCardProps): React.JSX.Element {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.region}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.conversations} conversas</Text>
        </View>
      </View>

      <Text style={styles.cardBody} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.online ? colors.online : colors.offline },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              item.online ? styles.statusTextOnline : styles.statusTextOffline,
            ]}
          >
            {item.activity}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Feather name="message-square" size={13} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.comments}</Text>
          </View>
          <View style={styles.stat}>
            <Feather name="heart" size={13} color={colors.textSecondary} />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function ForumScreen(): React.JSX.Element {
  const router = useRouter();
  const [forums, setForums] = useState<ForumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useFocusEffect(useCallback(() => {
    let ativo = true;

    async function carregarRegioes(): Promise<void> {
      setLoading(true);
      setErro(null);
      try {
        if (!db) throw new Error('Firebase não está configurado.');

        const snapshot = await getDocs(collection(db, 'regions'));
        const items = snapshot.docs.map((documento) => {
          const region = documento.data() as RegionData;
          const ultimaAtividade = region.last_activity_at?.toDate();
          const minutosDesdeAtividade = ultimaAtividade
            ? Math.max(0, Math.floor((Date.now() - ultimaAtividade.getTime()) / 60000))
            : null;

          let activity = 'Sem atividade recente';
          if (minutosDesdeAtividade !== null && ultimaAtividade) {
            activity = minutosDesdeAtividade < 1
              ? 'Ativa agora'
              : `Ativa há ${minutosDesdeAtividade} min`;
            if (minutosDesdeAtividade >= 60) {
              const horas = Math.floor(minutosDesdeAtividade / 60);
              activity = horas < 24
                ? `Ativa há ${horas} h`
                : `Última atividade: ${ultimaAtividade.toLocaleDateString('pt-BR')}`;
            }
          }

          return {
            id: documento.id,
            region: region.name ?? documento.id,
            conversations: region.conversation_count ?? 0,
            description: region.last_conversation_title ?? 'Nenhuma conversa recente.',
            online: minutosDesdeAtividade !== null && minutosDesdeAtividade < 15,
            activity,
            comments: region.last_conversation_reply_count ?? 0,
            likes: region.last_conversation_like_count ?? 0,
          };
        });

        if (ativo) setForums(items);
      } catch (error) {
        if (ativo) {
          setErro(error instanceof Error ? error.message : 'Erro ao carregar regiões.');
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    void carregarRegioes();
    return () => {
      ativo = false;
    };
  }, []));

  const renderItem: ListRenderItem<ForumItem> = ({ item }) => (
    <ForumCard
      item={item}
      onPress={() =>
        router.push({
          pathname: '/conversas',
          params: { regionId: item.id, regionName: item.region },
        })
      }
    />
  );
  const regioesFiltradas = forums.filter((item) =>
    `${item.region} ${item.description}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')),
  );

  const renderHeader = (): React.JSX.Element => (
    <View>
      <Text style={styles.title}>Fórum</Text>
      <Text style={styles.subtitle}>converse com moradores das RAs</Text>

      <View style={styles.searchBox}>
        <Feather name="search" size={16} color={colors.searchText} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar conversa..."
          placeholderTextColor={colors.searchText}
          value={busca}
          onChangeText={setBusca}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.decoration} pointerEvents="none" />

      <FlatList<ForumItem>
        data={regioesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.emptyState} size="large" color={colors.accent} />
          ) : erro ? (
            <Text style={styles.emptyStateText}>Erro ao carregar regiões: {erro}</Text>
          ) : (
            <Text style={styles.emptyStateText}>
              {forums.length === 0 ? 'Nenhuma região encontrada.' : 'Nenhuma conversa encontrada.'}
            </Text>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <BarraNavegacao ativa="mensagens" />
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  decoration: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 90,
    height: 90,
    backgroundColor: colors.decoration,
    opacity: 0.6,
    transform: [{ rotate: '45deg' }],
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },

  /* Header */
  title: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: fontSizes.subtitle,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg,
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.searchBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.search,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  emptyState: {
    marginTop: spacing.xl,
  },
  emptyStateText: {
    marginTop: spacing.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.cardTitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.badgeBg,
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: fontSizes.badge,
    fontWeight: '600',
    color: colors.badgeText,
  },
  cardBody: {
    fontSize: fontSizes.body,
    lineHeight: 18,
    color: colors.textBody,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: fontSizes.meta,
  },
  statusTextOnline: {
    color: colors.online,
    fontWeight: '600',
  },
  statusTextOffline: {
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  statText: {
    fontSize: fontSizes.meta,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },

  /* Tab bar */
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '86%',
    height: 60,
    backgroundColor: colors.tabBg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.tabBorder,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tabItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.badgeBg,
  },
});