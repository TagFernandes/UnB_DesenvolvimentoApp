import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PerfilRegiao } from '../../lib/regioes';
import { Card, CardTitulo, Fonte } from './Card';
import { colors, fonts } from './tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

const MODOS: { chave: keyof PerfilRegiao['mobility']['modes']; label: string; icon: IconName }[] = [
  { chave: 'metro', label: 'Metrô', icon: 'train-outline' },
  { chave: 'bus', label: 'Ônibus', icon: 'bus-outline' },
  { chave: 'bike', label: 'Ciclovia', icon: 'bicycle-outline' },
];

/** Modos disponíveis em verde; os que faltam na RA ficam em cinza. */
export default function CardMobilidade({ mobility }: { mobility: PerfilRegiao['mobility'] }) {
  return (
    <Card style={styles.card}>
      <CardTitulo>Mobilidade</CardTitulo>
      {!!mobility.summary && <Text style={styles.resumo}>{mobility.summary}</Text>}

      <View style={styles.modos}>
        {MODOS.map(({ chave, label, icon }) => {
          const disponivel = mobility.modes[chave];
          return (
            <View
              key={chave}
              style={styles.modo}
              accessible
              accessibilityLabel={`${label}: ${disponivel ? 'disponível' : 'indisponível'}`}
            >
              <Ionicons name={icon} size={18} color={disponivel ? colors.olive : colors.muted} />
              <Text style={styles.modoLabel}>{label}</Text>
            </View>
          );
        })}
      </View>

      <Fonte>{mobility.source}</Fonte>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 13,
    paddingHorizontal: 17,
    paddingBottom: 13,
  },
  resumo: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
  },
  /* Três modos numa linha só: no card de 153.5 sobram ~118 de largura. */
  modos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingTop: 8,
  },
  modo: {
    alignItems: 'center',
    gap: 4,
  },
  modoLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.secondary,
  },
});
