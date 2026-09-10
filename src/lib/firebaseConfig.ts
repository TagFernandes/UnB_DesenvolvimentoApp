// Valores vêm do .env.local (variáveis EXPO_PUBLIC_ são embutidas no app pelo Expo).
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** false enquanto o .env.local não estiver preenchido. */
export const firebaseConfigurado = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

if (!firebaseConfigurado) {
  console.warn(
    '[firebase] Configuração ausente: preencha o .env.local e reinicie com `npx expo start --clear`.',
  );
}
