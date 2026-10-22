import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/** Usa o binário instalado para acompanhar a numeração remota do EAS. */
export function obterVersaoApp() {
  const expoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  const aplicativoNativo = Platform.OS !== 'web' && !expoGo;
  const versao = (aplicativoNativo ? Application.nativeApplicationVersion : null)
    ?? Constants.expoConfig?.version;
  const build = aplicativoNativo ? Application.nativeBuildVersion : null;

  return {
    descricao: versao ? `Versão ${versao}${build ? ` · Build ${build}` : ''}` : 'Versão indisponível',
    ambiente: expoGo ? 'Ambiente de desenvolvimento' : null,
  };
}
