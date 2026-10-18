import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from './tokens';

export default function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.linha}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.texto}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingTop: 7,
    paddingBottom: 8.39,
    paddingHorizontal: 16,
    borderRadius: 9999,
    backgroundColor: colors.pink,
  },
  texto: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.12,
    color: colors.tagText,
  },
});
