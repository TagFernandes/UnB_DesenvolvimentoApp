import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Header } from '../components/auth/AuthHeader';
import { Divider } from '../components/ui/Divider/Divider';
import { SocialButton } from '../components/ui/SocialButton/SocialButton';
import { AuthFooterLink } from '../components/auth/AuthFooterLink/AuthFooterLink';
import { Logo } from '../components/ui/Logo/Logo';
import { AppleIcon } from '../components/ui/icons/AppleIcon';
import { GoogleIcon } from '../components/ui/icons/GoogleIcon';
import { LoginForm, type LoginData } from '../components/auth/LoginForm/LoginForm';
import { colors } from '../themes/colors';
import { fonts } from '../themes/fonts';

export default function Login() {
  function handleLogin(dados: LoginData) {
    // TODO: chamada de API de Login
    console.log(dados);
  }

  function handleIrParaCadastro() {
    // TODO: navegar para a tela de login
    console.log('ir para cadastro');
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
            <Text style={styles.title}>Bem vindo(a) de volta!</Text>
          </View>

          <LoginForm onSubmit={handleLogin} />

          <Divider />

          <View style={styles.socialButtons}>
            <SocialButton icon={<AppleIcon />} label="Inscreva-se com Apple" />
            <SocialButton icon={<GoogleIcon />} label="Inscreva-se com Google" />
          </View>

          <AuthFooterLink text="Não tem conta? " linkText="Crie agora" onPress={handleIrParaCadastro} />

          <Logo />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { backgroundColor: colors.background, paddingBottom: 16 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
    alignSelf: 'stretch',
  },
  titleBox: { alignSelf: 'stretch', paddingVertical: 8 },
  title: {
    fontSize: 32,
    lineHeight: 38.4,
    fontFamily: fonts.bold,
    letterSpacing: -0.64,
    color: colors.text,
  },
  socialButtons: {
    alignItems: 'center',
    gap: 10,
  },
});