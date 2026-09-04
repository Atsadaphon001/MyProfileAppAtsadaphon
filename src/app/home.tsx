import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const COLORS = { primary: "#00a8b1", primaryDark: "#0E7490", background: "#F0FBFF", text: "#0F2A37", muted: "#5B7C89", border: "#DCF2F8" };

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="snow" size={27} color="#fff" /></View>
          <Text style={styles.kicker}>CHILLCUP DASHBOARD</Text>
          <Text style={styles.title}>สวัสดี 👋</Text>
          <Text style={styles.subtitle}>พร้อมดูแลสินค้าให้สดชื่นและเป็นระเบียบแล้วหรือยัง?</Text>
        </View>
        <Text style={styles.sectionTitle}>จัดการร้านค้า</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace("/")} activeOpacity={0.8}>
            <MaterialIcons name="inventory-2" size={27} color={COLORS.primary} />
            <Text style={styles.cardTitle}>สินค้าทั้งหมด</Text>
            <Text style={styles.cardText}>ดู แก้ไข และลบรายการสินค้า</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace("/categories")} activeOpacity={0.8}>
            <Ionicons name="folder-open-outline" size={29} color="#F59E0B" />
            <Text style={styles.cardTitle}>หมวดหมู่</Text>
            <Text style={styles.cardText}>เลือกดูสินค้าตามหมวดหมู่</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/add")} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.primaryActionText}>เพิ่มสินค้าใหม่</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="หน้าแรก" active onPress={() => router.replace("/home")} />
        <NavItem icon="add" label="เพิ่ม" onPress={() => router.push("/add")} />
        <NavItem icon="inventory" label="สินค้า" onPress={() => router.replace("/")} material />
        <NavItem icon="folder-outline" label="หมวดหมู่" onPress={() => router.replace("/categories")} />
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, material, onPress }: { icon: string; label: string; active?: boolean; material?: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>{material ? <MaterialIcons name={icon as never} size={22} color={active ? COLORS.primary : COLORS.muted} /> : <Ionicons name={icon as never} size={22} color={active ? COLORS.primary : COLORS.muted} />}<Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 20 },
  hero: { backgroundColor: "#DDF8FA", borderRadius: 22, padding: 24, minHeight: 210, justifyContent: "flex-end" },
  heroIcon: { position: "absolute", top: 22, right: 22, width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  kicker: { color: COLORS.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800", marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 290 },
  sectionTitle: { color: COLORS.text, fontSize: 19, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  grid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, minHeight: 145, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginTop: 16 },
  cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  primaryAction: { height: 52, marginTop: 18, borderRadius: 12, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryActionText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  bottomNav: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 8 },
  navItem: { flex: 1, alignItems: "center" },
  navText: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  navTextActive: { color: COLORS.primary, fontWeight: "800" },
});
