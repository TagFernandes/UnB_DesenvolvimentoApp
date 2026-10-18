import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DestaqueForum } from '../../lib/regioes';
import { colors, fonts } from './tokens';

/** Os avatares alternam verde e rosa, como no design. */
const CORES_AVATAR = [colors.olive, colors.pink];

type Props = {
  destaques: DestaqueForum[];
  carregando: boolean;
  onAbrirConversa: (id: string) => void;
  onVerForum: () => void;
};

export default function DestaquesForum({ destaques, carregando, onAbrirConversa, onVerForum }: Props) {
  return (
    <View style={styles.secao}>
      <View style={styles.lista}>
        {carregando ? (
          <ActivityIndicator color={colors.maroon} style={styles.vazio} />
        ) : destaques.length === 0 ? (
          <Text style={styles.textoVazio}>
            Ainda não há conversas sobre esta região. Seja a primeira pessoa a comentar!
          </Text>
        ) : (
          destaques.map((destaque, indice) => (
            <Pressable
              key={destaque.id}
              onPress={() => onAbrirConversa(destaque.id)}
              style={({ pressed }) => [styles.comentario, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Conversa de ${destaque.author}, ${destaque.likes} curtidas: ${destaque.body}`}
            >
              <View style={styles.cabecalho}>
                <View style={styles.autor}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: CORES_AVATAR[indice % CORES_AVATAR.length] },
                    ]}
                  >
                    <Text style={styles.iniciais}>{destaque.initials}</Text>
                  </View>
                  <Text style={styles.nome} numberOfLines={1}>
                    {destaque.author}
                  </Text>
                </View>
                <View style={styles.curtidas}>
                  <Ionicons name="heart-outline" size={13} color={colors.likes} />
                  <Text style={styles.totalCurtidas}>{destaque.likes}</Text>
                </View>
              </View>
              <Text style={styles.corpo} numberOfLines={3}>
                {destaque.body}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Pressable
        onPress={onVerForum}
        style={({ pressed }) => [styles.botao, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.textoBotao}>Ver fórum completo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: {
    gap: 16,
  },
  lista: {
    gap: 16,
  },
  vazio: {
    paddingVertical: 24,
  },
  textoVazio: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.comment,
  },
  comentario: {
    padding: 16,
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  },
  pressed: {
    opacity: 0.85,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  autor: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.title,
  },
  nome: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.title,
  },
  curtidas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  totalCurtidas: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.likes,
  },
  corpo: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.comment,
  },
  botao: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: colors.maroon,
    boxShadow:
      '0px 10px 15px -3px rgba(131, 45, 81, 0.2), 0px 4px 6px -4px rgba(131, 45, 81, 0.2)',
  },
  textoBotao: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
});
