import { StyleSheet } from "react-native";

export const celebrationStyles = StyleSheet.create({
  celebrationOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(7, 54, 73, 0.72)", justifyContent: "center", alignItems: "center", zIndex: 20 },
  celebrationCard: { width: "84%", maxWidth: 360, padding: 28, borderRadius: 28, backgroundColor: "#F4FEFF", alignItems: "center", overflow: "hidden", shadowColor: "#001F2A", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  firework: { position: "absolute", width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center", backgroundColor: "#CFFBFA" },
  fireworkOne: { top: 25, left: 27 },
  fireworkTwo: { top: 62, right: 25, backgroundColor: "#DFF2FF" },
  fireworkThree: { bottom: 82, right: 38, backgroundColor: "#FFF0C7" },
  fireworkText: { color: "#00A8B1", fontSize: 28, fontWeight: "900" },
  thanksCharacter: { width: 104, height: 104, borderRadius: 52, backgroundColor: "#00A8B1", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 6, borderColor: "#B9F6F4" },
  thanksTitle: { color: "#0E7490", fontSize: 24, fontWeight: "900" },
  thanksText: { color: "#5B7C89", fontSize: 13, textAlign: "center", marginTop: 7 },
  celebrationPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#DDF8F7", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginTop: 18 },
  celebrationPillText: { color: "#00A8B1", fontSize: 11, fontWeight: "800" },
});
