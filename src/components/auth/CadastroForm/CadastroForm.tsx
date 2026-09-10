import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Field } from '../../ui/Field/Field';
import { PrimaryButton } from '../../ui/PrimaryButton/PrimaryButton';
import { TermsCheckBox } from '../../ui/TermsCheckBox/TermsCheckBox';
import { fonts } from '../../../themes/fonts';

export type CadastroData = { nome: string; email: string; senha: string };

type CadastroFormProps = {
  onSubmit: (dados: CadastroData) => void;
};

export function CadastroForm({ onSubmit }: CadastroFormProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const podeEnviar = !!nome && !!email && !!senha && aceitouTermos;

  function handleSubmit() {
    if (!podeEnviar) return;
    onSubmit({ nome, email, senha });
  }

  return (
    <View style={styles.form}>
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
        inputStyle={{ fontFamily: fonts.poppins, lineHeight: 15 }}
        secureTextEntry
        autoCapitalize="none"
      />

      <TermsCheckBox checked={aceitouTermos} onToggle={() => setAceitouTermos((v) => !v)} />

      <PrimaryButton label="Inscreva-se" onPress={handleSubmit}/>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { alignSelf: 'stretch', gap: 16 },
});