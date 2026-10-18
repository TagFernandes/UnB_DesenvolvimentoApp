import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from './tokens';

type Props = {
  nome: string;
  imagemUrl: string | null;
  atribuicao: string | null;
};

/**
 * Imagem provisória do mapa com o pin e o nome da RA. Será trocada por um
 * mapa interativo usando lat/lng do perfil.
 */
export default function CardLocalizacao({ nome, imagemUrl, atribuicao }: Props) {
  const [falhou, setFalhou] = useState(false);
  const mostrarImagem = !!imagemUrl && !falhou;

  return (
    <View style={styles.card} accessible accessibilityLabel={`Mapa de ${nome}`}>
      {mostrarImagem && (
        <Image
          source={{ uri: imagemUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFalhou(true)}
        />
      )}

      <View style={styles.centro} pointerEvents="none">
        <View style={styles.pin}>
          <Ionicons name="location-sharp" size={15} color={colors.white} />
        </View>
        <View style={styles.etiqueta}>
          <Text style={styles.nome}>{nome}</Text>
        </View>
      </View>

      {mostrarImagem && !!atribuicao && <Text style={styles.atribuicao}>{atribuicao}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 128,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.mapPlaceholder,
    boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.04)',
  },
  centro: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.maroon,
    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
  },
  etiqueta: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
  },
  nome: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.title,
  },
  atribuicao: {
    position: 'absolute',
    right: 10,
    bottom: 4,
    fontFamily: fonts.regular,
    fontSize: 8,
    color: colors.secondary,
  },
});
