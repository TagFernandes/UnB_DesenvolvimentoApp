import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obterVersaoApp } from '../lib/versao';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

const equipe = [
  { nome: 'Thiago Fernandes Carvalho de Souza', github: 'TagFernandes' },
  { nome: 'Lucas Saad Rodrigues', github: 'lucassaad' },
  { nome: 'Vitor Alencar Ribeiro', github: 'Vito061' },
] as const;

function Integrante({ nome, github }: (typeof equipe)[number]) {
  const [erro, setErro] = useState(false);
  const [foco, setFoco] = useState(false);
  const [hover, setHover] = useState(false);

  async function abrirGitHub() {
    setErro(false);
    try {
      await Linking.openURL(`https://github.com/${github}`);
    } catch {
      setErro(true);
    }
  }

  return (
    <View style={styles.integrante}>
      <Text style={styles.nome}>{nome}</Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Abrir GitHub de ${nome}, @${github}`}
        accessibilityHint="Abre um link externo."
        onPress={abrirGitHub}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        style={({ pressed }) => [
          styles.github,
          (pressed || hover) && styles.githubAtivo,
          foco && styles.foco,
        ]}
      >
        <Ionicons name="logo-github" size={20} color={colors.maroon} />
        <Text style={styles.githubTexto}>@{github}</Text>
        <Ionicons name="open-outline" size={16} color={colors.maroon} />
      </Pressable>
      {erro ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.erro}>
          Não foi possível abrir o GitHub. Tente novamente.
        </Text>
      ) : null}
    </View>
  );
}

export default function Sobre() {
  const router = useRouter();
  const versao = obterVersaoApp();
  const [focoVoltar, setFocoVoltar] = useState(false);

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace('/perfil');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao perfil"
          onPress={voltar}
          onFocus={() => setFocoVoltar(true)}
          onBlur={() => setFocoVoltar(false)}
          style={({ pressed }) => [
            styles.voltar,
            pressed && styles.githubAtivo,
            focoVoltar && styles.foco,
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.maroon} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.titulo}>Sobre o mapeei</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.apresentacao}>
          <Image
            source={require('../../assets/images/logo_mapeei.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="mapeei"
          />
          <Text style={styles.descricao}>
            Projeto acadêmico desenvolvido na Universidade de Brasília como parte da formação e do
            portfólio da equipe.
          </Text>
        </View>

        <View style={styles.equipe}>
          <View style={styles.tituloEquipe}>
            <View style={styles.marcaEquipe} />
            <Text accessibilityRole="header" style={styles.subtitulo}>Equipe mapeei</Text>
          </View>
          <Text style={styles.apoio}>
            Conheça quem desenvolveu o projeto e acompanhe nosso trabalho no GitHub.
          </Text>
          <View style={styles.lista}>
            {equipe.map((integrante) => <Integrante key={integrante.github} {...integrante} />)}
          </View>
        </View>

        <View style={styles.rodape}>
          <Text selectable style={styles.versao}>{versao.descricao}</Text>
          {versao.ambiente ? <Text style={styles.ambiente}>{versao.ambiente}</Text> : null}
          <View style={styles.aviso}>
            <Text accessibilityRole="header" style={styles.tituloAviso}>Aviso legal</Text>
            <Text style={styles.textoAviso}>
              Este software é um projeto acadêmico, fornecido “como está”, sem garantias de qualquer
              natureza. Pode apresentar falhas ou informações incompletas ou desatualizadas.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cabecalho: {
    width: '100%', maxWidth: 600, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  voltar: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  titulo: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.maroon },
  conteudo: {
    width: '100%', maxWidth: 600, alignSelf: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
  },
  apresentacao: { marginBottom: 32 },
  logo: { width: 112, height: 64, alignSelf: 'center', marginBottom: 16 },
  descricao: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  equipe: { gap: 12 },
  tituloEquipe: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marcaEquipe: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.pink },
  subtitulo: { flex: 1, fontFamily: fonts.bold, fontSize: 24, color: colors.maroon },
  apoio: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  lista: { gap: 12, marginTop: 4 },
  integrante: { padding: 20, borderRadius: 20, gap: 12, backgroundColor: colors.white },
  nome: {
    minHeight: 44, fontFamily: fonts.bold, fontSize: 14, lineHeight: 22, color: colors.text,
  },
  github: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch',
    minHeight: 44, maxWidth: '100%', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, backgroundColor: colors.surfaceTint,
    borderWidth: 2, borderColor: 'transparent',
  },
  githubTexto: {
    flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 22, color: colors.maroon,
  },
  githubAtivo: { backgroundColor: colors.surfaceTint, opacity: 0.8 },
  foco: { borderWidth: 2, borderColor: colors.maroon },
  erro: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.maroon },
  rodape: { marginTop: 32 },
  versao: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  ambiente: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, color: colors.textSecondary },
  aviso: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border, gap: 8 },
  tituloAviso: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  textoAviso: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.textSecondary },
});
