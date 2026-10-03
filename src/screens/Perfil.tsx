import { FirebaseError } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import BarraNavegacao from '../components/BarraNavegacao';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  buscarFotoPerfil,
  enviarFotoPerfil,
  escolherFoto,
  removerFotoPerfil,
  type OrigemFoto,
} from '../lib/fotoPerfil';

const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const colors = {
  background: '#FEF8F8',
  pink: '#E86E97',
  maroon: '#832D51',
  favorites: '#832E52',
  olive: '#7F8D18',
  white: '#FFFFFF',
  light: '#EEEEEE',
  lightMuted: 'rgba(238, 238, 238, 0.8)',
  lightOverlay: 'rgba(238, 238, 238, 0.2)',
  gray: '#888888',
  sectionLabel: '#696969',
  iconBox: '#CCCCCC',
  icon: '#696969',
  chevron: '#CCCCCC',
  text: '#1A1A1A',
  divider: 'rgba(207, 195, 200, 0.3)',
  danger: '#BA1A1A',
  dangerBox: '#FFDAD6',
  backdrop: 'rgba(0, 0, 0, 0.4)',
};

/* ---------- Ícones (adaptados do Lucide, ISC) ---------- */

function Icon({
  size,
  color,
  strokeWidth = 2,
  children,
}: {
  size: number;
  color: string;
  strokeWidth?: number;
  children: ReactNode;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </G>
    </Svg>
  );
}

function HeartIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill={colors.light}
        d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3.016 0L5 15c-1.5-1.5-3-3.2-3-5.5"
      />
    </Svg>
  );
}

function ChevronIcon({ size = 12, color = colors.chevron }: { size?: number; color?: string }) {
  return (
    <Icon size={size} color={color} strokeWidth={2.5}>
      <Path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

const rowIcons = {
  notificacoes: (color: string) => (
    <Icon size={16} color={color}>
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </Icon>
  ),
  busca: (color: string) => (
    <Icon size={16} color={color}>
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.34-4.34" />
    </Icon>
  ),
  forum: (color: string) => (
    <Icon size={16} color={color}>
      <Path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-.99L3 21l1.99-5.5a8.4 8.4 0 0 1-.99-4A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      <Circle cx={8} cy={12} r={0.5} />
      <Circle cx={12} cy={12} r={0.5} />
      <Circle cx={16} cy={12} r={0.5} />
    </Icon>
  ),
  chats: (color: string) => (
    <Icon size={16} color={color}>
      <Path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-5 3v-6.5A7.5 7.5 0 0 1 10.5 8H13a8 8 0 0 1 8 3.5Z" />
      <Path d="M7 4h7a6 6 0 0 1 6 6" />
    </Icon>
  ),
  configuracoes: (color: string) => (
    <Icon size={16} color={color}>
      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <Circle cx={12} cy={12} r={3} />
    </Icon>
  ),
  privacidade: (color: string) => (
    <Icon size={16} color={color}>
      <Rect x={3} y={11} width={18} height={11} rx={2} />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  ),
  ajuda: (color: string) => (
    <Icon size={16} color={color}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Icon>
  ),
  sair: (color: string) => (
    <Icon size={15} color={color}>
      <Path d="m16 17 5-5-5-5" />
      <Path d="M21 12H9" />
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </Icon>
  ),
  camera: (color: string) => (
    <Icon size={20} color={color}>
      <Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <Circle cx={12} cy={13} r={3} />
    </Icon>
  ),
  remover: (color: string) => (
    <Icon size={20} color={color}>
      <Path d="M3 6h18" />
      <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </Icon>
  ),
  galeria: (color: string) => (
    <Icon size={20} color={color}>
      <Rect x={3} y={3} width={18} height={18} rx={2} />
      <Circle cx={9} cy={9} r={2} />
      <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Icon>
  ),
};

/* ---------- Dados do usuário ---------- */

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Nome (users/{uid}) e foto (fotosPerfil/{uid}) do usuário logado. */
function usePerfil() {
  const { user } = useAuth();
  const [nome, setNome] = useState(user?.displayName ?? '');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) return;
    let ativo = true;
    getDoc(doc(db, 'users', user.uid))
      .then((snapshot) => {
        const dados = snapshot.data();
        if (ativo && typeof dados?.nome === 'string') setNome(dados.nome);
      })
      .catch(() => {});
    buscarFotoPerfil(user.uid)
      .then((foto) => {
        if (ativo && foto) setFotoUrl(foto);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [user]);

  const email = user?.email ?? '';
  return {
    user,
    nome: nome || email.split('@')[0] || 'Usuário',
    usuario: email ? `@${email.split('@')[0]}` : '',
    fotoUrl,
    setFotoUrl,
  };
}

/* ---------- Blocos da tela ---------- */

function Avatar({
  nome,
  fotoUrl,
  enviando,
  onPress,
}: {
  nome: string;
  fotoUrl: string | null;
  enviando: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      onPress={onPress}
      disabled={enviando}
      accessibilityRole="button"
      accessibilityLabel="Alterar foto de perfil"
      accessibilityState={{ busy: enviando }}
    >
      {fotoUrl ? (
        <Image source={{ uri: fotoUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarInitials}>{iniciais(nome)}</Text>
      )}
      {enviando ? (
        <View style={styles.avatarLoading}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : null}
    </Pressable>
  );
}

function CardFavoritos() {
  return (
    <View style={styles.favorites}>
      <View style={styles.favoritesInfo}>
        <View style={styles.favoritesIcon}>
          <HeartIcon />
        </View>
        <View>
          <Text style={styles.favoritesTitle}>Meus favoritos</Text>
          <Text style={styles.favoritesSubtitle}>Regiões que você salvou</Text>
        </View>
      </View>
      <View style={styles.favoritesBadge}>
        <Text style={styles.favoritesCount}>0</Text>
        <ChevronIcon size={10} color={colors.gray} />
      </View>
    </View>
  );
}

type Item = {
  label: string;
  icon: keyof typeof rowIcons;
  perigo?: boolean;
  onPress?: () => void;
};

function Secao({ titulo, itens }: { titulo: string; itens: Item[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{titulo}</Text>
      <View style={styles.card}>
        {itens.map((item, index) => (
          <View key={item.label}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <Pressable
              style={({ pressed }) => [styles.row, pressed && item.onPress && styles.pressed]}
              onPress={item.onPress}
              accessibilityRole="button"
            >
              <View style={styles.rowInfo}>
                <View style={[styles.rowIcon, item.perigo && styles.rowIconDanger]}>
                  {rowIcons[item.icon](item.perigo ? colors.danger : colors.icon)}
                </View>
                <Text style={[styles.rowText, item.perigo && styles.rowTextDanger]}>
                  {item.label}
                </Text>
              </View>
              <ChevronIcon />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function OpcoesFoto({
  visivel,
  temFoto,
  onEscolher,
  onRemover,
  onFechar,
}: {
  visivel: boolean;
  temFoto: boolean;
  onEscolher: (origem: OrigemFoto) => void;
  onRemover: () => void;
  onFechar: () => void;
}) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
      <Pressable style={styles.backdrop} onPress={onFechar} accessibilityLabel="Fechar">
        <Pressable style={styles.sheet}>
          <Text style={styles.sheetTitle}>Foto de perfil</Text>
          <Pressable
            style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
            onPress={() => onEscolher('camera')}
            accessibilityRole="button"
          >
            {rowIcons.camera(colors.maroon)}
            <Text style={styles.sheetOptionText}>Tirar foto</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
            onPress={() => onEscolher('galeria')}
            accessibilityRole="button"
          >
            {rowIcons.galeria(colors.maroon)}
            <Text style={styles.sheetOptionText}>Escolher da galeria</Text>
          </Pressable>
          {temFoto ? (
            <Pressable
              style={({ pressed }) => [styles.sheetOption, pressed && styles.pressed]}
              onPress={onRemover}
              accessibilityRole="button"
            >
              {rowIcons.remover(colors.danger)}
              <Text style={[styles.sheetOptionText, styles.rowTextDanger]}>Remover foto</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}
            onPress={onFechar}
            accessibilityRole="button"
          >
            <Text style={styles.sheetCancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function avisar(titulo: string, mensagem: string) {
  // Alert.alert não aparece no navegador.
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

export default function Perfil() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { user, nome, usuario, fotoUrl, setFotoUrl } = usePerfil();
  const [opcoesVisiveis, setOpcoesVisiveis] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function trocarFoto(origem: OrigemFoto) {
    setOpcoesVisiveis(false);
    if (!user) return;

    try {
      const uri = await escolherFoto(origem);
      if (!uri) return;

      setEnviando(true);
      setFotoUrl(await enviarFotoPerfil(user, uri));
    } catch (erro) {
      console.error('[perfil] falha ao trocar a foto', erro);
      avisar(
        'Não foi possível trocar a foto',
        erro instanceof FirebaseError && erro.code === 'permission-denied'
          ? 'Sem permissão para salvar a foto. Confira as regras do Firestore.'
          : erro instanceof Error && !('code' in erro)
            ? erro.message
            : 'Verifique sua conexão e tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  async function removerFoto() {
    setOpcoesVisiveis(false);
    if (!user) return;

    try {
      setEnviando(true);
      await removerFotoPerfil(user.uid);
      setFotoUrl(null);
    } catch (erro) {
      console.error('[perfil] falha ao remover a foto', erro);
      avisar(
        'Não foi possível remover a foto',
        erro instanceof FirebaseError && erro.code === 'permission-denied'
          ? 'Sem permissão para remover a foto. Confira as regras do Firestore.'
          : 'Verifique sua conexão e tente novamente.',
      );
    } finally {
      setEnviando(false);
    }
  }

  const abrirOpcoes = () => setOpcoesVisiveis(true);

  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Avatar nome={nome} fotoUrl={fotoUrl} enviando={enviando} onPress={abrirOpcoes} />
            <Text style={styles.name} numberOfLines={1}>
              {nome}
            </Text>
            {usuario ? (
              <Text style={styles.username} numberOfLines={1}>
                {usuario}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              onPress={abrirOpcoes}
              disabled={enviando}
              accessibilityRole="button"
            >
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <CardFavoritos />

            <Secao
              titulo="Preferências"
              itens={[
                { label: 'Notificações', icon: 'notificacoes' },
                { label: 'Preferências de busca', icon: 'busca' },
              ]}
            />

            <Secao
              titulo="Comunicação"
              itens={[
                { label: 'Fórum', icon: 'forum', onPress: () => router.push('/forum') },
                { label: 'Chats', icon: 'chats', onPress: () => router.push('/chats') },
              ]}
            />

            <Secao
              titulo="Conta"
              itens={[
                { label: 'Configurações', icon: 'configuracoes' },
                { label: 'Privacidade', icon: 'privacidade' },
                { label: 'Ajuda e suporte', icon: 'ajuda' },
                { label: 'Sair', icon: 'sair', perigo: true, onPress: signOut },
              ]}
            />
          </View>
        </ScrollView>

        <BarraNavegacao ativa="perfil" />
      </View>

      <OpcoesFoto
        visivel={opcoesVisiveis}
        temFoto={!!fotoUrl}
        onEscolher={trocarFoto}
        onRemover={removerFoto}
        onFechar={() => setOpcoesVisiveis(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  /* Espaço para a barra flutuante */
  scroll: {
    paddingBottom: 112,
  },
  pressed: {
    opacity: 0.8,
  },

  /* Cabeçalho rosa: 297 de altura, cantos 0 0 32 92 */
  header: {
    height: 297,
    paddingTop: 64,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: colors.pink,
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 92,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive,
    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    color: colors.light,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  name: {
    marginTop: 20,
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
    color: colors.white,
  },
  username: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.light,
  },
  editButton: {
    marginTop: 14,
    paddingTop: 7,
    paddingBottom: 8.39,
    paddingHorizontal: 32,
    borderRadius: 9999,
    backgroundColor: colors.maroon,
  },
  editButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.12,
    color: colors.white,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  /* Card de favoritos */
  favorites: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 9999,
    backgroundColor: colors.favorites,
    boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.05)',
  },
  favoritesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  favoritesIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightOverlay,
  },
  favoritesTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.light,
  },
  favoritesSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.lightMuted,
  },
  favoritesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 9999,
    backgroundColor: colors.light,
  },
  favoritesCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.12,
    color: colors.gray,
  },

  /* Seções em lista */
  section: {
    paddingTop: 7,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.12,
    color: colors.sectionLabel,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 14,
    backgroundColor: colors.white,
    boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.05)',
  },
  divider: {
    height: 0.5,
    marginHorizontal: 17.5,
    backgroundColor: colors.divider,
  },
  row: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconBox,
  },
  rowIconDanger: {
    backgroundColor: colors.dangerBox,
  },
  rowText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  rowTextDanger: {
    fontFamily: fonts.medium,
    color: colors.danger,
  },

  /* Opções de foto */
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.backdrop,
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background,
  },
  sheetTitle: {
    marginBottom: 4,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlign: 'center',
  },
  sheetOption: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.light,
  },
  sheetOptionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  sheetCancel: {
    height: 48,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: colors.maroon,
  },
  sheetCancelText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: colors.white,
  },
});
