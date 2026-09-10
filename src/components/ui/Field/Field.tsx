import { View, Text, StyleSheet, StyleProp, TextStyle, TextInput } from "react-native";

import { colors } from "../../../themes/colors";
import { fonts } from "../../../themes/fonts";

export function Field({
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

const styles = StyleSheet.create({
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
});