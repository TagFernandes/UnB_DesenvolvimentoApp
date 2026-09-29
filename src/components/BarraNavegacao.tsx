import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

const colors = {
  navPink: '#E86E97',
  navIcon: '#CCCCCC',
  white: '#FFFFFF',
};

type Aba = 'inicio' | 'buscar' | 'mensagens' | 'perfil';

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

function HomeIcon({ color }: { color: string }) {
  // Adaptado do Lucide "house", ISC.
  return (
    <StrokeIcon width={24} height={23.1} viewBox="0 1 24 23" color={color} strokeWidth={2}>
      <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <Path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </StrokeIcon>
  );
}

function BuscarIcon({ color }: { color: string }) {
  return (
    <StrokeIcon width={25.46} height={21.33} viewBox="0 0 26 22" color={color} strokeWidth={2}>
      <Path d="M12 17H6.5L2 20.5V4a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v7" />
      <Circle cx={19} cy={15.5} r={3} />
      <Line x1={21.2} y1={17.7} x2={24} y2={20.5} />
    </StrokeIcon>
  );
}

function MensagensIcon({ color, fundo }: { color: string; fundo: string }) {
  // Dois balões: o menor fica na frente e é preenchido com a cor do fundo
  // para esconder o contorno do maior.
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={color} strokeWidth={1.8}>
      <Path d="M20.93 14A8 8 0 1 0 18 16.93L21.5 18.5Z" />
      <Path d="M5 19.83A5 5 0 1 0 3.17 18L2 21.5Z" fill={fundo} />
    </StrokeIcon>
  );
}

function PerfilIcon({ color }: { color: string }) {
  // Adaptado do Lucide "circle-user", ISC.
  return (
    <StrokeIcon width={26.8} height={26.67} viewBox="0 0 24 24" color={color} strokeWidth={1.8}>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={10} r={3} />
      <Path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </StrokeIcon>
  );
}

const abas: {
  aba: Aba;
  label: string;
  Icon: (props: { color: string; fundo: string }) => ReactNode;
  rota?: Href;
}[] = [
  { aba: 'inicio', label: 'Início', Icon: HomeIcon, rota: '/' },
  { aba: 'buscar', label: 'Buscar', Icon: BuscarIcon },
  { aba: 'mensagens', label: 'Mensagens', Icon: MensagensIcon, rota: '/forum' },
  { aba: 'perfil', label: 'Perfil', Icon: PerfilIcon, rota: '/perfil' },
];

/** Barra flutuante no rodapé das telas principais. */
export default function BarraNavegacao({ ativa }: { ativa: Aba }) {
  const router = useRouter();

  return (
    <View style={styles.navBar}>
      {abas.map(({ aba, label, Icon, rota }) => {
        const selecionada = aba === ativa;
        return (
          <Pressable
            key={aba}
            style={[styles.navItem, selecionada && styles.navItemActive]}
            onPress={rota && !selecionada ? () => router.replace(rota) : undefined}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: selecionada }}
          >
            <Icon
              color={selecionada ? colors.white : colors.navIcon}
              fundo={selecionada ? colors.navPink : colors.white}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Barra flutuante do Figma: 326.26x50, padding 8 33, bottom 26. Com a aba
     de Mensagens ativa, o space-between dá o gap de ~50 do Figma e mantém os
     ícones das pontas no lugar quando a aba ativa muda. */
  navBar: {
    position: 'absolute',
    bottom: 26,
    alignSelf: 'center',
    width: 326.26,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
