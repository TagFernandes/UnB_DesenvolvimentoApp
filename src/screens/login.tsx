import ShapeA  from '../components/PatternHeader/ShapeA';
import ShapeB from '../components/PatternHeader/ShapeB';
import SafeAreaView from 'react-native-safe-area-view';
import { StyleSheet, Text, TextInput, Pressable } from 'react-native';

export default function LoginScreen() {
  return (
    <SafeAreaView style={styles.container}>
        <ShapeA />
        <ShapeA />
        <ShapeB />
        <ShapeB />
        <Text style={styles.title}>Bem-vindo(a)!</Text>

        <TextInput
            style={styles.input}
            placeholder='Email'
            keyboardType='email-address'
            autoCapitalize='none'
        />

        <TextInput
            style={styles.input}
            placeholder='Senha'
            secureTextEntry
        />

        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF8F8',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#1A1A2E'
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1d1d6',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16
  },
  button: {
    height: 48,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
});
