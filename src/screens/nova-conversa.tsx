import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth, db } from '../lib/firebase';

const colors = {
  background: '#FDF4F6',
  surface: '#FFFFFF',
  border: '#EFD9E1',
  text: '#1C1C1E',
  secondary: '#77777B',
  accent: '#E8508A',
  error: '#B4233D',
  selected: '#FCE5ED',
} as const;

const categories = [
  { code: 'general', label: 'Geral' },
  { code: 'safety', label: 'Segurança' },
  { code: 'mobility', label: 'Mobilidade' },
  { code: 'cost_of_living', label: 'Custo de vida' },
  { code: 'leisure', label: 'Lazer' },
] as const;
type CategoryCode = (typeof categories)[number]['code'];

type Region = { id: string; name: string };

const regions: Region[] = [
  { id: 'asa-norte', name: 'Asa Norte' },
  { id: 'asa-sul', name: 'Asa Sul' },
  { id: 'taguatinga', name: 'Taguatinga' },
  { id: 'guara', name: 'Guará' },
  { id: 'nucleo-bandeirante', name: 'Núcleo Bandeirante' },
];

export default function NovaConversaScreen(): React.JSX.Element {
  const router = useRouter();
  const { regionId: initialRegionId } = useLocalSearchParams<{ regionId?: string }>();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CategoryCode>('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRegion(regions.find((region) => region.id === initialRegionId) ?? null);
  }, [initialRegionId]);

  async function createConversation(): Promise<void> {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (!selectedRegion || !cleanTitle || !cleanBody) {
      setError('Selecione uma região e preencha o título e o texto.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (!db) throw new Error('Firebase não está configurado.');
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('Entre na sua conta para publicar uma conversa.');

      const profile = await getDoc(doc(db, 'users', currentUser.uid));
      const profileName = profile.data()?.nome;
      const authorName = typeof profileName === 'string' && profileName.trim()
        ? profileName.trim()
        : '-';

      const regionRef = doc(db, 'regions', selectedRegion.id);
      const conversationRef = doc(collection(db, 'conversations'));

      await runTransaction(db, async (transaction) => {
        const regionSnapshot = await transaction.get(regionRef);
        const currentRegion = regionSnapshot.data();
        transaction.set(conversationRef, {
          region_id: selectedRegion.id,
          category,
          title: cleanTitle,
          body: cleanBody,
          author_name: authorName,
          author_uid: currentUser.uid,
          like_count: 0,
          reply_count: 0,
          created_at: serverTimestamp(),
        });

        const regionData = {
          name: selectedRegion.name,
          conversation_count: increment(1),
          last_activity_at: serverTimestamp(),
          last_conversation_title: cleanTitle,
          last_conversation_like_count: 0,
          last_conversation_reply_count: 0,
        };

        if (regionSnapshot.exists()) {
          transaction.update(regionRef, {
            ...regionData,
            ...(!currentRegion?.created_at ? { created_at: serverTimestamp() } : {}),
          });
        } else {
          transaction.set(regionRef, {
            ...regionData,
            created_at: serverTimestamp(),
          });
        }
      });
      router.replace({
        pathname: '/conversas',
        params: { regionId: selectedRegion.id, regionName: selectedRegion.name },
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível publicar a conversa.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">Nova conversa</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Região</Text>
        <View style={styles.regionList}>
          {regions.map((region) => {
            const selected = selectedRegion?.id === region.id;
            return (
              <Pressable
                key={region.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.regionOption, selected && styles.optionSelected]}
                onPress={() => setSelectedRegion(region)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {region.name}
                </Text>
                {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Sobre o que você quer conversar?"
          placeholderTextColor={colors.secondary}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          accessibilityLabel="Título da conversa"
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categories}>
          {categories.map((item) => {
            const selected = category === item.code;
            return (
              <Pressable
                key={item.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[styles.categoryOption, selected && styles.optionSelected]}
                onPress={() => setCategory(item.code)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Texto</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          placeholder="Escreva sua mensagem..."
          placeholderTextColor={colors.secondary}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Texto da conversa"
        />

        {error ? <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publicar conversa"
          accessibilityState={{ disabled: saving, busy: saving }}
          style={[styles.submitButton, saving && styles.submitDisabled]}
          onPress={createConversation}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.submitText}>Publicar conversa</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.text, fontSize: 18, fontWeight: '600' },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 20, paddingBottom: 40 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  hint: { color: colors.secondary, fontSize: 14, paddingVertical: 10 },
  regionLoading: { alignSelf: 'flex-start', paddingVertical: 12 },
  regionList: { gap: 8 },
  regionOption: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.selected },
  optionText: { color: colors.text, fontSize: 14 },
  optionTextSelected: { color: colors.accent, fontWeight: '600' },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
  },
  bodyInput: { minHeight: 160, paddingTop: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  error: { marginTop: 16, color: colors.error, fontSize: 14 },
  submitButton: {
    minHeight: 50,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: colors.surface, fontSize: 15, fontWeight: '600' },
});