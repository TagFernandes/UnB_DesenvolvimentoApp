import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';

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
  const router = useRouter();
  const { user, isLoading, isSigningUp } = useAuth();
  const handledNotificationIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!pronto || !user || isSigningUp) return;

    function handleNotificationNavigation(response: Notifications.NotificationResponse | null) {
      if (!response) return;

      const notificationId = response.notification.request.identifier;
      if (handledNotificationIdRef.current === notificationId) return;

      const data = response.notification.request.content.data as
        | {
            chatId?: string;
            senderId?: string;
            senderName?: string;
            conversationId?: string;
            regionId?: string;
          }
        | undefined;

      if (data?.chatId) {
        handledNotificationIdRef.current = notificationId;
        router.push({
          pathname: '/chat',
          params: {
            chatId: String(data.chatId),
            ...(data.senderId ? { recipientUid: String(data.senderId) } : {}),
            ...(data.senderName ? { title: String(data.senderName) } : {}),
          },
        });
      } else if (data?.conversationId) {
        handledNotificationIdRef.current = notificationId;
        router.push({
          pathname: '/conversa',
          params: {
            conversationId: String(data.conversationId),
            ...(data.regionId ? { regionId: String(data.regionId) } : {}),
          },
        });
      }
    }

    // Caso a app estivesse fechada e tenha sido aberta pelo toque na notificação
    Notifications.getLastNotificationResponseAsync()
      .then(handleNotificationNavigation)
      .catch(() => {});

    // Caso a app esteja em segundo plano e o utilizador toque na notificação
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationNavigation,
    );

    return () => {
      subscription.remove();
    };
  }, [pronto, user, isSigningUp, router]);

  if (!pronto) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Logado: telas do app */}
      <Stack.Protected guard={!!user && !isSigningUp}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="buscar" options={{ animation: 'none' }} />
        <Stack.Screen name="forum" options={{ animation: 'none' }} />
        <Stack.Screen name="perfil" options={{ animation: 'none' }} />
        <Stack.Screen name="sobre" />
        <Stack.Screen name="regiao" />
        <Stack.Screen name="chats" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="conversas" />
        <Stack.Screen name="conversa" />
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