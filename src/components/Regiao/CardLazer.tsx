import { StyleSheet, Text, View } from 'react-native';

import type { PerfilRegiao } from '../../lib/regioes';
import { Card, CardTitulo, Fonte } from './Card';
import { colors, fonts } from './tokens';

/** Lista de itens com a % de moradores e uma barra de progresso. */
export default function CardLazer({ leisure }: { leisure: PerfilRegiao['leisure'] }) {
  return (
    <Card>
      <CardTitulo>Lazer</CardTitulo>

      <View style={styles.lista}>
        {leisure.items.map(({ label, percent }) => {
          const valor = Math.min(100, Math.max(0, percent));
          return (
            <View key={label} style={styles.item} accessible accessibilityLabel={`${label}: ${valor}%`}>
              <View style={styles.linha}>
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
                <Text style={styles.percentual}>{valor}%</Text>
              </View>
              <View style={styles.trilha}>
                <View style={[styles.barra, { width: `${valor}%` }]} />
              </View>
            </View>
          );
        })}
      </View>

      <Fonte style={styles.fonte}>{leisure.source}</Fonte>
    </Card>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: 8,
  },
  item: {
    gap: 2,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 18,
    color: colors.title,
  },
  percentual: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.title,
  },
  trilha: {
    height: 3,
    overflow: 'hidden',
    borderRadius: 9999,
    backgroundColor: colors.track,
  },
  barra: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.maroon,
  },
  fonte: {
    paddingTop: 6,
  },
});
