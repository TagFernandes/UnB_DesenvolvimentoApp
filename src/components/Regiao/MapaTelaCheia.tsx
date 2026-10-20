import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from './tokens';

type Props = {
  visivel: boolean;
  nome: string;
  lat: number;
  lng: number;
  onFechar: () => void;
};

/** Zoom inicial da tela cheia, um pouco mais perto que o do card. */
const DELTA_TELA_CHEIA = 0.04;

/** Mapa interativo da RA em tela cheia, aberto a partir do card de localização. */
export default function MapaTelaCheia({ visivel, nome, lat, lng, onFechar }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      onRequestClose={onFechar}
      statusBarTranslucent
    >
      <View style={styles.fundo}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: lat,
            longitude: lng,
            latitudeDelta: DELTA_TELA_CHEIA,
            longitudeDelta: DELTA_TELA_CHEIA,
          }}
          userInterfaceStyle="light"
          toolbarEnabled={false}
        >
          <Marker coordinate={{ latitude: lat, longitude: lng }} title={nome} pinColor={colors.maroon} />
        </MapView>

        <View style={[styles.topo, { top: insets.top + 12 }]}>
          <View style={styles.etiqueta}>
            <Text style={styles.nome} numberOfLines={1}>
              {nome}
            </Text>
          </View>
          <Pressable
            onPress={onFechar}
            hitSlop={12}
            style={styles.fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar mapa"
          >
            <Ionicons name="close" size={24} color={colors.title} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: colors.mapPlaceholder,
  },
  topo: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  etiqueta: {
    flexShrink: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.15)',
  },
  nome: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.title,
  },
  fechar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.15)',
  },
});
