import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mantém a splash na tela enquanto as fontes e a sessão carregam.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, isLoading, isSigningUp } = useAuth();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
  });

  const pronto = fontsLoaded && !isLoading;

  useEffect(() => {
    if (pronto) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [pronto]);

  if (!pronto) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Logado: telas do app */}
      <Stack.Protected guard={!!user && !isSigningUp}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="forum" options={{ animation: 'none' }} />
        <Stack.Screen name="perfil" options={{ animation: 'none' }} />
        <Stack.Screen name="conversas" />
        <Stack.Screen name="nova-conversa" />
      </Stack.Protected>

      {/* Login e cadastro ficam disponíveis enquanto não há uma sessão pronta. */}
      <Stack.Protected guard={!user || isSigningUp}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
    </Stack>
  );
}
