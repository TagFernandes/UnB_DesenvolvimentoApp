import { View } from "react-native";


type ShapeProps = {
    color?: string;
    flipHorizontal?:boolean
    flipVertical?:boolean
};
export function ShapeB({ color='#832D51', flipHorizontal = false, flipVertical = false  }: ShapeProps) {
    const transforms =[];
    if (flipHorizontal) transforms.push({ scaleX: -1 });
    if (flipVertical) transforms.push({ scaleY: -1 });

    return (
        <View 
        style={{
                backgroundColor: color,
                width: 110,
                height: 38.25,
                borderTopLeftRadius: 74,
                borderBottomRightRadius: 74,
                transform: transforms
            }}
        />        
    )
}