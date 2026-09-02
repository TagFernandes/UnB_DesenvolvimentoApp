import { SafeAreaProvider } from 'react-native-safe-area-view';
import LoginScreen from './src/screens/login';

export default function Login() {
  return (
    <SafeAreaProvider>
      <LoginScreen />
    </SafeAreaProvider>
  );
}
