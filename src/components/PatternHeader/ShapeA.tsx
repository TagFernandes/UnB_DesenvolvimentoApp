import { View } from "react-native";

type ShapeProps = {
    rotation?: string;
    color?: string;
};

export default function ShapeA({ rotation = '0deg', color = '#E96E97' }: ShapeProps) {
    return (
        <View 
            style={{
                backgroundColor: color,
                width: 103.95,
                height: 38.25,
                borderTopRightRadius: 74,
                transform: [{ rotate: rotation}]
            }}
        />
    )
}