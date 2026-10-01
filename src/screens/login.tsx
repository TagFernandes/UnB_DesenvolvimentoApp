import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Field from '../components/AuthScreens/Field';
import Header from '../components/AuthScreens/Header';
import Logo from '../components/AuthScreens/Logo';
import SocialButton from '../components/AuthScreens/SocialButton';
import AppleIcon from '../components/icons/AppleIcon';
import GoogleIcon from '../components/icons/GoogleIcon';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.content}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Comece agora com o mapeei!</Text>
          </View>

          <Field
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            editable={!carregando}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label="Senha"
            placeholder="Digite uma senha"
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
            inputStyle={styles.inputPoppins}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {erro ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {erro}
            </Text>
          ) : null}


          <View style={styles.primaryButtonBox}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || carregando) && styles.pressed,
              ]}
              onPress={handleLogin}
              disabled={carregando}
              accessibilityRole="button"
              accessibilityState={{ disabled: carregando, busy: carregando }}
            >
              {carregando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Inscreva-se</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLabelBox}>
              <Text style={styles.dividerLabel}>Ou</Text>
            </View>
          </View>

          <View style={styles.socialButtons}>
            <SocialButton icon={<AppleIcon />} label="Inscreva-se com Apple" />
            <SocialButton icon={<GoogleIcon />} label="Inscreva-se com Google" />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Não tem uma conta? </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.navigate('/cadastro')}
              disabled={carregando}
            >
              <Text style={styles.loginLink}>Crie agora</Text>
            </Pressable>
          </View>

          <Logo />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    backgroundColor: colors.background,
    paddingBottom: 16,
  },

  /* Conteúdo principal: padding 0 16 16, gap 16 */
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
    alignSelf: 'stretch',
  },

  titleBox: {
    alignSelf: 'stretch',
    paddingVertical: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 38.4,
    fontFamily: fonts.bold,
    letterSpacing: -0.64,
    color: colors.text,
  },

  inputPoppins: {
    fontFamily: fonts.poppins,
    lineHeight: 15,
  },

  /* Termos de uso */
  termsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9.5,
  },
  checkbox: {
    width: 14.57,
    height: 13.79,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.maroon,
    borderColor: colors.maroon,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: fonts.medium,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.black,
  },
  errorText: {
    alignSelf: 'stretch',
    color: '#B3261E',
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },

  /* Botão principal */
  primaryButtonBox: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  primaryButton: {
    width: 316,
    maxWidth: '100%',
    height: 48,
    borderRadius: 9999,
    backgroundColor: colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: fonts.medium,
    color: colors.background,
  },
  pressed: {
    opacity: 0.8,
  },

  /* Divisória com "Ou" */
  divider: {
    alignSelf: 'stretch',
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    position: 'absolute',
    left: -16,
    right: -16,
    top: 8,
    height: 2,
    backgroundColor: colors.line,
  },
  dividerLabelBox: {
    paddingHorizontal: 3,
    backgroundColor: colors.background,
  },
  dividerLabel: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.black,
  },

  /* Apple / Google */
  socialButtons: {
    alignItems: 'center',
    gap: 10,
  },
  /* Rodapé */
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.black,
  },
  loginLink: {
    fontSize: 14,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.pink,
  },
});