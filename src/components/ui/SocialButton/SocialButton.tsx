import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../../../themes/colors";
import { fonts } from "../../../themes/fonts";

export function SocialButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <Pressable
            style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
            accessibilityRole="button"
        >
            {icon}
            <Text style={styles.socialButtonText}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    socialButton: {
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
    socialButtonText: {
        fontSize: 12,
        lineHeight: 15,
        fontFamily: fonts.medium,
        color: colors.black,
    },
    pressed: {
        opacity: 0.8,
    },
});