import { View, Pressable, Text, StyleSheet } from "react-native"
import { fonts } from "../../../themes/fonts"
import { colors } from "../../../themes/colors"

type AuthFooterLinkProps = {
    text: string;
    linkText: string,
    onPress: () => void
}

export function AuthFooterLink({ text, linkText, onPress }: AuthFooterLinkProps) {
    return (
        <View style={styles.loginRow}>
            <Text style={styles.loginText}>{text}</Text>
            <Pressable onPress={onPress} accessibilityRole="link">
                <Text style={styles.loginLink}>{linkText}</Text>
            </Pressable>
        </View>
    )
};

const styles = StyleSheet.create({
    /* Rodapé */
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        lineHeight: 17,
        fontFamily: fonts.medium,
        color: colors.black,
    },
    loginLink: {
        fontSize: 14,
        lineHeight: 17,
        fontFamily: fonts.medium,
        color: colors.pink,
    },

})