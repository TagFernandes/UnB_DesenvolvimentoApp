import { View, Pressable, Text, StyleSheet } from "react-native"
import { colors } from "../../../themes/colors"
import { fonts } from "../../../themes/fonts"

type PrimaryButtonProps = {
    label: string;
    onPress: () => void;
}

export function PrimaryButton({ label, onPress }: PrimaryButtonProps) {
    return (
        <View style={styles.primaryButtonBox}>
            <Pressable
                style={({ pressed }) => [
                    styles.primaryButton, 
                    pressed && styles.pressed
                    ]}
                onPress={onPress}
                accessibilityRole="button"
            >
                <Text style={styles.primaryButtonText}>{label}</Text>
            </Pressable>
        </View>
)};

const styles = StyleSheet.create({
    /* Botão principal */
    primaryButtonBox: {
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    primaryButton: {
        width: 316,
        maxWidth: '100%',
        height: 48,
        borderRadius: 9999,
        backgroundColor: colors.maroon,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        lineHeight: 19,
        fontFamily: fonts.medium,
        color: colors.background,
    },
    pressed: {
        opacity: 0.8,
    },
});
