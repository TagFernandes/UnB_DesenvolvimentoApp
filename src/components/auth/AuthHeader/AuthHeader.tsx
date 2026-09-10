import { View, useWindowDimensions, StyleSheet } from "react-native";

import { artRects, DESIGN_WIDTH, ART_HEIGHT, ART_WIDTH } from "./artRects";


export function Header() {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;

  return (
    <View style={[styles.header, { height: ART_HEIGHT * scale }]}>
      <View
        style={[
          styles.art,
          { transform: [{ scale }], transformOrigin: 'top left' },
        ]}
      >
        {artRects.map((rect, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              backgroundColor: rect.color,
              borderTopLeftRadius: rect.radius[0],
              borderTopRightRadius: rect.radius[1],
              borderBottomRightRadius: rect.radius[2],
              borderBottomLeftRadius: rect.radius[3],
              transform: rect.mirrored ? [{ scaleX: -1 }] : undefined,
            }}
          />
        ))}
      </View>
    </View>
  );
};

/* Topo decorativo */
const styles = StyleSheet.create({
    header: {
        width: '100%',
        overflow: 'hidden',
    },
    art: {
        width: ART_WIDTH,
        height: ART_HEIGHT,
    }
});