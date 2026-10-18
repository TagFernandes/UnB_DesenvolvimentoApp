import { StyleSheet, Text, View } from 'react-native';

import type { PerfilRegiao } from '../../lib/regioes';
import { Card, CardTitulo } from './Card';
import { colors, fonts } from './tokens';

/** Altura do gráfico e espaço reservado acima das barras para o rótulo da RA. */
const ALTURA_GRAFICO = 80;
const ESPACO_ROTULO = 16;

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Renda média de cada RA em barras, da maior para a menor, com a RA atual em destaque. */
export default function CardRendimento({
  regionId,
  income,
}: {
  regionId: string;
  income: PerfilRegiao['income'];
}) {
  const ranking = [...income.ranking].sort((a, b) => b.value - a.value);
  const maior = ranking[0]?.value ?? 0;
  const atual = ranking.find((item) => item.regionId === regionId);
  const alturaBarra = (valor: number) => ((ALTURA_GRAFICO - ESPACO_ROTULO) * valor) / maior;

  return (
    <Card>
      <CardTitulo>Rendimento domiciliar</CardTitulo>
      {!!income.summary && <Text style={styles.resumo}>{income.summary}</Text>}

      {maior > 0 && (
        <View
          style={styles.grafico}
          accessible
          accessibilityLabel={
            atual
              ? `${atual.name} é a ${ranking.indexOf(atual) + 1}ª maior renda entre ${ranking.length} RAs, com ${formatoReais.format(atual.value)}`
              : `Renda média de ${ranking.length} RAs`
          }
        >
          {ranking.map((item) => (
            <View
              key={item.regionId || item.name}
              style={[
                styles.barra,
                { height: Math.max(1, alturaBarra(item.value)) },
                item.regionId === regionId && styles.barraDestaque,
              ]}
            />
          ))}

          {atual && (
            <Text
              style={[
                styles.rotulo,
                {
                  left: `${((ranking.indexOf(atual) + 0.5) / ranking.length) * 100}%`,
                  bottom: alturaBarra(atual.value) + 2,
                },
              ]}
              numberOfLines={1}
            >
              {atual.name}
            </Text>
          )}
        </View>
      )}

      {!!income.source && <Text style={styles.fonte}>{income.source}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  resumo: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.secondary,
  },
  grafico: {
    height: ALTURA_GRAFICO,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  barra: {
    flex: 1,
    backgroundColor: colors.track,
  },
  barraDestaque: {
    backgroundColor: colors.maroon,
  },
  /* Centralizado sobre a barra da RA: left no centro dela, recuado metade da largura. */
  rotulo: {
    position: 'absolute',
    width: 80,
    marginLeft: -40,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 12,
    color: colors.maroon,
  },
  fonte: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
  },
});
