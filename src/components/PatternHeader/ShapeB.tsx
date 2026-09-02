import { View } from "react-native";


type ShapeProps = {
    rotation?: string;
    color?: string;
};

export default function ShapeB({ rotation = '0deg', color='#832D51' }: ShapeProps) {
    return (
        <View 
        style={{
                backgroundColor: color,
                width: 103.95,
                height: 38.25,
                borderTopRightRadius: 74,
                borderBottomLeftRadius: 74,
                transform: [{ rotate: rotation}]
            }}
        />        
    )
}