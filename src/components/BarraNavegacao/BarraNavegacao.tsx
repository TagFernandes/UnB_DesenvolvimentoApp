import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';

const colors = {
  white: '#FFFFFF',
  navPink: '#E86E97',
  navIcon: '#CCCCCC',
};

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

function HomeIcon() {
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
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={colors.navIcon} strokeWidth={1.8}>
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </StrokeIcon>
  );
}

function NovaConversaIcon() {
  return (
    <StrokeIcon width={26.8} height={26.66} viewBox="0 0 24 24" color={colors.navIcon} strokeWidth={1.8}>
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <Line x1={12} y1={7} x2={12} y2={15} />
      <Line x1={8} y1={11} x2={16} y2={11} />
    </StrokeIcon>
  );
}

function PerfilIcon() {
  return (
    <StrokeIcon width={26.8} height={26.67} viewBox="0 0 24 24" color={colors.navIcon} strokeWidth={1.8}>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={10} r={3} />
      <Path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </StrokeIcon>
  );
}

export default function BarraNavegacao() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.navBar}>
      <Pressable
        style={[styles.navItem, styles.navItemActive]}
        accessibilityRole="button"
        accessibilityLabel="Início"
        accessibilityState={{ selected: true }}
        onPress={() => router.navigate('/')}
      >
        <HomeIcon />
      </Pressable>

      <Pressable style={styles.navItem} accessibilityRole="button" accessibilityLabel="Buscar">
        <BuscarIcon />
      </Pressable>

      <Pressable
        style={styles.navItem}
        accessibilityRole="button"
        accessibilityLabel="Mensagens"
        onPress={() => router.navigate('/forum')}
      >
        <MensagensIcon />
      </Pressable>

      <Pressable
        style={styles.navItem}
        accessibilityRole="button"
        accessibilityLabel="Nova conversa"
        onPress={() => router.push('/nova-conversa')}
      >
        <NovaConversaIcon />
      </Pressable>

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

const styles = StyleSheet.create({
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