import { StyleSheet, Text, View } from "react-native";

interface PolarBearMarkProps {
  size?: "small" | "large";
  showLabel?: boolean;
}

export function PolarBearMark({ size = "small", showLabel = false }: PolarBearMarkProps) {
  const large = size === "large";

  return (
    <View
      pointerEvents="none"
      accessible
      accessibilityLabel="ChillCup polar bear theme"
      style={[styles.badge, large ? styles.badgeLarge : styles.badgeSmall]}
    >
      <Text style={[styles.bear, large ? styles.bearLarge : styles.bearSmall]}>🐻‍❄️</Text>
      {showLabel && <Text style={styles.label}>CHILLCUP ICE CLUB</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FEFF",
    borderWidth: 2,
    borderColor: "#6FD1DF",
    shadowColor: "#167E98",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  badgeSmall: {
    width: 42,
    height: 42,
    borderRadius: 15,
  },
  badgeLarge: {
    width: 74,
    height: 74,
    borderRadius: 25,
  },
  bear: {
    includeFontPadding: false,
  },
  bearSmall: {
    fontSize: 23,
  },
  bearLarge: {
    fontSize: 42,
  },
  label: {
    color: "#0E7490",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
});
