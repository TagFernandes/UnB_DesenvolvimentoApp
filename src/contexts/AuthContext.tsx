import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { auth, db } from '../lib/firebase';

type AuthContextValue = {
  /** Usuário logado, ou null se ninguém entrou. */
  user: User | null;
  /** true enquanto o Firebase ainda verifica se há uma sessão salva. */
  isLoading: boolean;
  /** Impede a navegação antes de o perfil ser salvo no Firestore. */
  isSigningUp: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signUp: (nome: string, email: string, senha: string) => Promise<void>;
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
  const [isSigningUp, setIsSigningUp] = useState(false);

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

  async function signUp(nome: string, email: string, senha: string) {
    if (!auth || !db) {
      throw new Error(
        'Firebase não configurado. Preencha o .env.local e reinicie o servidor.',
      );
    }

    setIsSigningUp(true);
    let usuarioCriado: User | null = null;

    try {
      const credencial = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha,
      );
      usuarioCriado = credencial.user;

      await setDoc(doc(db, 'users', usuarioCriado.uid), {
        uid: usuarioCriado.uid,
        nome: nome.trim().replace(/\s+/g, ' '),
        email: usuarioCriado.email ?? email.trim(),
        aceitouTermos: true,
        termosAceitosEm: serverTimestamp(),
        criadoEm: serverTimestamp(),
      });
    } catch (erro) {
      // Authentication e Firestore não compartilham uma transação. Se o perfil
      // falhar, removemos a conta para não deixar um cadastro incompleto.
      if (usuarioCriado) {
        try {
          await deleteUser(usuarioCriado);
        } catch {
          await firebaseSignOut(auth).catch(() => {});
        }
      }
      throw new Error(mensagemDeErroCadastro(erro));
    } finally {
      setIsSigningUp(false);
    }
  }

  async function signOut() {
    if (auth) await firebaseSignOut(auth);
  }

  return (
    <AuthContext value={{ user, isLoading, isSigningUp, signIn, signUp, signOut }}>
      {children}
    </AuthContext>
  );
}

function mensagemDeErroCadastro(erro: unknown) {
  if (erro instanceof FirebaseError) {
    switch (erro.code) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado.';
      case 'auth/invalid-email':
        return 'E-mail inválido.';
      case 'auth/weak-password':
      case 'auth/password-does-not-meet-requirements':
        return 'A senha não atende aos requisitos de segurança.';
      case 'auth/operation-not-allowed':
        return 'Cadastro por e-mail e senha não está ativado no Firebase.';
      case 'auth/network-request-failed':
      case 'unavailable':
        return 'Sem conexão. Verifique sua internet.';
      case 'permission-denied':
        return 'Não foi possível salvar seu perfil. Verifique as permissões do Firestore.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente de novo.';
      case 'auth/configuration-not-found':
        return 'Authentication não está ativado neste projeto do Firebase.';
      case 'auth/invalid-api-key':
      case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
        return 'Configuração do Firebase inválida. Confira o .env.local.';
    }
  }
  return 'Não foi possível criar sua conta. Tente novamente.';
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
