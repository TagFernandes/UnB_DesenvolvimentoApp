import { Pressable, View, Text, StyleSheet } from "react-native";
import { colors } from "../../../themes/colors";
import { fonts } from "../../../themes/fonts";

type TermsCheckBoxProps = {
    checked: boolean;
    onToggle: () => void;
    label?: string;

}

export function TermsCheckBox({ checked, onToggle, label='Li e concordo com os termos de uso' }: TermsCheckBoxProps) {
    return (
        <Pressable
            style={styles.termsRow}
            onPress={onToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
        >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>{label}</Text>
        </Pressable>
        
    );
};

const styles = StyleSheet.create({
    termsRow: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9.5,
    },
    checkbox: {
        width: 14.57,
        height: 13.79,
        borderWidth: 1,
        borderColor: colors.black,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.maroon,
        borderColor: colors.maroon,
    },
    checkboxMark: {
        color: colors.white,
        fontSize: 10,
        lineHeight: 12,
        fontFamily: fonts.medium,
    },
    termsText: {
        fontSize: 12,
        lineHeight: 15,
        fontFamily: fonts.medium,
        color: colors.black,
    },
});