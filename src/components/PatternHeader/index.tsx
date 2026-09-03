import { ShapeA } from "./ShapeA";
import { ShapeB } from "./ShapeB";
import { RowABAB } from "./RowABAB";

import { View} from "react-native";


export default function PatterHeader() {
    return (
        <View>
            <RowABAB Shape={ ShapeA } />
            <RowABAB Shape={ ShapeB }/>
            <RowABAB Shape={ ShapeA } flipVertical={ true }/>
            <RowABAB Shape={ ShapeA } color="#832D51"/>
        </View>
    )
}