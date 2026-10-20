import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import MapaTelaCheia from './MapaTelaCheia';
import { colors, fonts } from './tokens';

type Props = {
  nome: string;
  lat: number | null;
  lng: number | null;
};

/** Zoom do card: o suficiente para mostrar a RA e o entorno. */
const DELTA_CARD = 0.06;

/**
 * Prévia do mapa com o pin e o nome da RA. O mapa do card fica parado para não
 * brigar com o scroll da tela; tocar nele abre o mapa interativo em tela cheia.
 */
export default function CardLocalizacao({ nome, lat, lng }: Props) {
  const [expandido, setExpandido] = useState(false);
  const temCoordenadas = lat !== null && lng !== null;

  return (
    <>
      <Pressable
        style={styles.card}
        onPress={() => setExpandido(true)}
        disabled={!temCoordenadas}
        accessibilityRole={temCoordenadas ? 'button' : undefined}
        accessibilityLabel={`Mapa de ${nome}`}
        accessibilityHint={temCoordenadas ? 'Abre o mapa em tela cheia' : undefined}
      >
        {temCoordenadas && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: DELTA_CARD,
                longitudeDelta: DELTA_CARD,
              }}
              userInterfaceStyle="light"
              liteMode
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            />
          </View>
        )}

        <View style={styles.centro} pointerEvents="none">
          <View style={styles.pin}>
            <Ionicons name="location-sharp" size={15} color={colors.white} />
          </View>
          <View style={styles.etiqueta}>
            <Text style={styles.nome}>{nome}</Text>
          </View>
        </View>

        {temCoordenadas && (
          <View style={styles.expandir} pointerEvents="none">
            <Ionicons name="expand" size={16} color={colors.title} />
          </View>
        )}
      </Pressable>

      {temCoordenadas && (
        <MapaTelaCheia
          visivel={expandido}
          nome={nome}
          lat={lat}
          lng={lng}
          onFechar={() => setExpandido(false)}
        />
      )}
    </>
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
  expandir: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
});
