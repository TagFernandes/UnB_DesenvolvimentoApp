import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from './tokens';

type Props = {
  fotos: string[];
  /** Índice da foto aberta; null fecha o visualizador. */
  indiceInicial: number | null;
  onFechar: () => void;
};

/** Fotos em tela cheia, passando com swipe horizontal. */
export default function VisualizadorFotos({ fotos, indiceInicial, onFechar }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [atual, setAtual] = useState(indiceInicial ?? 0);

  useEffect(() => {
    if (indiceInicial !== null) setAtual(indiceInicial);
  }, [indiceInicial]);

  return (
    <Modal
      visible={indiceInicial !== null}
      transparent
      animationType="fade"
      onRequestClose={onFechar}
      statusBarTranslucent
    >
      <View style={styles.fundo}>
        {indiceInicial !== null && (
          <FlatList
            data={fotos}
            keyExtractor={(uri, indice) => `${indice}-${uri}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={indiceInicial}
            getItemLayout={(_, indice) => ({ length: width, offset: width * indice, index: indice })}
            onMomentumScrollEnd={(evento) =>
              setAtual(Math.round(evento.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item, index }) => (
              <View style={{ width, height }}>
                <Image
                  source={{ uri: item }}
                  style={styles.imagem}
                  resizeMode="contain"
                  accessibilityLabel={`Foto ${index + 1} de ${fotos.length}`}
                />
              </View>
            )}
          />
        )}

        <View style={[styles.topo, { top: insets.top + 12 }]}>
          <Text style={styles.contador}>
            {atual + 1} / {fotos.length}
          </Text>
          <Pressable
            onPress={onFechar}
            hitSlop={12}
            style={styles.fechar}
            accessibilityRole="button"
            accessibilityLabel="Fechar fotos"
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imagem: {
    flex: 1,
  },
  topo: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contador: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.white,
  },
  fechar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
