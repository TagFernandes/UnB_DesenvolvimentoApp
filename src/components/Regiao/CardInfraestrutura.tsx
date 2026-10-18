import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { PerfilRegiao } from '../../lib/regioes';
import { Card, Fonte } from './Card';
import { colors, fonts } from './tokens';

/** "Moradores afirmaram ter na rua ou nas proximidades" + checklist. */
export default function CardInfraestrutura({
  infrastructure,
}: {
  infrastructure: PerfilRegiao['infrastructure'];
}) {
  return (
    <Card>
      <Text style={styles.titulo} accessibilityRole="header">
        Moradores afirmaram ter na rua ou nas proximidades
      </Text>

      <View style={styles.lista}>
        {infrastructure.items.map((item) => (
          <View key={item} style={styles.item}>
            <Ionicons name="checkmark-circle" size={12} color={colors.olive} />
            <Text style={styles.label}>{item}</Text>
          </View>
        ))}
      </View>

      <Fonte>{infrastructure.source}</Fonte>
    </Card>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.title,
  },
  lista: {
    paddingTop: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 18,
    color: colors.body,
  },
});
