import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from './tokens';

/** Card branco com borda cinza usado em "Principais categorias". */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitulo({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.titulo} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Fonte dos dados (ex.: "PDAD 2021"), no rodapé do card. */
export function Fonte({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  if (!children) return null;
  return (
    <View style={style}>
      <Text style={styles.fonte}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 24,
    color: colors.title,
  },
  fonte: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 15,
    color: colors.secondary,
  },
});
