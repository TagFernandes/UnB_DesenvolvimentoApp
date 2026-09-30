import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const colors = {
  background: '#FDF4F6',
  surface: '#FFFFFF',
  border: '#EFD9E1',
  textPrimary: '#1C1C1E',
  textSecondary: '#8A8A8E',
  textBody: '#4A4A4E',
  searchBg: '#EBEBEB',
  searchText: '#8A8A8E',
  accent: '#E8508A',
  accentDark: '#A32B63',
  back: '#6F8F1F',
  onAccent: '#FFFFFF',
  chipBorder: '#E6C9D3',
  avatarBg: '#E4D3D9',
  avatarText: '#6B5860',
} as const;

const fontSizes = {
  screenTitle: 18,
  title: 30,
  subtitle: 14,
  search: 14,
  chip: 14,
  cardTitle: 16,
  badge: 10,
  body: 13,
  meta: 11,
  initials: 9,
} as const;

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  xxl: 32,
} as const;

const radius = {
  card: 14,
  pill: 999,
  badge: 6,
} as const;

const sizes = {
  topButton: 36,
  search: 44,
  chip: 38,
  avatarSmall: 22,
  fab: 52,
  minTouch: 44,
} as const;

const layout = {
  tabletBreakpoint: 768,
  maxContentWidth: 640,
} as const;

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
type Category = 'Segurança' | 'Mobilidade' | 'Custo de vida' | 'Lazer' | 'Geral';
type CategoryCode = 'safety' | 'mobility' | 'cost_of_living' | 'leisure' | 'general';
type Filter = 'Todas' | Category;

type Post = {
  id: string;
  title: string;
  body: string;
  category: CategoryCode;
  author: string;
  initials: string;
  time: string;
  comments: number;
  likes: number;
  liked: boolean;
};

type BadgeColors = { background: string; text: string };

type ChipProps = { label: Filter; active: boolean; onPress: () => void };
type AvatarProps = { initials: string; label: string; uri?: string };
type PostCardProps = {
  post: Post;
  onOpen: () => void;
  onToggleLike: () => void;
  likeDisabled: boolean;
};

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const FILTERS: readonly Filter[] = [
  'Todas',
  'Geral',
  'Segurança',
  'Mobilidade',
  'Custo de vida',
  'Lazer',
];
const CATEGORIES: readonly Category[] = FILTERS.slice(1) as Category[];
const CATEGORY_LABELS: Record<CategoryCode, Category> = {
  safety: 'Segurança',
  mobility: 'Mobilidade',
  cost_of_living: 'Custo de vida',
  leisure: 'Lazer',
  general: 'Geral',
};
const CATEGORY_COLORS: Record<CategoryCode, BadgeColors> = {
  safety: { background: '#E5EBCB', text: '#5C7F1E' },
  mobility: { background: '#E6E3EF', text: '#5A5780' },
  cost_of_living: { background: '#F6EBC2', text: '#8A6A00' },
  leisure: { background: '#DDEBC8', text: '#4E7A1E' },
  general: { background: '#E8E8E8', text: '#666666' },
};

type ConversationData = {
  author_name?: string;
  body?: string;
  category?: CategoryCode;
  created_at?: Timestamp;
  like_count?: number;
  reply_count?: number;
  region_id?: string;
  title?: string;
};

type RegionData = {
  last_activity_at?: Timestamp;
  last_conversation_id?: string;
};

function readDate(data: ConversationData): Date | undefined {
  return data.created_at?.toDate();
}

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

function mapConversation(id: string, data: ConversationData, liked: boolean): Post {
  const author = data.author_name?.trim() || 'Autor desconhecido';
  const initials = author
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR');
  const category = data.category && data.category in CATEGORY_LABELS ? data.category : 'general';

  return {
    id,
    title: data.title?.trim() || 'Conversa sem título',
    body: data.body ?? '',
    category,
    author,
    initials: initials || 'M',
    time: formatTime(readDate(data)),
    comments: data.reply_count ?? 0,
    likes: data.like_count ?? 0,
    liked,
  };
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */
function Avatar({ initials, label }: AvatarProps): React.JSX.Element {
  return (
    <View style={styles.avatarSmall} accessibilityLabel={label}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: ChipProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${label}`}
      accessibilityState={{ selected: active }}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PostCard({ post, onOpen, onToggleLike, likeDisabled }: PostCardProps): React.JSX.Element {
  const badge = CATEGORY_COLORS[post.category];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversa ${post.title}`}
      style={styles.card}
      onPress={onOpen}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{post.title}</Text>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{CATEGORY_LABELS[post.category]}</Text>
        </View>
      </View>

      <Text style={styles.cardBody} numberOfLines={3}>
        {post.body}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.authorRow}>
          <Avatar initials={post.initials} label={`Foto de ${post.author}`} />
          <Text style={styles.authorText}>
            {post.author} • {post.time}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat} accessibilityLabel={`${post.comments} comentários`}>
            <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.statText}>{post.comments}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.liked ? 'Remover curtida' : 'Curtir conversa'}
            accessibilityState={{ selected: post.liked, disabled: likeDisabled }}
            disabled={likeDisabled}
            hitSlop={10}
            style={styles.stat}
            onPress={onToggleLike}
          >
            <Ionicons
              name={post.liked ? 'heart' : 'heart-outline'}
              size={14}
              color={post.liked ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.statText, post.liked && styles.statTextLiked]}>{post.likes}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function ConversasScreen(): React.JSX.Element {
  const router = useRouter();
  const { regionId, regionName } = useLocalSearchParams<{ regionId?: string; regionName?: string }>();
  const { width } = useWindowDimensions();
  const gutter = width >= layout.tabletBreakpoint ? spacing.xl : spacing.screen;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('Todas');
  const [likingPostIds, setLikingPostIds] = useState<string[]>([]);
  const inFlightLikes = useRef(new Set<string>());

  // Recarrega ao voltar para a tela, para refletir comentários e curtidas feitos na conversa.
  useFocusEffect(useCallback(() => {
    let active = true;

    async function loadConversations(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const firestore = db;
        if (!firestore) throw new Error('Firebase não está configurado.');
        if (!regionId) throw new Error('Não foi informada uma região.');

        const conversationsQuery = query(
          collection(firestore, 'conversations'),
          where('region_id', '==', regionId),
        );
        const snapshot = await getDocs(conversationsQuery);
        const userId = auth?.currentUser?.uid;
        const items = (await Promise.all(snapshot.docs.map(async (document) => {
          const data = document.data() as ConversationData;
          const likeSnapshot = userId
            ? await getDoc(doc(firestore, 'conversations', document.id, 'likes', userId))
            : null;
          return {
            post: mapConversation(document.id, data, likeSnapshot?.exists() ?? false),
            createdAt: readDate(data)?.getTime() ?? 0,
          };
        })))
          .sort((first, second) => second.createdAt - first.createdAt)
          .map(({ post }) => post);
        if (active) setPosts(items);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar conversas.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConversations();
    return () => {
      active = false;
    };
  }, [regionId]));

  async function toggleLike(post: Post): Promise<void> {
    const userId = auth?.currentUser?.uid;
    if (!db || !regionId) return;
    if (!userId) {
      Alert.alert('Entre na sua conta', 'É necessário entrar para curtir uma conversa.');
      return;
    }
    if (inFlightLikes.current.has(post.id)) return;

    inFlightLikes.current.add(post.id);
    setLikingPostIds((current) => [...current, post.id]);
    try {
      const conversationRef = doc(db, 'conversations', post.id);
      const likeRef = doc(db, 'conversations', post.id, 'likes', userId);
      const regionRef = doc(db, 'regions', regionId);
      const result = await runTransaction(db, async (transaction) => {
        const [conversationSnapshot, likeSnapshot, regionSnapshot] = await Promise.all([
          transaction.get(conversationRef),
          transaction.get(likeRef),
          transaction.get(regionRef),
        ]);
        if (!conversationSnapshot.exists()) throw new Error('Conversa não encontrada.');

        const conversation = conversationSnapshot.data() as ConversationData;
        if (conversation.region_id !== regionId) throw new Error('A conversa não pertence a esta região.');

        const wasLiked = likeSnapshot.exists();
        const likeCount = Math.max(0, (conversation.like_count ?? 0) + (wasLiked ? -1 : 1));
        if (wasLiked) {
          transaction.delete(likeRef);
        } else {
          transaction.set(likeRef, { user_uid: userId, created_at: serverTimestamp() });
        }
        transaction.update(conversationRef, { like_count: likeCount });

        if (regionSnapshot.exists()) {
          const region = regionSnapshot.data() as RegionData;
          const isLatestConversation = region.last_conversation_id === post.id || (
            !region.last_conversation_id &&
            region.last_activity_at !== undefined &&
            conversation.created_at !== undefined &&
            region.last_activity_at.isEqual(conversation.created_at)
          );
          if (isLatestConversation) {
            transaction.update(regionRef, { last_conversation_like_count: likeCount });
          }
        }

        return { liked: !wasLiked, likes: likeCount };
      });

      setPosts((current) => current.map((item) =>
        item.id === post.id ? { ...item, liked: result.liked, likes: result.likes } : item,
      ));
    } catch (likeError) {
      Alert.alert(
        'Não foi possível atualizar a curtida',
        likeError instanceof Error ? likeError.message : 'Tente novamente.',
      );
    } finally {
      inFlightLikes.current.delete(post.id);
      setLikingPostIds((current) => current.filter((id) => id !== post.id));
    }
  }

  const visiblePosts = posts.filter((post) => {
    const matchesFilter = activeFilter === 'Todas' || CATEGORY_LABELS[post.category] === activeFilter;
    const text = `${post.title} ${post.body} ${post.author}`.toLocaleLowerCase('pt-BR');
    return matchesFilter && text.includes(search.toLocaleLowerCase('pt-BR'));
  });

  const renderItem: ListRenderItem<Post> = ({ item }) => (
    <View style={{ paddingHorizontal: gutter }}>
      <PostCard
        post={item}
        onOpen={() =>
          router.push({
            pathname: '/conversa',
            params: { conversationId: item.id, regionId },
          })
        }
        onToggleLike={() => void toggleLike(item)}
        likeDisabled={likingPostIds.includes(item.id)}
      />
    </View>
  );

  const renderHeader = (): React.JSX.Element => (
    <View>
      <View style={{ paddingHorizontal: gutter }}>
        <Text style={styles.title} accessibilityRole="header">
          {regionName ?? 'Região'}
        </Text>
        <Text style={styles.subtitle}>
          {posts.length} {posts.length === 1 ? 'conversa nesta região' : 'conversas nesta região'}
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.searchText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar conversa..."
            placeholderTextColor={colors.searchText}
            accessibilityLabel="Pesquisar conversa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsContent, { paddingHorizontal: gutter }]}
        style={styles.chips}
      >
        {FILTERS.map((filter) => (
          <Chip
            key={filter}
            label={filter}
            active={filter === activeFilter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={[styles.topBar, { paddingHorizontal: gutter }]}>
          <View style={styles.topBarLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={(sizes.minTouch - sizes.topButton) / 2}
              style={styles.backButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/forum'))}
            >
              <Ionicons name="arrow-back" size={20} color={colors.onAccent} />
            </Pressable>
            <Text style={styles.screenTitle} accessibilityRole="header">
              Conversas
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            hitSlop={(sizes.minTouch - sizes.topButton) / 2}
            style={styles.profileButton}
          >
            <Text style={styles.profileText}>MR</Text>
          </Pressable>
        </View>

        <FlatList<Post>
          data={visiblePosts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.emptyState} size="large" color={colors.accent} />
            ) : error ? (
              <Text style={styles.emptyStateText}>Erro ao carregar conversas: {error}</Text>
            ) : (
              <Text style={styles.emptyStateText}>
                {posts.length === 0 ? 'Nenhuma conversa nesta região.' : 'Nenhuma conversa encontrada.'}
              </Text>
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nova conversa"
          style={[styles.fab, { right: gutter }]}
          onPress={() =>
            router.push({
              pathname: '/nova-conversa',
              params: { regionId, regionName },
            })
          }
        >
          <Ionicons name="pencil" size={22} color={colors.onAccent} />
        </Pressable>
      </View>
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  listContent: {
    paddingBottom: sizes.fab + spacing.xxl * 2,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    marginTop: spacing.xl,
  },
  emptyStateText: {
    marginTop: spacing.xl,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: sizes.topButton,
    height: sizes.topButton,
    borderRadius: sizes.topButton / 2,
    backgroundColor: colors.back,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  screenTitle: {
    fontSize: fontSizes.screenTitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileButton: {
    width: sizes.topButton,
    height: sizes.topButton,
    borderRadius: sizes.topButton / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    fontSize: fontSizes.meta,
    fontWeight: '700',
    color: colors.onAccent,
  },

  /* Heading */
  title: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    lineHeight: 36,
    color: colors.textPrimary,
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
    height: sizes.search,
    backgroundColor: colors.searchBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.search,
    color: colors.textPrimary,
    paddingVertical: 0,
  },

  /* Chips */
  chips: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    flexGrow: 0,
  },
  chipsContent: {
    alignItems: 'center',
  },
  chip: {
    height: sizes.chip,
    minWidth: sizes.minTouch,
    paddingHorizontal: spacing.xl - spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  chipText: {
    fontSize: fontSizes.chip,
  },
  chipTextActive: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },

  /* Card */
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg - spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: fontSizes.cardTitle,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  badge: {
    borderRadius: radius.badge,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: fontSizes.badge,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: sizes.avatarSmall,
    height: sizes.avatarSmall,
    borderRadius: sizes.avatarSmall / 2,
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarInitials: {
    fontSize: fontSizes.initials,
    fontWeight: '700',
    color: colors.avatarText,
  },
  authorText: {
    fontSize: fontSizes.meta,
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
  statTextLiked: {
    color: colors.accent,
  },

  /* Floating action button */
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    width: sizes.fab,
    height: sizes.fab,
    borderRadius: sizes.fab / 2,
    backgroundColor: colors.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});