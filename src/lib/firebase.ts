import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, firebaseConfigurado } from './firebaseConfig';

// Android/iOS: guarda a sessão no AsyncStorage para o usuário continuar
// logado depois de fechar o app. A versão web fica em firebase.web.ts.
const app = firebaseConfigurado
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

function criarAuth(): Auth | null {
  if (!app) return null;

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
export const db: Firestore | null = app ? getFirestore(app) : null;

// Para testar contra os emuladores locais do Firebase (auth na 9099, Firestore na
// 8080), inicie o Metro com EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1.
const emulador = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
if (emulador && auth && db) {
  try {
    connectAuthEmulator(auth, `http://${emulador}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulador, 8080);
  } catch {
    // Já conectado (ex.: recarregamento rápido do Metro).
  }
}
