import { StyleSheet, Text, View } from 'react-native';

import { posicaoNaEscala, type PerfilRegiao } from '../../lib/regioes';
import { Card, CardTitulo } from './Card';
import { colors, fonts } from './tokens';

const ALTURA_PLOT = 120;
const LARGURA_EIXO = 31;
const ALTURA_ROTULOS = 26;
const PONTO = 7.5;

/**
 * Gráfico de pirulito por tipo de crime. A escala é por faixas: os ticks
 * (0, 10, 25, 50, 100, 150) ficam igualmente espaçados, como no design.
 */
export default function CardSeguranca({ safety }: { safety: PerfilRegiao['safety'] }) {
  const { ticks, crimes } = safety;
  const ultimo = ticks.length - 1;

  return (
    <Card style={styles.card}>
      <View style={styles.titulo}>
        <CardTitulo>Segurança</CardTitulo>
      </View>

      {crimes.length > 0 && (
        <View style={styles.grafico}>
          <View style={styles.eixo}>
            {ticks.map((tick, i) => (
              <Text
                key={tick}
                style={[styles.tick, { bottom: ALTURA_ROTULOS + (ALTURA_PLOT * i) / ultimo - 7.5 }]}
              >
                {tick}
              </Text>
            ))}
          </View>

          <View style={styles.area}>
            <View style={styles.plot}>
              {ticks.map((tick, i) => (
                <View
                  key={tick}
                  style={[
                    styles.linhaGrade,
                    i === 0 && styles.linhaBase,
                    { bottom: (ALTURA_PLOT * i) / ultimo },
                  ]}
                />
              ))}

              <View style={styles.colunas}>
                {crimes.map((crime) => {
                  const altura = ALTURA_PLOT * posicaoNaEscala(crime.value, ticks);
                  return (
                    <View
                      key={crime.label}
                      style={styles.coluna}
                      accessible
                      accessibilityLabel={`${crime.label}: ${crime.value} ocorrências`}
                    >
                      <View style={[styles.haste, { height: altura }]} />
                      <View style={[styles.ponto, { bottom: altura - PONTO / 2 }]} />
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.rotulos}>
              {crimes.map((crime) => (
                <Text key={crime.label} style={styles.rotulo} numberOfLines={2}>
                  {crime.label}
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}

      <View style={styles.rodape}>
        {!!safety.summary && <Text style={styles.resumo}>{safety.summary}</Text>}
        {!!safety.source && <Text style={styles.fonte}>{safety.source}</Text>}
        {!!safety.note && <Text style={styles.nota}>{safety.note}</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 16,
    paddingLeft: 8,
    paddingRight: 14,
    paddingBottom: 10,
  },
  grafico: {
    flexDirection: 'row',
    height: ALTURA_PLOT + ALTURA_ROTULOS,
    marginTop: 18,
  },
  eixo: {
    width: LARGURA_EIXO,
  },
  tick: {
    position: 'absolute',
    right: 8,
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.axis,
  },
  area: {
    flex: 1,
    marginRight: 3,
  },
  plot: {
    height: ALTURA_PLOT,
  },
  linhaGrade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.grid,
  },
  linhaBase: {
    backgroundColor: colors.gridBase,
  },
  colunas: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  coluna: {
    flex: 1,
    alignItems: 'center',
  },
  haste: {
    position: 'absolute',
    bottom: 0,
    width: 1,
    backgroundColor: colors.lollipop,
  },
  ponto: {
    position: 'absolute',
    width: PONTO,
    height: PONTO,
    borderRadius: PONTO / 2,
    backgroundColor: colors.lollipop,
  },
  rotulos: {
    flexDirection: 'row',
    paddingTop: 4,
  },
  rotulo: {
    flex: 1,
    paddingHorizontal: 1,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 9,
    color: colors.axisLabel,
  },
  titulo: {
    paddingLeft: 8,
  },
  rodape: {
    paddingTop: 8,
    paddingLeft: 8,
    gap: 2,
  },
  resumo: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.secondary,
  },
  fonte: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 12,
    color: colors.muted,
  },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 12,
    color: colors.maroon,
  },
});
