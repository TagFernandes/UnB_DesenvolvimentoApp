import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export default function SocialButton({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
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
  text: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.black,
  },
  pressed: {
    opacity: 0.8,
  },
});