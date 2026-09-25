import React, { useState } from 'react';
import { View, Button, Image, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ImageManager() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite cortar a foto
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return;
    setUploading(true);

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `fotos/${Date.now()}.jpg`);

      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      Alert.alert('Sucesso!', 'Foto salva no Firebase!');
      console.log('URL da foto:', downloadUrl);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Button title="Galeria" onPress={pickImage} />
        <Button title="Câmera" onPress={takePhoto} />
      </View>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button
            title={uploading ? "Salvando..." : "Salvar no Firebase"}
            onPress={uploadImage}
            disabled={uploading}
            color="green"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    alignItems: 'center',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
});