import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

// [POLAR BACKDROP] พื้นหลังธีมขั้วโลก น้ำแข็งมีมิติ ใช้รูปหมีซ้าย/ขวาจาก assets
interface PolarBearBackdropProps {
  decorationsOnly?: boolean;
  showBears?: boolean;
}

// กระจายตำแหน่งเริ่มต้นให้หิมะเต็มหน้าจอ โดยไม่ต้องใช้รูปภาพเพิ่ม
const SNOWFLAKES = [
  { left: "3%", top: -55, size: 17, opacity: 0.44, drift: 24, glyph: "❄" }, { left: "9%", top: 210, size: 25, opacity: 0.35, drift: -34, glyph: "❆" },
  { left: "15%", top: 65, size: 14, opacity: 0.5, drift: 19, glyph: "✦" }, { left: "21%", top: 390, size: 31, opacity: 0.3, drift: -26, glyph: "❄" },
  { left: "27%", top: 140, size: 19, opacity: 0.4, drift: 31, glyph: "❆" }, { left: "33%", top: 520, size: 13, opacity: 0.52, drift: -17, glyph: "✦" },
  { left: "39%", top: 18, size: 29, opacity: 0.28, drift: 29, glyph: "❄" }, { left: "44%", top: 315, size: 16, opacity: 0.48, drift: -22, glyph: "❆" },
  { left: "50%", top: 110, size: 21, opacity: 0.38, drift: 35, glyph: "❄" }, { left: "55%", top: 470, size: 14, opacity: 0.54, drift: -25, glyph: "✦" },
  { left: "61%", top: 230, size: 27, opacity: 0.32, drift: 18, glyph: "❆" }, { left: "66%", top: 40, size: 16, opacity: 0.48, drift: -32, glyph: "❄" },
  { left: "71%", top: 420, size: 22, opacity: 0.36, drift: 23, glyph: "❆" }, { left: "76%", top: 160, size: 12, opacity: 0.56, drift: -15, glyph: "✦" },
  { left: "81%", top: 580, size: 30, opacity: 0.29, drift: 28, glyph: "❄" }, { left: "86%", top: 280, size: 18, opacity: 0.43, drift: -30, glyph: "❆" },
  { left: "91%", top: 85, size: 24, opacity: 0.34, drift: 16, glyph: "❄" }, { left: "96%", top: 455, size: 14, opacity: 0.5, drift: -18, glyph: "✦" },
  { left: "6%", top: 690, size: 22, opacity: 0.34, drift: 27, glyph: "❄" }, { left: "48%", top: 660, size: 17, opacity: 0.45, drift: -20, glyph: "❆" },
  { left: "73%", top: 720, size: 13, opacity: 0.54, drift: 20, glyph: "✦" }, { left: "31%", top: 760, size: 28, opacity: 0.28, drift: -29, glyph: "❄" },
] as const;

export function PolarBearBackdrop({ decorationsOnly = false, showBears = true }: PolarBearBackdropProps) {
  const { width, height } = useWindowDimensions();
  const motion = useRef(new Animated.Value(0)).current;
  const snowfall = useRef(new Animated.Value(0)).current;
  const desktopBearWidth = Math.min(Math.max(width * 0.25, 250), 410);
  const desktopBearHeight = desktopBearWidth * 1.2;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [motion]);

  useEffect(() => {
    const animation = Animated.loop(Animated.timing(snowfall, { toValue: 1, duration: 11500, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [snowfall]);

  // รูปหมีจาก assets
  const bearLeft = require("@/assets/images/chillcup-bear-left.png");
  const bearRight = require("@/assets/images/chillcup-bear-right.png");

  return (
    <View pointerEvents="none" style={[styles.layer, decorationsOnly && styles.decorationLayer]}>
      {!decorationsOnly && <>
        {/* พื้นหลังน้ำแข็งแบบมีมิติ (3 ชั้น) */}
        <View style={styles.iceWash} />
        <View style={[styles.iceBlob, styles.iceBlobTop]} />
        <View style={[styles.iceBlob, styles.iceBlobBottom]} />
        <View style={[styles.iceBlob, styles.iceBlobMid]} />

      </>}

      {/* หมีซ้าย/ขวา เฉพาะจอใหญ่ (เหมือนเดิม) */}
      {showBears && width >= 900 && <>
        <Animated.View style={[styles.bearWrap, styles.bearLeft, decorationsOnly && styles.bearEdgeLeft, { width: desktopBearWidth, height: desktopBearHeight }, decorationsOnly && { left: -desktopBearWidth + 108, top: "56%", opacity: 0.3 }, {
          transform: [
            { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] }) },
            { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
            { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) },
          ],
        }]}>
          <Image source={bearLeft} style={styles.bearImage} resizeMode="contain" />
          <View style={[styles.bearShadow, styles.bearShadowLeft]} />
        </Animated.View>
        <Animated.View style={[styles.bearWrap, styles.bearRight, decorationsOnly && styles.bearEdgeRight, { width: desktopBearWidth, height: desktopBearHeight }, decorationsOnly && { right: -desktopBearWidth + 108, top: "56%", opacity: 0.3 }, {
          transform: [
            { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [10, -14] }) },
            { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [10, -6] }) },
            { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ["4deg", "-4deg"] }) },
          ],
        }]}>
          <Image source={bearRight} style={styles.bearImage} resizeMode="contain" />
          <View style={[styles.bearShadow, styles.bearShadowRight]} />
        </Animated.View>
      </>}

      {/* หมีซ้าย/ขวา สำหรับจอเล็ก (แบบเล็กลง มุมล่าง) */}
      {showBears && width < 900 && <>
        <Animated.View style={[styles.bearWrapSmall, styles.bearSmallLeft, {
          transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [4, 10] }) }],
        }]}>
          <Image source={bearLeft} style={styles.bearImageSmall} resizeMode="contain" />
        </Animated.View>
        <Animated.View style={[styles.bearWrapSmall, styles.bearSmallRight, {
          transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [4, 10] }) }],
        }]}>
          <Image source={bearRight} style={styles.bearImageSmall} resizeMode="contain" />
        </Animated.View>
      </>}

      {/* เกล็ดหิมะหลายขนาด ลอยลงและแกว่งคนละทิศทาง */}
      {SNOWFLAKES.map((flake, index) => <Animated.View key={`${flake.left}-${index}`} style={[styles.snowflake, { left: flake.left, top: flake.top, opacity: snowfall.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, flake.opacity, flake.opacity, 0] }), transform: [{ translateY: snowfall.interpolate({ inputRange: [0, 1], outputRange: [-90, height + 110] }) }, { translateX: snowfall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, flake.drift, 0] }) }, { rotate: snowfall.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${index % 2 ? -160 : 160}deg`] }) }] }]}><Text style={[styles.snowText, { fontSize: flake.size }]}>{flake.glyph}</Text></Animated.View>)}
    </View>
  );
}

// [POLAR STYLES] ธีมขั้วโลก น้ำแข็งมีมิติ (Depth/Gloss/Shadow)
const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: "#DFF4FB",
  },
  decorationLayer: {
    backgroundColor: "transparent",
  },
  // พื้นหลังไล่เฉดน้ำแข็ง (ดูมีมิติ)
  iceWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#E9F8FD",
    opacity: 0.85,
  },
  iceBlob: {
    position: "absolute",
    borderRadius: 999,
    // ขอบแสงน้ำแข็ง (3D gloss)
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0E7490",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  iceBlobTop: {
    width: 300,
    height: 300,
    top: -170,
    right: -90,
    backgroundColor: "#B9EFF4",
  },
  iceBlobBottom: {
    width: 360,
    height: 360,
    bottom: -210,
    left: -170,
    backgroundColor: "#D7E9FF",
  },
  iceBlobMid: {
    width: 200,
    height: 200,
    top: "35%",
    left: "12%",
    backgroundColor: "#CFF4FB",
    opacity: 0.5,
  },
  // หมีใหญ่ (จอ ≥ 900)
  bearWrap: {
    position: "absolute",
    top: "24%",
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    // เงาของหมี (shadow 3D)
    shadowColor: "#0B5B6D",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  // หมีอยู่ริมจอและอยู่หลังเนื้อหาเสมอ: เด่นพอดีจอ แต่ไม่ตัดผ่านพื้นที่อ่าน
  bearLeft: { left: -48 },
  bearRight: { right: -48 },
  // บนเลเยอร์หน้าสุด เผยให้เห็นเฉพาะขอบหมีที่ริมจอ จึงไม่ตัดผ่านคอลัมน์เนื้อหา
  bearEdgeLeft: { left: -255, top: "48%" },
  bearEdgeRight: { right: -255, top: "48%" },
  bearImage: { width: "100%", height: "100%" },
  // เงาบนพื้นน้ำแข็งใต้หมี
  bearShadow: {
    position: "absolute",
    bottom: 8,
    width: 130,
    height: 26,
    borderRadius: 20,
    backgroundColor: "rgba(14, 116, 144, 0.18)",
    shadowColor: "#0B5B6D",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  bearShadowLeft: { left: 42, transform: [{ rotate: "4deg" }] },
  bearShadowRight: { left: 42, transform: [{ rotate: "-4deg" }] },
  // หมีเล็ก (จอ < 900) วางมุมล่างซ้าย/ขวา
  bearWrapSmall: {
    position: "absolute",
    bottom: 6,
    zIndex: 2,
    width: 148,
    height: 132,
    opacity: 0.22,
  },
  bearSmallLeft: { left: -54 },
  bearSmallRight: { right: -54 },
  bearImageSmall: { width: "100%", height: "100%" },
  // เกล็ดหิมะ
  snowflake: { position: "absolute", alignItems: "center", justifyContent: "center" },
  snowText: { color: "#3FC4D7", textShadowColor: "#FFFFFF", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
});
