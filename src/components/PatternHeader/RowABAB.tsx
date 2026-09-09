import { View, StyleSheet } from "react-native";

type RowABABProps = {
    Shape: React.ComponentType<{
        color?: string;
        flipHorizontal?: boolean;
        flipVertical?: boolean;
    }>;
    flipVertical?: boolean;
    color?: string;
};

export function RowABAB({ Shape, color, flipVertical = false }: RowABABProps) {
    return (
        <View style={styles.clipContainer}>
            <View style={styles.row}>
                <Shape color={color} flipVertical={flipVertical} />
                <Shape color={color} flipHorizontal={true} flipVertical={flipVertical}/>
                <Shape color={color} flipVertical={flipVertical}/>
                <Shape color={color} flipHorizontal={true} flipVertical={flipVertical}/>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
    },
    clipContainer: {
        width: "100%",
        overflow: "hidden",
        alignItems: "center",
    },
});