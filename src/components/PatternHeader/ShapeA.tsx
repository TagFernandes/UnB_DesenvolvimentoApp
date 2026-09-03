import { View } from "react-native";

type ShapeProps = {
    color?: string;
    flipHorizontal?:boolean
    flipVertical?:boolean
};

export function ShapeA({ color = '#E96E97', flipHorizontal = false, flipVertical = false }: ShapeProps) {
    const transforms =[];
    if (flipHorizontal) transforms.push({ scaleX: -1 });
    if (flipVertical) transforms.push({ scaleY: -1 });

    return (
        <View 
            style={{
                backgroundColor: color,
                width: 110,
                height: 38.25,
                borderTopRightRadius: 74,
                transform: transforms
            }}
        />
    )
}