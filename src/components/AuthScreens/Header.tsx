// DecorativeHeader/index.tsx
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
// import { artRects, ART_WIDTH, ART_HEIGHT } from './artRects';

const DESIGN_WIDTH = 393;
const ART_WIDTH = 418;
const ART_HEIGHT = 153;

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  /** [superior-esq, superior-dir, inferior-dir, inferior-esq] */
  radius: [number, number, number, number];
  mirrored?: boolean;
};

const artRects: Rect[] = [
  // Group 9
  { left: 103.95, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74] },
  { left: 0, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0] },
  { left: 0, top: 76.5, width: 104.78, height: 38.25, color: colors.pink, radius: [0, 0, 74, 0] },
  { left: 103.13, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0] },
  { left: 103.95, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74] },
  { left: 0, top: 77, width: 86, height: 38, color: colors.pink, radius: [0, 0, 74, 74], mirrored: true },
  { left: 106.43, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0], mirrored: true },
  { left: 104, top: 77, width: 106, height: 38, color: colors.pink, radius: [0, 0, 74, 0], mirrored: true },
  { left: 0.82, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0], mirrored: true },
  { left: 0, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74], mirrored: true },

  // Group 10
  { left: 311.34, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74] },
  { left: 207.38, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0] },
  { left: 207.38, top: 76.5, width: 104.78, height: 38.25, color: colors.pink, radius: [0, 0, 74, 0] },
  { left: 310.51, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0] },
  { left: 311.34, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74] },
  { left: 207.38, top: 76.5, width: 106.43, height: 38.25, color: colors.pink, radius: [0, 0, 74, 74], mirrored: true },
  { left: 313.81, top: 0, width: 103.95, height: 38.25, color: colors.pink, radius: [0, 74, 0, 0], mirrored: true },
  { left: 332, top: 77, width: 86, height: 38, color: colors.pink, radius: [0, 0, 74, 0], mirrored: true },
  { left: 208.21, top: 114.75, width: 106.43, height: 38.25, color: colors.maroon, radius: [74, 0, 0, 0], mirrored: true },
  { left: 207.38, top: 38.25, width: 106.43, height: 38.25, color: colors.maroon, radius: [0, 74, 0, 74], mirrored: true },
];

export default function DecorativeHeader() {
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
}

const styles = StyleSheet.create({
  header: {
      width: '100%',
      overflow: 'hidden',
    },
    art: {
      width: ART_WIDTH,
      height: ART_HEIGHT,
    },
})
