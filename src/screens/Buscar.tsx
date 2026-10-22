import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BarraNavegacao from '../components/BarraNavegacao';
import { colors, fonts } from '../components/Regiao/tokens';
import { listarPerfisRegioes, normalizar, type PerfilRegiao } from '../lib/regioes';

const tokens = {
  background: '#FAFBF8',
  searchBg: '#EBEBEB',
  searchText: '#8A8A8E',
} as const;

/** A barra de navegação fica a 26 do rodapé e tem 50 de altura. */
const ESPACO_BARRA = 26 + 50 + 24;

function CardRegiao({ regiao, onPress }: { regiao: PerfilRegiao; onPress: () => void }) {
  const foto = regiao.photos[0];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${regiao.name}`}
    >
      <View style={styles.foto}>
        {foto && <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
      </View>
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>
          {regiao.name}
        </Text>
        {!!regiao.description && (
          <Text style={styles.descricao} numberOfLines={2}>
            {regiao.description}
          </Text>
        )}
        {regiao.tags.length > 0 && (
          <View style={styles.tags}>
            {regiao.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.textoTag}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function BuscarScreen() {
  const router = useRouter();
  const [regioes, setRegioes] = useState<PerfilRegiao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregar() {
        setErro(null);
        try {
          const itens = await listarPerfisRegioes();
          if (ativo) setRegioes(itens);
        } catch (error) {
          if (ativo) setErro(error instanceof Error ? error.message : 'Erro ao carregar regiões.');
        } finally {
          if (ativo) setCarregando(false);
        }
      }
      void carregar();
      return () => {
        ativo = false;
      };
    }, []),
  );

  const termo = normalizar(busca.trim());
  const filtradas = regioes.filter((regiao) =>
    normalizar(`${regiao.name} ${regiao.tags.join(' ')} ${regiao.description}`).includes(termo),
  );

  const renderItem: ListRenderItem<PerfilRegiao> = ({ item }) => (
    <CardRegiao
      regiao={item}
      onPress={() =>
        router.push({ pathname: '/regiao', params: { regionId: item.id, regionName: item.name } })
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.titulo} accessibilityRole="header">
              Buscar
            </Text>
            <Text style={styles.subtitulo}>explore as regiões administrativas do DF</Text>

            <View style={styles.busca}>
              <Feather name="search" size={16} color={tokens.searchText} />
              <TextInput
                style={styles.inputBusca}
                placeholder="Pesquisar região..."
                placeholderTextColor={tokens.searchText}
                accessibilityLabel="Pesquisar região"
                value={busca}
                onChangeText={setBusca}
                returnKeyType="search"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          carregando ? (
            <ActivityIndicator style={styles.vazio} size="large" color={colors.maroon} />
          ) : (
            <Text style={[styles.vazio, styles.textoVazio]}>
              {erro
                ? `Erro ao carregar regiões: ${erro}`
                : regioes.length === 0
                  ? 'Nenhuma região cadastrada ainda.'
                  : 'Nenhuma região encontrada.'}
            </Text>
          )
        }
      />

      <BarraNavegacao ativa="buscar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.background,
  },
  lista: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: ESPACO_BARRA,
  },
  titulo: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.64,
    color: colors.title,
  },
  subtitulo: {
    marginTop: 2,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: tokens.searchText,
  },
  busca: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: tokens.searchBg,
  },
  inputBusca: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.title,
  },
  separador: {
    height: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  },
  pressed: {
    opacity: 0.85,
  },
  foto: {
    width: 84,
    height: 84,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.photoPlaceholder,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nome: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.title,
  },
  descricao: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.secondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
    backgroundColor: colors.pink,
  },
  textoTag: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: colors.tagText,
  },
  vazio: {
    marginTop: 24,
  },
  textoVazio: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.secondary,
  },
});
