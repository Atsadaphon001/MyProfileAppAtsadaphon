import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function PolarBearBackdrop() {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, { toValue: 1, duration: 7000, useNativeDriver: true }),
        Animated.timing(motion, { toValue: 0, duration: 7000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [motion]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      <View style={[styles.iceBlob, styles.iceBlobTop]} />
      <View style={[styles.iceBlob, styles.iceBlobBottom]} />
      <Animated.View style={[styles.floatingBear, {
        transform: [
          { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-8, 18] }) },
          { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) },
          { rotate: motion.interpolate({ inputRange: [0, 1], outputRange: ["-6deg", "6deg"] }) },
        ],
      }]}>
        <Text style={styles.bearText}>🐻‍❄️</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeOne, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [10, -18] }) }],
      }]}>
        <Text style={styles.snowText}>❄</Text>
      </Animated.View>
      <Animated.View style={[styles.snowflake, styles.snowflakeTwo, {
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-10, 20] }) }],
      }]}>
        <Text style={styles.snowTextSmall}>✦</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  iceBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.42,
  },
  iceBlobTop: {
    width: 260,
    height: 260,
    top: -150,
    right: -80,
    backgroundColor: "#BDEFF4",
  },
  iceBlobBottom: {
    width: 320,
    height: 320,
    bottom: -190,
    left: -150,
    backgroundColor: "#DCEBFF",
  },
  floatingBear: {
    position: "absolute",
    top: "23%",
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#B9EAF0",
  },
  bearText: {
    fontSize: 32,
  },
  snowflake: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  snowflakeOne: {
    top: "38%",
    left: 18,
  },
  snowflakeTwo: {
    bottom: "22%",
    right: "18%",
  },
  snowText: {
    color: "#72CADB",
    fontSize: 30,
    opacity: 0.35,
  },
  snowTextSmall: {
    color: "#9AB9EE",
    fontSize: 24,
    opacity: 0.35,
  },
});
