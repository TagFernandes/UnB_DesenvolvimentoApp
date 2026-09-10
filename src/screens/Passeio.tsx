import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

import { useAuth } from '../contexts/AuthContext';

const fonts = {
  regular: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const colors = {
  background: '#FAFBF8',
  maroon: '#832D51',
  pink: '#E96E97',
  navPink: '#E86E97',
  lime: '#A6BA1A',
  title: '#1A1A1A',
  body: '#1E1619',
  muted: '#AAAAAA',
  navIcon: '#CCCCCC',
  heroTitle: '#FFF9FB',
  white: '#FFFFFF',
  black: '#000000',
};

const images = {
  logo: require('../../assets/images/logo_mapeei.png'),
  passeios: require('../../assets/images/landing/passeios-df.jpg'),
  guia: require('../../assets/images/landing/guia-primeiro-imovel.jpg'),
};

/* ---------- Formas e gradientes ---------- */

/** Pontos de uma estrela de `points` pontas centrada em (cx, cy). */
function starPoints(points: number, outer: number, inner: number, cx: number, cy: number) {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    coords.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return coords.join(' ');
}

type GradientStop = { offset: number; color: string; opacity: number };

/** Gradiente de cima para baixo (180deg) cobrindo todo o pai. */
function VerticalGradient({ id, stops }: { id: string; stops: GradientStop[] }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map((stop) => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/* ---------- Ícones ---------- */

function StrokeIcon({
  width,
  height,
  viewBox,
  color,
  strokeWidth,
  children,
}: {
  width: number;
  height: number;
  viewBox: string;
  color: string;
  strokeWidth: number;
  children: ReactNode;
}) {
  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      <G
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </G>
    </Svg>
  );
}

function SegurancaIcon() {
  return (
    <StrokeIcon width={49} height={60} viewBox="0 0 49 60" color={colors.white} strokeWidth={3.5}>
      {/* Boné */}
      <Path d="M9.5 18.75C9.5 1 35.5 1 35.5 18.75" />
      <Line x1={7} y1={18.75} x2={38} y2={18.75} />
      {/* Rosto */}
      <Path d="M12.5 18.75V22C12.5 38.5 32.5 38.5 32.5 22V18.75" />
      {/* Ombros */}
      <Path d="M2 55V52C2 45 7 41 14 41H31C38 41 43 45 43 52V55" />
    </StrokeIcon>
  );
}

function TransporteIcon() {
  return (
    <Svg width={39} height={51} viewBox="0 0 39 51">
      <G fill="none" stroke={colors.white} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        <Rect x={1.75} y={1.75} width={35.1} height={41.3} rx={7} />
        <Line x1={13} y1={9} x2={25.6} y2={9} />
        <Line x1={1.75} y1={24} x2={36.85} y2={24} />
        <Path d="M5 44.8V49.25M33.6 44.8V49.25" />
      </G>
      <Circle cx={10} cy={33.5} r={2.2} fill={colors.white} />
      <Circle cx={28.6} cy={33.5} r={2.2} fill={colors.white} />
    </Svg>
  );
}

function LazerIcon() {
  // Bicicleta (adaptado do Lucide "bike", ISC).
  return (
    <StrokeIcon width={64} height={64} viewBox="0 0 24 24" color={colors.white} strokeWidth={1.3125}>
      <Circle cx={18.5} cy={17.5} r={3.5} />
      <Circle cx={5.5} cy={17.5} r={3.5} />
      <Circle cx={15} cy={5} r={1} />
      <Path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </StrokeIcon>
  );
}

function CustoDeVidaIcon() {
  // Moedas (adaptado do Lucide "coins", ISC).
  return (
    <StrokeIcon width={48} height={48} viewBox="0 0 24 24" color={colors.white} strokeWidth={1.75}>
      <Circle cx={8} cy={8} r={6} />
      <Path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <Path d="M7 6h1v4" />
      <Path d="m16.71 13.88.7.71-2.82 2.82" />
    </StrokeIcon>
  );
}

function HomeIcon() {
  // Adaptado do Lucide "house", ISC.
  return (
    <StrokeIcon width={24} height={23.1} viewBox="0 1 24 23" color={colors.white} strokeWidth={2}>
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </StrokeIcon>
  );
}

function BuscarIcon() {
  return (
    <StrokeIcon width={25.46} height={21.33} viewBox="0 0 26 22" color={colors.navIcon} strokeWidth={2}>
      <Path d="M12 17H6.5L2 20.5V4a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v7" />
      <Circle cx={19} cy={15.5} r={3} />
      <Line x1={21.2} y1={17.7} x2={24} y2={20.5} />
    </StrokeIcon>
  );
}

function MensagensIcon() {
  // Adaptado do Lucide "message-circle", ISC.
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={colors.navIcon} strokeWidth={1.8}>
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </StrokeIcon>
  );
}

function PerfilIcon() {
  // Adaptado do Lucide "circle-user", ISC.
  return (
    <StrokeIcon width={26.8} height={26.67} viewBox="0 0 24 24" color={colors.navIcon} strokeWidth={1.8}>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={10} r={3} />
      <Path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </StrokeIcon>
  );
}

/* ---------- Blocos da tela ---------- */

function CarrosselPasseios() {
  const totalPaginas = 5;
  const paginaAtual = 0;

  return (
    <View style={styles.heroShadow}>
      <View style={styles.hero}>
        <Image
          source={images.passeios}
          style={styles.fillImage}
          resizeMode="cover"
          accessibilityLabel="Vista aérea de uma ponte sobre o lago"
        />
        <VerticalGradient
          id="gradientePasseios"
          stops={[
            { offset: 0.4039, color: '#888888', opacity: 0 },
            { offset: 0.7693, color: colors.maroon, opacity: 0.44 },
          ]}
        />

        <Svg style={styles.starPink} width={100} height={100} viewBox="0 0 100 100">
          <Polygon
            points={starPoints(8, 47, 21, 50, 50)}
            fill={colors.pink}
            stroke={colors.pink}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </Svg>
        <Svg style={styles.starLime} width={47.67} height={47.67} viewBox="0 0 48 48">
          <Polygon
            points={starPoints(5, 22, 11, 24, 25)}
            fill={colors.lime}
            stroke={colors.lime}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        </Svg>

        <Text style={styles.heroTitle}>Passeios{'\n'}no DF</Text>

        <View style={styles.pagination}>
          {Array.from({ length: totalPaginas }, (_, index) => (
            <View
              key={index}
              style={[styles.dot, index === paginaAtual && styles.dotSelected]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const cardsInformacao = [
  { label: 'Segurança', icon: <SegurancaIcon />, iconTop: 13 },
  { label: 'Transporte', icon: <TransporteIcon />, iconTop: 23 },
  { label: 'Lazer', icon: <LazerIcon />, iconTop: 11 },
  { label: 'Custo de vida', icon: <CustoDeVidaIcon />, iconTop: 21 },
];

function CardInformacao({ label, icon, iconTop }: (typeof cardsInformacao)[number]) {
  return (
    <Pressable
      style={({ pressed }) => [styles.infoCard, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.infoIcon, { top: iconTop }]}>{icon}</View>
      <Text style={styles.infoLabel}>{label}</Text>
    </Pressable>
  );
}

function CardGuia() {
  return (
    <Pressable
      style={({ pressed }) => [styles.guideShadow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Abrir o guia para quem vai morar sozinho"
    >
      <View style={styles.guide}>
        <Image
          source={images.guia}
          style={styles.fillImage}
          resizeMode="cover"
          accessibilityLabel="Chave na fechadura de uma porta"
        />
        <VerticalGradient
          id="gradienteGuia"
          stops={[
            { offset: 0.2308, color: '#686666', opacity: 0 },
            { offset: 1, color: colors.maroon, opacity: 1 },
          ]}
        />
        <Text style={styles.guideLabel}>Clique aqui para conferir nosso guia!</Text>
      </View>
    </Pressable>
  );
}

function BarraNavegacao() {
  const { signOut } = useAuth();

  return (
    <View style={styles.navBar}>
      <Pressable
        style={[styles.navItem, styles.navItemActive]}
        accessibilityRole="button"
        accessibilityLabel="Início"
        accessibilityState={{ selected: true }}
      >
        <HomeIcon />
      </Pressable>
      <Pressable style={styles.navItem} accessibilityRole="button" accessibilityLabel="Buscar">
        <BuscarIcon />
      </Pressable>
      <Pressable style={styles.navItem} accessibilityRole="button" accessibilityLabel="Mensagens">
        <MensagensIcon />
      </Pressable>
      {/* Provisório: enquanto não existe tela de perfil, o ícone faz logout. */}
      <Pressable
        style={styles.navItem}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sair da conta"
      >
        <PerfilIcon />
      </Pressable>
    </View>
  );
}

export default function Passeio() {
  return (
    <View style={styles.container}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Image
            source={images.logo}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="mapeei"
          />

          <CarrosselPasseios />

          <View style={styles.sectionTitle}>
            <Text style={styles.title}>Para saber mais</Text>
            <Text style={styles.subtitle}>clique no card para navegar pelas informações</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.infoList}
          >
            {cardsInformacao.map((card) => (
              <CardInformacao key={card.label} {...card} />
            ))}
          </ScrollView>

          <View style={styles.description}>
            <Text style={styles.body}>
              Para ajudar você a tomar decisões com mais confiança, reunimos informações de{' '}
              <Text style={styles.bodyBold}>fontes oficiais e dados públicos</Text> sobre
              segurança, transporte, comércio/lazer e custo de vida, juntamente dos{' '}
              <Text style={styles.bodyBold}>relatos de moradores reais</Text>!
            </Text>
            <Text style={styles.body}>
              Navegue por dados destrinchados e fáceis de entender, e sinta-se com repertório
              sobre o contexto local das diferentes regiões do Brasil.
            </Text>
          </View>

          <Text style={[styles.title, styles.secondTitle]}>
            Morando sozinho pela{'\n'}primeira vez?
          </Text>

          <CardGuia />

          <View style={styles.guideDescription}>
            <Text style={styles.body}>
              Nosso <Text style={styles.bodyBold}>guia</Text> reúne dicas práticas, checklists,
              explicações de termos comuns do mercado imobiliário e orientações para ajudar você
              a se preparar com mais segurança e tranquilidade para essa nova fase.
            </Text>
          </View>
        </ScrollView>

        <BarraNavegacao />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  /* Espaço para a barra flutuante: 1426 - 1330 */
  scroll: {
    paddingBottom: 96,
  },
  fillImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.85,
  },

  /* Logo: 206x116, top 59 */
  logo: {
    width: 206,
    height: 116,
    marginTop: 59,
    alignSelf: 'center',
  },

  /* Carrossel: top 190, 361x242 */
  heroShadow: {
    height: 242,
    marginTop: 15,
    marginHorizontal: 16,
    borderRadius: 32,
    boxShadow: '0px 4px 4px rgba(105, 105, 105, 0.72)',
  },
  hero: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#0B3B3A',
  },
  starPink: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  starLime: {
    position: 'absolute',
    top: 85,
    right: 11.33,
    transform: [{ rotate: '16.36deg' }],
  },
  heroTitle: {
    position: 'absolute',
    left: 20,
    top: 134,
    width: 204,
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: colors.heroTitle,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotSelected: {
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },

  /* "Para saber mais": top 448, texto em left 28 */
  sectionTitle: {
    marginTop: 16,
    paddingTop: 8,
    paddingLeft: 28,
    paddingRight: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 44.8,
    letterSpacing: -0.64,
    color: colors.title,
  },
  subtitle: {
    marginTop: -9,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },

  /* Cards: top 517, altura 135 */
  infoList: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 11.5,
    gap: 16,
  },
  infoCard: {
    width: 132,
    height: 112,
    borderRadius: 32,
    backgroundColor: colors.maroon,
    boxShadow:
      '0px 4px 4px rgba(46, 46, 46, 0.34), inset 0px 4px 4px rgba(250, 250, 250, 0.34)',
  },
  infoIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  infoLabel: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 81,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19.6,
    letterSpacing: -0.28,
    textAlign: 'center',
    color: colors.white,
  },

  /* Descrição: top 668 */
  description: {
    marginTop: 12,
    paddingHorizontal: 32,
    gap: 12,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.body,
  },
  bodyBold: {
    fontFamily: fonts.bold,
  },

  /* "Morando sozinho...": top 882, left 20 */
  secondTitle: {
    marginTop: 15,
    paddingLeft: 20,
    paddingRight: 16,
    lineHeight: 40,
  },

  /* Guia: top 978, 358x199, cantos 0 32 */
  guideShadow: {
    height: 199,
    marginTop: 15,
    marginLeft: 16,
    marginRight: 19,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    boxShadow: '0px 4px 4px rgba(46, 46, 46, 0.72)',
  },
  guide: {
    flex: 1,
    overflow: 'hidden',
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderWidth: 1,
    borderColor: colors.black,
    backgroundColor: '#E8D8C6',
  },
  guideLabel: {
    position: 'absolute',
    left: 15,
    right: 15,
    top: 160,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22.4,
    letterSpacing: -0.32,
    color: colors.white,
  },

  /* Descrição do guia: top 1193, padding 8 16 */
  guideDescription: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },

  /* Barra flutuante: 329x50, bottom 31 */
  navBar: {
    position: 'absolute',
    bottom: 31,
    alignSelf: 'center',
    width: 329.06,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 33,
    borderRadius: 9999,
    backgroundColor: colors.white,
    boxShadow: '0px 4px 18px rgba(0, 0, 0, 0.2)',
  },
  navItem: {
    height: 34,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    width: 34,
    borderRadius: 10,
    backgroundColor: colors.navPink,
  },
});
