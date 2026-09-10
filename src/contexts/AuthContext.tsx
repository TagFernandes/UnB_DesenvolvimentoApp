import { FirebaseError } from 'firebase/app';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { auth } from '../lib/firebase';

type AuthContextValue = {
  /** Usuário logado, ou null se ninguém entrou. */
  user: User | null;
  /** true enquanto o Firebase ainda verifica se há uma sessão salva. */
  isLoading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.');
  }
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(auth !== null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (usuario) => {
      setUser(usuario);
      setIsLoading(false);
    });
  }, []);

  async function signIn(email: string, senha: string) {
    if (!auth) {
      throw new Error(
        'Firebase não configurado. Preencha o .env.local e reinicie o servidor.',
      );
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (erro) {
      throw new Error(mensagemDeErro(erro));
    }
  }

  async function signOut() {
    if (auth) await firebaseSignOut(auth);
  }

  return <AuthContext value={{ user, isLoading, signIn, signOut }}>{children}</AuthContext>;
}

/** Traduz os códigos de erro do Firebase Auth para mensagens em português. */
function mensagemDeErro(erro: unknown) {
  if (erro instanceof FirebaseError) {
    switch (erro.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/missing-password':
        return 'Digite sua senha.';
      case 'auth/user-disabled':
        return 'Esta conta foi desativada.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
      case 'auth/network-request-failed':
        return 'Sem conexão. Verifique sua internet.';
      case 'auth/operation-not-allowed':
        return 'Login por e-mail/senha não está ativado no Firebase.';
      case 'auth/configuration-not-found':
        return 'Authentication não está ativado neste projeto do Firebase.';
      case 'auth/invalid-api-key':
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        return 'Configuração do Firebase inválida. Confira o .env.local.';
    }
  }
  return 'Não foi possível entrar. Tente novamente.';
}
