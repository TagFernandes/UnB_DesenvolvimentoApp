import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import { firebaseConfig, firebaseConfigurado } from './firebaseConfig';

// Android/iOS: guarda a sessão no AsyncStorage para o usuário continuar
// logado depois de fechar o app. A versão web fica em firebase.web.ts.
function criarAuth(): Auth | null {
  if (!firebaseConfigurado) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Já inicializado (ex.: recarregamento rápido do Metro).
    return getAuth(app);
  }
}

export const auth = criarAuth();
