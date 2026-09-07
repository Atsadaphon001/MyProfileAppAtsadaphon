import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

// [POLAR BACKDROP] พื้นหลังธีมขั้วโลก น้ำแข็งมีมิติ ใช้รูปหมีซ้าย/ขวาจาก assets
interface PolarBearBackdropProps {
  decorationsOnly?: boolean;
  showBears?: boolean;
}

export function PolarBearBackdrop({ decorationsOnly = false, showBears = true }: PolarBearBackdropProps) {
  const { width } = useWindowDimensions();
  const motion = useRef(new Animated.Value(0)).current;
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
        <Animated.View style={[styles.bearWrap, styles.bearLeft, decorationsOnly && styles.bearEdgeLeft, { width: desktopBearWidth, height: desktopBearHeight }, {
          transform: [
            { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] }) },
            { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
            { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) },
          ],
        }]}>
          <Image source={bearLeft} style={styles.bearImage} resizeMode="contain" />
          <View style={[styles.bearShadow, styles.bearShadowLeft]} />
        </Animated.View>
        <Animated.View style={[styles.bearWrap, styles.bearRight, decorationsOnly && styles.bearEdgeRight, { width: desktopBearWidth, height: desktopBearHeight }, {
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

      {/* เกล็ดหิมะ */}
      <Animated.View style={[styles.snowflake, styles.snowflakeOne, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [12, -22] }) }],
      }]}>
        <Text style={styles.snowText}>❄</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeTwo, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-12, 24] }) }],
      }]}>
        <Text style={styles.snowTextSmall}>✦</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeThree, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [6, -14] }) }],
      }]}>
        <Text style={styles.snowTextTiny}>❆</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeFour, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }],
      }]}>
        <Text style={styles.snowTextSmall}>❄</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeFive, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [14, -18] }) }],
      }]}>
        <Text style={styles.snowTextTiny}>✦</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeSix, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-8, 20] }) }],
      }]}>
        <Text style={styles.snowText}>❆</Text>
      </Animated.View>
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
  snowflakeOne: { top: "34%", left: 20 },
  snowflakeTwo: { bottom: "20%", right: "20%" },
  snowflakeThree: { top: "16%", right: "8%" },
  snowflakeFour: { top: "54%", left: "14%" },
  snowflakeFive: { top: "72%", right: "10%" },
  snowflakeSix: { top: "62%", left: "46%" },
  snowText: { color: "#6DCBDB", fontSize: 34, opacity: 0.42, textShadowColor: "#FFFFFF", textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
  snowTextSmall: { color: "#93B7E8", fontSize: 27, opacity: 0.38, textShadowColor: "#FFFFFF", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  snowTextTiny: { color: "#7FD4E4", fontSize: 22, opacity: 0.3, textShadowColor: "#FFFFFF", textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
});
