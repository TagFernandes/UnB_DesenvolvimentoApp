import * as Linking from 'expo-linking';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Cabecalho from '../components/Regiao/Cabecalho';
import CardInfraestrutura from '../components/Regiao/CardInfraestrutura';
import CardLazer from '../components/Regiao/CardLazer';
import CardLocalizacao from '../components/Regiao/CardLocalizacao';
import CardMobilidade from '../components/Regiao/CardMobilidade';
import CardRendimento from '../components/Regiao/CardRendimento';
import CardSeguranca from '../components/Regiao/CardSeguranca';
import DestaquesForum from '../components/Regiao/DestaquesForum';
import GaleriaFotos from '../components/Regiao/GaleriaFotos';
import Tags from '../components/Regiao/Tags';
import VisualizadorFotos from '../components/Regiao/VisualizadorFotos';
import { colors, fonts } from '../components/Regiao/tokens';
import { useAuth } from '../contexts/AuthContext';
import {
  buscarDestaquesForum,
  buscarPerfilRegiao,
  definirFavorito,
  regiaoFavoritada,
  type DestaqueForum,
  type PerfilRegiao,
} from '../lib/regioes';

function Secao({ titulo, children, style }: { titulo: string; children: ReactNode; style?: object }) {
  return (
    <View style={[styles.secao, style]}>
      <Text style={styles.tituloSecao} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

export default function RegiaoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { regionId, regionName } = useLocalSearchParams<{
    regionId?: string;
    regionName?: string;
  }>();

  const [perfil, setPerfil] = useState<PerfilRegiao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const [destaques, setDestaques] = useState<DestaqueForum[]>([]);
  const [carregandoDestaques, setCarregandoDestaques] = useState(true);

  const [favoritada, setFavoritada] = useState(false);
  const [salvandoFavorito, setSalvandoFavorito] = useState(false);
  const salvandoRef = useRef(false);

  const [fotoAberta, setFotoAberta] = useState<number | null>(null);

  const nome = perfil?.name ?? regionName ?? 'Região';

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        if (!regionId) throw new Error('Não foi informada uma região.');
        const dados = await buscarPerfilRegiao(regionId);
        if (ativo) setPerfil(dados);
      } catch (error) {
        if (!ativo) return;
        const codigo = (error as { code?: string } | null)?.code;
        setErro(
          codigo === 'permission-denied'
            ? 'Sem permissão para ler os dados da região. Confira as regras do Firestore (scripts/README.md).'
            : `Erro ao carregar a região: ${error instanceof Error ? error.message : 'tente novamente.'}`,
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => {
      ativo = false;
    };
  }, [regionId, tentativa]);

  useEffect(() => {
    if (!user || !regionId) return;
    let ativo = true;
    regiaoFavoritada(user.uid, regionId)
      .then((valor) => {
        if (ativo) setFavoritada(valor);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [user, regionId]);

  // Recarrega ao voltar de uma conversa, para refletir curtidas novas.
  useFocusEffect(
    useCallback(() => {
      if (!regionId) return;
      let ativo = true;
      buscarDestaquesForum(regionId)
        .then((itens) => {
          if (ativo) setDestaques(itens);
        })
        .catch(() => {
          if (ativo) setDestaques([]);
        })
        .finally(() => {
          if (ativo) setCarregandoDestaques(false);
        });
      return () => {
        ativo = false;
      };
    }, [regionId]),
  );

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/buscar');
  }

  async function alternarFavorito() {
    if (!regionId) return;
    if (!user) {
      Alert.alert('Entre na sua conta', 'É necessário entrar para favoritar uma região.');
      return;
    }
    if (salvandoRef.current) return;

    const novoValor = !favoritada;
    salvandoRef.current = true;
    setSalvandoFavorito(true);
    setFavoritada(novoValor);
    try {
      await definirFavorito(user.uid, regionId, novoValor);
    } catch (error) {
      setFavoritada(!novoValor);
      Alert.alert(
        'Não foi possível atualizar o favorito',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      salvandoRef.current = false;
      setSalvandoFavorito(false);
    }
  }

  async function compartilhar() {
    if (!regionId) return;
    const link = Linking.createURL('regiao', { queryParams: { regionId } });
    try {
      await Share.share({
        title: nome,
        message: `Conheça ${nome} no mapeei: dados de mobilidade, lazer, renda e segurança, e o que dizem os moradores.\n${link}`,
      });
    } catch {
      // O usuário fechou a folha de compartilhamento ou o sistema não suporta.
    }
  }

  function verForum() {
    router.push({ pathname: '/conversas', params: { regionId, regionName: nome } });
  }

  function abrirConversa(conversationId: string) {
    router.push({ pathname: '/conversa', params: { conversationId, regionId } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Cabecalho
        titulo={nome}
        onVoltar={voltar}
        favoritada={favoritada}
        favoritoDesabilitado={salvandoFavorito}
        onFavoritar={perfil ? () => void alternarFavorito() : undefined}
        onCompartilhar={perfil ? () => void compartilhar() : undefined}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.conteudo, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {carregando ? (
          <ActivityIndicator style={styles.estado} size="large" color={colors.maroon} />
        ) : erro ? (
          <View style={styles.estado}>
            <Text style={styles.textoEstado}>{erro}</Text>
            <Pressable
              onPress={() => setTentativa((valor) => valor + 1)}
              style={styles.tentarDeNovo}
              accessibilityRole="button"
            >
              <Text style={styles.textoTentar}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : perfil ? (
          <>
            <GaleriaFotos fotos={perfil.photos} nomeRegiao={perfil.name} onAbrir={setFotoAberta} />
            <Tags tags={perfil.tags} />
            {!!perfil.description && <Text style={styles.descricao}>{perfil.description}</Text>}

            <Secao titulo="Principais categorias">
              <View style={styles.colunas}>
                <View style={styles.colunaEsquerda}>
                  <CardMobilidade mobility={perfil.mobility} />
                  {perfil.infrastructure.items.length > 0 && (
                    <CardInfraestrutura infrastructure={perfil.infrastructure} />
                  )}
                </View>
                <View style={styles.colunaDireita}>
                  {perfil.leisure.items.length > 0 && <CardLazer leisure={perfil.leisure} />}
                </View>
              </View>
              {perfil.income.ranking.length > 0 && (
                <CardRendimento regionId={perfil.id} income={perfil.income} />
              )}
              <CardSeguranca safety={perfil.safety} />
            </Secao>

            <Secao titulo="Localização" style={styles.secaoLocalizacao}>
              <CardLocalizacao
                nome={perfil.name}
                imagemUrl={perfil.mapImageUrl}
                atribuicao={perfil.mapAttribution}
              />
            </Secao>
          </>
        ) : (
          <Text style={[styles.textoEstado, styles.semDados]}>
            Ainda não temos os dados desta região. Enquanto isso, veja o que os moradores estão
            conversando no fórum.
          </Text>
        )}

        {/* O fórum não depende do perfil: aparece mesmo se ele falhar. */}
        {!carregando && (
          <Secao titulo="Destaques do fórum">
            <DestaquesForum
              destaques={destaques}
              carregando={carregandoDestaques}
              onAbrirConversa={abrirConversa}
              onVerForum={verForum}
            />
          </Secao>
        )}
      </ScrollView>

      {perfil && (
        <VisualizadorFotos
          fotos={perfil.photos}
          indiceInicial={fotoAberta}
          onFechar={() => setFotoAberta(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.header,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  /* Main: padding 16 20 0, gap 16; conteúdo limitado em telas largas */
  conteudo: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  descricao: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    color: colors.body,
  },
  secao: {
    gap: 16,
  },
  secaoLocalizacao: {
    paddingTop: 12,
  },
  tituloSecao: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
    color: colors.title,
  },
  colunas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  colunaEsquerda: {
    flex: 153.5,
    gap: 12,
  },
  colunaDireita: {
    flex: 187.5,
  },
  estado: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 16,
  },
  textoEstado: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.secondary,
  },
  semDados: {
    paddingVertical: 24,
  },
  tentarDeNovo: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: colors.maroon,
  },
  textoTentar: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.white,
  },
});
