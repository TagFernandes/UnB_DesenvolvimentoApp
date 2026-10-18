import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fonts } from './tokens';

type Props = {
  fotos: string[];
  nomeRegiao: string;
  onAbrir: (indice: number) => void;
};

function Foto({
  uri,
  label,
  onPress,
  style,
  children,
}: {
  uri: string;
  label: string;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.foto, style, pressed && styles.pressed]}
      accessibilityRole="imagebutton"
      accessibilityLabel={label}
    >
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </Pressable>
  );
}

/** Grid estilo Airbnb: foto principal à esquerda e duas menores à direita. */
export default function GaleriaFotos({ fotos, nomeRegiao, onAbrir }: Props) {
  const [principal, segunda, terceira] = fotos;
  const restantes = fotos.length - 3;
  const label = (indice: number) => `Abrir foto ${indice + 1} de ${fotos.length} de ${nomeRegiao}`;

  if (!principal) {
    return <View style={[styles.grid, styles.vazio]} />;
  }

  return (
    <View style={styles.grid}>
      <Foto uri={principal} label={label(0)} onPress={() => onAbrir(0)} style={styles.principal} />

      {segunda && (
        <View style={styles.coluna}>
          <Foto uri={segunda} label={label(1)} onPress={() => onAbrir(1)} style={styles.lateral} />
          {terceira && (
            <Foto
              uri={terceira}
              label={restantes > 0 ? `Ver mais ${restantes} fotos de ${nomeRegiao}` : label(2)}
              onPress={() => onAbrir(2)}
              style={styles.lateral}
            >
              {restantes > 0 && (
                <View style={styles.overlay}>
                  <Text style={styles.maisFotos}>+{restantes} fotos</Text>
                </View>
              )}
            </Foto>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* 353x256; principal 232.67, coluna 112.33, gap 8 */
  grid: {
    height: 256,
    flexDirection: 'row',
    gap: 8,
  },
  vazio: {
    borderRadius: 14,
    backgroundColor: colors.photoPlaceholder,
  },
  foto: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: colors.photoPlaceholder,
  },
  principal: {
    flex: 232.67,
  },
  coluna: {
    flex: 112.33,
    gap: 8,
  },
  lateral: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  maisFotos: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.white,
  },
});
