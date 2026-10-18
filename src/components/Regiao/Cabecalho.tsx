import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from './tokens';

type Props = {
  titulo: string;
  onVoltar: () => void;
  /** Sem os botões de ação enquanto a RA não tem perfil. */
  favoritada?: boolean;
  favoritoDesabilitado?: boolean;
  onFavoritar?: () => void;
  onCompartilhar?: () => void;
};

/** Top app bar: voltar (círculo verde), nome da RA, favoritar e compartilhar. */
export default function Cabecalho({
  titulo,
  onVoltar,
  favoritada = false,
  favoritoDesabilitado = false,
  onFavoritar,
  onCompartilhar,
}: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onVoltar}
        hitSlop={8}
        style={({ pressed }) => [styles.voltar, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="arrow-back" size={16} color={colors.white} />
      </Pressable>

      <Text style={styles.titulo} numberOfLines={1} accessibilityRole="header">
        {titulo}
      </Text>

      <View style={styles.acoes}>
        {onFavoritar && (
          <Pressable
            onPress={onFavoritar}
            disabled={favoritoDesabilitado}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={favoritada ? 'Remover dos favoritos' : 'Favoritar região'}
            accessibilityState={{ selected: favoritada, disabled: favoritoDesabilitado }}
          >
            <Ionicons
              name={favoritada ? 'heart' : 'heart-outline'}
              size={22}
              color={favoritada ? colors.maroon : colors.icon}
            />
          </Pressable>
        )}
        {onCompartilhar && (
          <Pressable
            onPress={onCompartilhar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar região"
          >
            <Ionicons name="share-social-outline" size={21} color={colors.icon} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Header 53 de altura; voltar 32x32 em left 18, título em left 62 */
  header: {
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 20,
    gap: 12,
    backgroundColor: colors.header,
  },
  voltar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive,
  },
  pressed: {
    opacity: 0.8,
  },
  titulo: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.55,
    color: colors.title,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
});
