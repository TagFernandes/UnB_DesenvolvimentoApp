import { View, Text, StyleSheet } from "react-native"
import { fonts } from "../../../themes/fonts";
import { colors } from "../../../themes/colors";

export function Divider() {
    return (
        <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLabelBox}>
                <Text style={styles.dividerLabel}>Ou</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    /* Divisória com "Ou" */
    divider: {
        alignSelf: 'stretch',
        height: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dividerLine: {
        position: 'absolute',
        left: -16,
        right: -16,
        top: 8,
        height: 2,
        backgroundColor: colors.line,
    },
    dividerLabelBox: {
        paddingHorizontal: 3,
        backgroundColor: colors.background,
    },
    dividerLabel: {
        fontSize: 14,
        lineHeight: 17,
        fontFamily: fonts.medium,
        color: colors.black,
    },
});