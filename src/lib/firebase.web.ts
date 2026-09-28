import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, firebaseConfigurado } from './firebaseConfig';

const app = firebaseConfigurado
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// Web: o Firebase já guarda a sessão no navegador (IndexedDB) por padrão.
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
