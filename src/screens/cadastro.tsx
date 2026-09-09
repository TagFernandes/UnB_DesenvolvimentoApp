import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  poppins: 'Poppins_400Regular',
};

const colors = {
  background: '#FAFBF8',
  maroon: '#832D51',
  pink: '#E96E97',
  olive: '#8B9A3F',
  text: '#1A1A1A',
  black: '#000000',
  border: '#D9D9D9',
  muted: '#D9D9D9',
  line: '#F5F5F5',
  white: '#FFFFFF',
};

/* ---------- Arte decorativa do topo ---------- */

/** Largura do frame do Figma: a arte é escalada proporcionalmente à tela. */
const DESIGN_WIDTH = 393;
const ART_WIDTH = 418;
const ART_HEIGHT = 153;

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  /** [superior-esq, superior-dir, inferior-dir, inferior-esq] */
  radius: [number, number, number, number];
  mirrored?: boolean;
};

/** Transcrição direta dos retângulos do Figma (Group 9 + Group 10). */
const artRects: Rect[] = [
  // Group 9
  { left: 103.95, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74] },
  { left: 0, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0] },
  { left: 0, top: 76.5, width: 104.78, height: 38.25, color: colors.pink, radius: [0, 0, 74, 0] },
  { left: 103.13, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0] },
  { left: 103.95, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74] },
  { left: 0, top: 77, width: 86, height: 38, color: colors.pink, radius: [0, 0, 74, 74], mirrored: true },
  { left: 106.43, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0], mirrored: true },
  { left: 104, top: 77, width: 106, height: 38, color: colors.pink, radius: [0, 0, 74, 0], mirrored: true },
  { left: 0.82, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0], mirrored: true },
  { left: 0, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74], mirrored: true },

  // Group 10
  { left: 311.34, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74] },
  { left: 207.38, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0] },
  { left: 207.38, top: 76.5, width: 104.78, height: 38.25, color: colors.pink, radius: [0, 0, 74, 0] },
  { left: 310.51, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0] },
  { left: 311.34, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74] },
  { left: 207.38, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74], mirrored: true },
  { left: 313.81, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0], mirrored: true },
  { left: 332, top: 77, width: 86, height: 38, color: colors.pink, radius: [0, 0, 74, 0], mirrored: true },
  { left: 208.21, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0], mirrored: true },
  { left: 207.38, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74], mirrored: true },
];

function Header() {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;

  return (
    <View style={[styles.header, { height: ART_HEIGHT * scale }]}>
      <View
        style={[
          styles.art,
          { transform: [{ scale }], transformOrigin: 'top left' },
        ]}
      >
        {artRects.map((rect, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              backgroundColor: rect.color,
              borderTopLeftRadius: rect.radius[0],
              borderTopRightRadius: rect.radius[1],
              borderBottomRightRadius: rect.radius[2],
              borderBottomLeftRadius: rect.radius[3],
              transform: rect.mirrored ? [{ scaleX: -1 }] : undefined,
            }}
          />
        ))}
      </View>
    </View>
  );
}

/* ---------- Ícones ---------- */

function AppleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 384 512">
      <Path
        fill={colors.black}
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </Svg>
  );
}

function GoogleIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

/* ---------- Blocos da tela ---------- */

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  inputStyle,
  ...inputProps
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  inputStyle?: StyleProp<TextStyle>;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <View style={styles.labelBox}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        {...inputProps}
      />
    </View>
  );
}

function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={styles.socialButtonText}>{label}</Text>
    </Pressable>
  );
}

function Logo() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoLine}>
        <Text style={styles.logoMaroon}>ma</Text>
        <Text style={styles.logoOlive}>p</Text>
      </Text>
      <Text style={[styles.logoLine, styles.logoSecondLine]}>
        <Text style={styles.logoMaroon}>e</Text>
        <Text style={styles.logoOlive}>e</Text>
        <Text style={styles.logoMaroon}>i</Text>
      </Text>
    </View>
  );
}

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

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
            label="Nome"
            placeholder="Digite seu nome"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Field
            label="E-mail"
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Field
            label="Senha"
            placeholder="Digite uma senha"
            value={senha}
            onChangeText={setSenha}
            inputStyle={styles.inputPoppins}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={styles.termsRow}
            onPress={() => setAceitouTermos((valor) => !valor)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: aceitouTermos }}
          >
            <View style={[styles.checkbox, aceitouTermos && styles.checkboxChecked]}>
              {aceitouTermos ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>Li e concordo com os termos de uso</Text>
          </Pressable>

          <View style={styles.primaryButtonBox}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Inscreva-se</Text>
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
            <Text style={styles.loginText}>Já possui uma conta? </Text>
            <Pressable accessibilityRole="link">
              <Text style={styles.loginLink}>Entre</Text>
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

  /* Topo decorativo */
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  art: {
    width: ART_WIDTH,
    height: ART_HEIGHT,
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

  /* Campos */
  field: {
    alignSelf: 'stretch',
  },
  labelBox: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  input: {
    alignSelf: 'stretch',
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontSize: 10,
    fontFamily: fonts.regular,
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
  socialButton: {
    width: 200,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
  },
  socialButtonText: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.black,
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
  logo: {
    width: 96,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLine: {
    fontSize: 26,
    fontFamily: fonts.bold,
    letterSpacing: -1,
  },
  logoSecondLine: {
    marginTop: -6,
  },
  logoMaroon: {
    color: colors.maroon,
  },
  logoOlive: {
    color: colors.olive,
  },
});
