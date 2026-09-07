import { Image, StyleSheet, Text, View } from "react-native";

interface PolarBearMarkProps {
  size?: "small" | "large";
  showLabel?: boolean;
}

// [CHILLCUP LOGO] ใช้รูป chillcup-logo.png แทนไอคอนหมีเดิม
export function PolarBearMark({ size = "small", showLabel = false }: PolarBearMarkProps) {
  const large = size === "large";
  const logo = require("@/assets/images/chillcup-logo.png");

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel="ChillCup polar bear theme"
      style={[styles.badge, large ? styles.badgeLarge : styles.badgeSmall]}
    >
      <Image
        source={logo}
        style={[styles.logoImage, large ? styles.logoImageLarge : styles.logoImageSmall]}
        resizeMode="contain"
      />
      {showLabel && <Text style={styles.label}>CHILLCUP ICE CLUB</Text>}
    </View>
  );
}

// [LOGO STYLES] ธีมขั้วโลก น้ำแข็งมีมิติ
const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FEFF",
    borderWidth: 2,
    borderColor: "#6FD1DF",
    // เงา 3D เหมือนก้อนน้ำแข็ง
    shadowColor: "#167E98",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  badgeSmall: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
  badgeLarge: {
    width: 76,
    height: 76,
    borderRadius: 25,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoImageSmall: {
    width: 34,
    height: 34,
  },
  logoImageLarge: {
    width: 56,
    height: 56,
  },
  label: {
    color: "#0E7490",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});