import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

const colors = {
  navPink: '#E86E97',
  navIcon: '#CCCCCC',
  white: '#FFFFFF',
};

type Aba = 'inicio' | 'buscar' | 'mensagens' | 'nova-conversa' | 'perfil';

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

function MensagensIcon({ color }: { color: string }) {
  // Adaptado do Lucide "message-circle", ISC.
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={color} strokeWidth={1.8}>
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </StrokeIcon>
  );
}

function NovaConversaIcon({ color }: { color: string }) {
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={color} strokeWidth={1.8}>
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <Line x1={12} y1={7} x2={12} y2={15} />
      <Line x1={8} y1={11} x2={16} y2={11} />
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
  Icon: (props: { color: string }) => ReactNode;
  rota?: Href;
  /** Abre por cima da tela atual (com voltar) em vez de trocar de aba. */
  empilhar?: boolean;
}[] = [
  { aba: 'inicio', label: 'Início', Icon: HomeIcon, rota: '/' },
  { aba: 'buscar', label: 'Buscar', Icon: BuscarIcon },
  { aba: 'mensagens', label: 'Mensagens', Icon: MensagensIcon, rota: '/forum' },
  { aba: 'nova-conversa', label: 'Nova conversa', Icon: NovaConversaIcon, rota: '/nova-conversa', empilhar: true },
  { aba: 'perfil', label: 'Perfil', Icon: PerfilIcon, rota: '/perfil' },
];

/** Barra flutuante no rodapé das telas principais. */
export default function BarraNavegacao({ ativa }: { ativa: Aba }) {
  const router = useRouter();

  return (
    <View style={styles.navBar}>
      {abas.map(({ aba, label, Icon, rota, empilhar }) => {
        const selecionada = aba === ativa;
        return (
          <Pressable
            key={aba}
            style={[styles.navItem, selecionada && styles.navItemActive]}
            onPress={
              rota && !selecionada
                ? () => (empilhar ? router.push(rota) : router.replace(rota))
                : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: selecionada }}
          >
            <Icon color={selecionada ? colors.white : colors.navIcon} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
