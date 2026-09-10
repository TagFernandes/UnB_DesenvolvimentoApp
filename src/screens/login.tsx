import PatterHeader from '../components/PatternHeader';
import { useAuth } from '../contexts/AuthContext';

import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (carregando) return;
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }

    setErro(null);
    setCarregando(true);
    try {
      // Ao entrar, o layout raiz troca para o Passeio sozinho.
      await signIn(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.patternHeaderBleed}>
          <PatterHeader />
        </View>

        <View style={ styles.titleContainer }>
          <Text style={styles.title}>Bem-vindo(a) de volta!</Text>
          <Text style={styles.subtitle}>Entre com suas credenciais para acessar sua conta.</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.emailLabel}>E-mail</Text>
          </View>

          <View style={styles.textFieldWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.iconWrapper}>
            <Text style={styles.emailLabel}>Senha</Text>
          </View>

          <View style={styles.textFieldWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#AAAAAA"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>

        {erro ? (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {erro}
          </Text>
        ) : null}

        <View style={styles.loginButtonFrame}>
          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              (pressed || carregando) && styles.loginButtonPressed,
            ]}
            onPress={handleLogin}
            disabled={carregando}
            accessibilityRole="button"
            accessibilityState={{ disabled: carregando, busy: carregando }}
          >
            {carregando ? (
              <ActivityIndicator color="#FAFBF8" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>
            Não tem uma conta?{' '}
              <Text style={styles.signupLink} onPress={() => {}}>Crie agora</Text>

          </Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
              source={require('../../assets/images/logo_mapeei.png')}
              style={styles.logo}
              resizeMode="contain"
            />
        </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  patternHeaderBleed: {
    marginHorizontal: -16,
  },
  container: {
    flex: 1,
    backgroundColor: '#FEF8F8',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 44.8,
    letterSpacing: -0.64,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22.96,
    letterSpacing: -0.28,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  titleContainer: {
    width: '100%', // era 387
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'column',
    alignItems: 'center',
    // height removido
  },
  input: {
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 10,
    letterSpacing: 0,
    color: '#1A1A1A', // era #D9D9D9, que deixava o texto digitado quase invisível
  },
  inputContainer: {
    width: '100%',
    // height removido — cresce sozinho com iconWrapper + textFieldWrapper
  },
  iconWrapper: {
    paddingVertical: 8,
    gap: 10,
  },
  textFieldWrapper: {
    width: '100%',
    minHeight: 32, // era height: 32
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    gap: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  emailLabel: {
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#1A1A1A',
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B3261E',
    textAlign: 'center',
  },
  loginButtonFrame: {
    width: '100%', // era 361 fixo
    paddingHorizontal: 27, // substitui o left: 27 do botão
  },
  loginButton: {
    width: '100%', // preenche o espaço restante do frame, após o padding
    minHeight: 48, // era height: 48 fixo
    borderRadius: 9999,
    backgroundColor: '#832D51',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  loginButtonText: {
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#FAFBF8',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center', // centraliza o logo horizontalmente
    marginTop: 'auto', // empurra pro final da tela (se o container pai for flex)
  },
  logo: {
    width: 96,
    height: 54,
    },
  signupContainer: {
    gap: 10,
    alignItems: 'center',
  },
  signupText: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  signupLink: {
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    letterSpacing: 0,
    color: '#E96E97',
  },
});
