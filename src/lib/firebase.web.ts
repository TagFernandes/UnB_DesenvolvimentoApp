import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import { firebaseConfig, firebaseConfigurado } from './firebaseConfig';

// Web: o Firebase já guarda a sessão no navegador (IndexedDB) por padrão.
export const auth: Auth | null = firebaseConfigurado
  ? getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
