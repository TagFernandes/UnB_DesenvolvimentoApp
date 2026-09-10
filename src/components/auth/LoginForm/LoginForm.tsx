import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Field } from '../../ui/Field/Field';
import { PrimaryButton } from '../../ui/PrimaryButton/PrimaryButton';
import { fonts } from '../../../themes/fonts';

export type LoginData = { email: string; senha: string };

type LoginFormProps = {
  onSubmit: (dados: LoginData) => void;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');


  const podeEnviar = !!email && !!senha;

  function handleSubmit() {
    if (!podeEnviar) return;
    onSubmit({ email, senha });
  }

  return (
    <View style={styles.form}>
    
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
        placeholder="Digite sua senha"
        value={senha}
        onChangeText={setSenha}
        inputStyle={{ fontFamily: fonts.poppins, lineHeight: 15 }}
        secureTextEntry
        autoCapitalize="none"
      />

      <PrimaryButton label="Login" onPress={handleSubmit}/>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: 'stretch', gap: 16 },
});