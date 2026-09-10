import { View, Text, StyleSheet } from "react-native";

import { colors } from "../../../themes/colors";
import { fonts } from "../../../themes/fonts";

export function Logo() {
  return (
    <View style={styles.logo}>
      <Text style={styles.logoLine}>
        <Text style={styles.logoMaroon}>ma</Text>
        <Text style={styles.logoOlive}>p</Text>
      </Text>
      <Text style={[styles.logoLine, styles.logoSecondLine]}>
        <Text style={styles.logoMaroon}>e</Text>
        <Text style={styles.logoOlive}>e</Text>
        <Text style={styles.logoMaroon}>i</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
    logo: {
    width: 96,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLine: {
    fontSize: 26,
    fontFamily: fonts.bold,
    letterSpacing: -1,
  },
  logoSecondLine: {
    marginTop: -6,
  },
  logoMaroon: {
    color: colors.maroon,
  },
  logoOlive: {
    color: colors.olive,
  },
});