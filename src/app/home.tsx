// หน้าแรกและแดชบอร์ด
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../constants/api";
import { getCartCount, getDemoOrders, getSession } from "../constants/store";

// [HOME DASHBOARD] หน้าแรกและสรุปข้อมูลร้านค้า
const COLORS = { primary: "#00a8b1", primaryDark: "#0E7490", background: "rgba(240, 251, 255, 0.9)", text: "#0F2A37", muted: "#5B7C89", border: "#DCF2F8" };
// [LOW STOCK DATA] สินค้าที่มีสต็อกต่ำสำหรับ Dashboard demo
const demoLowStockProducts = [
  { name: "Summit Lock Tumbler 1200ml", stock: 7 },
  { name: "Alpine Steel Cup 500ml", stock: 9 },
  { name: "AquaVault Flip Bottle 1000ml", stock: 6 },
  { name: "VoyageSeal Commuter 420ml", stock: 10 },
  { name: "RoamReady Handle Tumbler 600ml", stock: 8 },
];

export default function HomeScreen() {
  // [DASHBOARD STATE] จำนวนสินค้า ออเดอร์ สต็อก และรายได้
  const isAdmin = getSession()?.user.role === "admin";
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState<{ name: string; stock: number }[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    const orders = getDemoOrders();
    setOrderCount(orders.length);
    if (!isAdmin) return;
    setRevenue(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));
    setProductCount(21);
    setLowStockCount(demoLowStockProducts.length);
    setLowStockProducts(demoLowStockProducts);
    fetch(API_BASE_URL)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Products API unavailable")))
      .then((products) => {
        if (!Array.isArray(products)) return;
        setProductCount(products.length);
        const lowStock = products
          .filter((product) => Number(product.stock) <= 10)
          .map((product) => ({ name: product.product_name, stock: Number(product.stock) }))
          .sort((first, second) => first.stock - second.stock);
        setLowStockCount(lowStock.length);
        setLowStockProducts(lowStock);
      })
      .catch(() => undefined);
  }, [isAdmin]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="snow" size={27} color="#fff" /></View>
          <Text style={styles.kicker}>{isAdmin ? "CHILLCUP DASHBOARD" : "WELCOME TO CHILLCUP"}</Text>
          <Text style={styles.title}>{isAdmin ? "สวัสดี 👋" : "สวัสดี นักช้อป 👋"}</Text>
          <Text style={styles.subtitle}>{isAdmin ? "พร้อมดูแลสินค้าให้สดชื่นและเป็นระเบียบแล้วหรือยัง?" : "ค้นหาแก้วใบโปรดสำหรับทุกช่วงเวลาของคุณ"}</Text>
          <View style={styles.heroFooter}><View style={styles.liveDot} /><Text style={styles.liveText}>{isAdmin ? "ระบบร้านค้าพร้อมใช้งาน" : "สินค้าใหม่พร้อมให้เลือก"}</Text><Text style={styles.dateText}>{isAdmin ? "TODAY" : "SHOP NOW"}</Text></View>
        </View>
        {isAdmin ? <>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>OVERVIEW</Text><Text style={styles.sectionTitle}>ภาพรวมร้านค้า</Text></View><TouchableOpacity style={styles.refreshPill} onPress={() => router.replace("/")}><Ionicons name="arrow-forward" size={15} color={COLORS.primaryDark} /><Text style={styles.refreshText}>ดูร้านค้า</Text></TouchableOpacity></View>
        <View style={styles.statsGrid}>
          <StatCard icon="inventory-2" label="สินค้าทั้งหมด" value={productCount || "--"} color={COLORS.primary} />
          <StatCard icon="receipt-outline" label="คำสั่งซื้อ" value={orderCount} color="#F59E0B" />
          <StatCard icon="trending-down" label="สต็อกใกล้หมด" value={lowStockCount} color="#EF476F" />
          <StatCard icon="cash-outline" label="ยอดขายสะสม" value={`฿${revenue.toLocaleString()}`} color="#7C5CFC" />
        </View>
        <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>WORKSPACE</Text><Text style={styles.sectionTitle}>จัดการร้านค้า</Text></View></View>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace("/")} activeOpacity={0.8}><View style={[styles.actionIcon, { backgroundColor: "#DDF8FA" }]}><MaterialIcons name="inventory-2" size={25} color={COLORS.primary} /></View><Text style={styles.cardTitle}>สินค้าทั้งหมด</Text><Text style={styles.cardText}>ดู แก้ไข และลบรายการสินค้า</Text><Ionicons name="arrow-forward" size={18} color={COLORS.primary} style={styles.cardArrow} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.replace("/categories")} activeOpacity={0.8}><View style={[styles.actionIcon, { backgroundColor: "#FFF2D8" }]}><Ionicons name="folder-open-outline" size={25} color="#F59E0B" /></View><Text style={styles.cardTitle}>หมวดหมู่</Text><Text style={styles.cardText}>เลือกดูสินค้าตามหมวดหมู่</Text><Ionicons name="arrow-forward" size={18} color="#F59E0B" style={styles.cardArrow} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/price-analysis")} activeOpacity={0.8}><View style={[styles.actionIcon, { backgroundColor: "#EDE8FF" }]}><Ionicons name="analytics-outline" size={25} color="#7C5CFC" /></View><Text style={styles.cardTitle}>วิเคราะห์ราคา AI/ML</Text><Text style={styles.cardText}>ดูการจัดกลุ่มราคา Low / Mid / High</Text><Ionicons name="arrow-forward" size={18} color="#7C5CFC" style={styles.cardArrow} /></TouchableOpacity>
        </View>
        <View style={styles.quickRow}>
          {isAdmin && <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/add")} activeOpacity={0.8}><Ionicons name="add-circle-outline" size={22} color="#fff" /><Text style={styles.primaryActionText}>เพิ่มสินค้าใหม่</Text></TouchableOpacity>}
          <TouchableOpacity style={isAdmin ? styles.secondaryAction : styles.primaryAction} onPress={() => router.push("/admin-orders")} activeOpacity={0.8}><Ionicons name="receipt-outline" size={21} color={isAdmin ? COLORS.primaryDark : "#fff"} /><Text style={isAdmin ? styles.secondaryActionText : styles.primaryActionText}>ตรวจออเดอร์</Text></TouchableOpacity>
        </View>
        <View style={styles.alertPanel}><View style={styles.alertIcon}><Ionicons name="notifications-outline" size={21} color="#EF476F" /></View><View style={styles.alertCopy}><Text style={styles.alertTitle}>{lowStockCount > 0 ? `มีสินค้า ${lowStockCount} รายการใกล้หมด` : "สต็อกสินค้าพร้อมจำหน่าย"}</Text><Text style={styles.alertText}>{lowStockCount > 0 ? "รายการที่มีสต็อกไม่เกิน 10 ชิ้น" : "ตรวจสอบสินค้าและอัปเดตข้อมูลได้จากหน้าสินค้า"}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.muted} /></View>
        {lowStockProducts.length > 0 && <View style={styles.lowStockPanel}><View style={styles.lowStockHeader}><View><Text style={styles.sectionEyebrow}>STOCK ALERT</Text><Text style={styles.lowStockTitle}>สินค้าใกล้หมด</Text></View><TouchableOpacity onPress={() => router.replace("/")}><Text style={styles.viewAllText}>ดูทั้งหมด</Text></TouchableOpacity></View>{lowStockProducts.slice(0, 5).map((product) => <View style={styles.lowStockRow} key={product.name}><View style={styles.lowStockProductIcon}><Ionicons name="cube-outline" size={17} color="#EF476F" /></View><Text style={styles.lowStockName} numberOfLines={1}>{product.name}</Text><View style={styles.stockCount}><Text style={styles.stockCountText}>{product.stock}</Text><Text style={styles.stockUnit}>ชิ้น</Text></View></View>)}</View>}
        </> : <CustomerHomeContent />}
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="หน้าแรก" active onPress={() => router.replace("/home")} />
        {isAdmin && <NavItem icon="add" label="เพิ่ม" onPress={() => router.push("/add")} />}
        <NavItem icon="inventory" label="สินค้า" onPress={() => router.replace("/")} material />
        <NavItem icon="folder-outline" label="หมวดหมู่" onPress={() => router.replace("/categories")} />
      </View>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon as never} size={20} color={color} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function CustomerHomeContent() {
  const cartCount = getCartCount();
  const orderCount = getDemoOrders().length;

  return <>
    <View style={styles.customerGreeting}><View style={styles.customerGreetingIcon}><Ionicons name="sparkles-outline" size={24} color="#fff" /></View><View style={styles.customerGreetingCopy}><Text style={styles.sectionEyebrow}>YOUR CHILLCUP</Text><Text style={styles.customerGreetingTitle}>พร้อมเติมความสดชื่นหรือยัง?</Text><Text style={styles.customerGreetingText}>เลือกแก้วใบโปรด แล้วให้เราดูแลเครื่องดื่มของคุณ</Text></View></View>
    <View style={styles.customerStats}><View style={styles.customerStat}><Text style={styles.customerStatValue}>{cartCount}</Text><Text style={styles.customerStatLabel}>สินค้าในตะกร้า</Text></View><View style={styles.customerStat}><Text style={styles.customerStatValue}>{orderCount}</Text><Text style={styles.customerStatLabel}>คำสั่งซื้อของฉัน</Text></View></View>
    <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>QUICK ACCESS</Text><Text style={styles.sectionTitle}>จัดการการสั่งซื้อ</Text></View></View>
    <View style={styles.customerActionGrid}>
      <TouchableOpacity style={styles.customerAction} onPress={() => router.replace("/")}><View style={[styles.actionIcon, { backgroundColor: "#DDF8FA" }]}><Ionicons name="bag-handle-outline" size={25} color={COLORS.primary} /></View><Text style={styles.cardTitle}>เลือกซื้อสินค้า</Text><Text style={styles.cardText}>ค้นหาแก้วและอุปกรณ์ที่ชอบ</Text><Ionicons name="arrow-forward" size={18} color={COLORS.primary} style={styles.cardArrow} /></TouchableOpacity>
      <TouchableOpacity style={styles.customerAction} onPress={() => router.push("/cart")}><View style={[styles.actionIcon, { backgroundColor: "#FFF2D8" }]}><Ionicons name="cart-outline" size={25} color="#F59E0B" /></View><Text style={styles.cardTitle}>ตะกร้าสินค้า</Text><Text style={styles.cardText}>{cartCount > 0 ? `มีสินค้า ${cartCount} ชิ้นรอชำระเงิน` : "ยังไม่มีสินค้าในตะกร้า"}</Text><Ionicons name="arrow-forward" size={18} color="#F59E0B" style={styles.cardArrow} /></TouchableOpacity>
      <TouchableOpacity style={styles.customerAction} onPress={() => router.push("/track-order")}><View style={[styles.actionIcon, { backgroundColor: "#EDE8FF" }]}><Ionicons name="navigate-circle-outline" size={25} color="#7C5CFC" /></View><Text style={styles.cardTitle}>ติดตามคำสั่งซื้อ</Text><Text style={styles.cardText}>ตรวจสอบสถานะการจัดส่ง</Text><Ionicons name="arrow-forward" size={18} color="#7C5CFC" style={styles.cardArrow} /></TouchableOpacity>
      <TouchableOpacity style={styles.customerAction} onPress={() => router.push("/purchase-history")}><View style={[styles.actionIcon, { backgroundColor: "#FFE8EF" }]}><Ionicons name="time-outline" size={25} color="#EF476F" /></View><Text style={styles.cardTitle}>ประวัติการซื้อ</Text><Text style={styles.cardText}>ดูรายการสั่งซื้อที่ผ่านมา</Text><Ionicons name="arrow-forward" size={18} color="#EF476F" style={styles.cardArrow} /></TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.customerPrimaryAction} onPress={() => router.replace("/")}><Ionicons name="search-outline" size={21} color="#fff" /><Text style={styles.primaryActionText}>เริ่มเลือกซื้อสินค้า</Text></TouchableOpacity>
  </>;
}

function NavItem({ icon, label, active, material, onPress }: { icon: string; label: string; active?: boolean; material?: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.navItem} onPress={onPress} activeOpacity={0.7}>{material ? <MaterialIcons name={icon as never} size={22} color={active ? COLORS.primary : COLORS.muted} /> : <Ionicons name={icon as never} size={22} color={active ? COLORS.primary : COLORS.muted} />}<Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, // โปร่งแสงให้เห็นหมี PolarBearBackdrop
  content: { padding: 20, paddingBottom: 34 },
  hero: { backgroundColor: "rgba(221, 248, 250, 0.92)", borderRadius: 26, padding: 25, minHeight: 214, justifyContent: "flex-end", overflow: "hidden", borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", shadowColor: "#0E7490", shadowOpacity: 0.14, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  heroIcon: { position: "absolute", top: 22, right: 22, width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.8)" },
  kicker: { color: COLORS.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 30, fontWeight: "800", marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 6, maxWidth: 290 },
  heroFooter: { flexDirection: "row", alignItems: "center", marginTop: 22, gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  liveText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: "700" },
  dateText: { color: COLORS.muted, fontSize: 10, fontWeight: "800", marginLeft: 8, letterSpacing: 1 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 25, marginBottom: 12 },
  sectionEyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: "900", marginTop: 3 },
  refreshPill: { flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9, backgroundColor: "#E5F8FA" },
  refreshText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: "800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48.5%", backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, minHeight: 116 },
  statIcon: { width: 36, height: 36, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  statValue: { color: COLORS.text, fontSize: 21, fontWeight: "900", marginTop: 10 },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontWeight: "700" },
  grid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 16, minHeight: 158, borderWidth: 1, borderColor: COLORS.border, position: "relative" },
  actionIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginTop: 14 },
  cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  cardArrow: { position: "absolute", right: 15, bottom: 17 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryAction: { flex: 1, height: 52, borderRadius: 13, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryActionText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  secondaryAction: { flex: 1, height: 52, borderRadius: 13, backgroundColor: "#E5F8FA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryActionText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "800" },
  alertPanel: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#FFF8F1", borderWidth: 1, borderColor: "#FFE0C2", borderRadius: 16, padding: 14, marginTop: 16 },
  alertIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#FFE8D5", justifyContent: "center", alignItems: "center" },
  alertCopy: { flex: 1 },
  alertTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  alertText: { color: COLORS.muted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  customerGreeting: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 17, marginTop: 25 },
  customerGreetingIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  customerGreetingCopy: { flex: 1 },
  customerGreetingTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", marginTop: 4 },
  customerGreetingText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  customerStats: { flexDirection: "row", gap: 10, marginTop: 12 },
  customerStat: { flex: 1, backgroundColor: "#E5F8FA", borderRadius: 15, padding: 14, borderWidth: 1, borderColor: "#C6EEF1" },
  customerStatValue: { color: COLORS.primaryDark, fontSize: 24, fontWeight: "900" },
  customerStatLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3, fontWeight: "700" },
  customerActionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  customerAction: { width: "48.5%", backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, padding: 14, minHeight: 148, position: "relative" },
  customerPrimaryAction: { height: 52, borderRadius: 13, backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 15 },
  lowStockPanel: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#FFD8D5", padding: 15, marginTop: 14 },
  lowStockHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 },
  lowStockTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900", marginTop: 3 },
  viewAllText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: "800" },
  lowStockRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F2F6F8" },
  lowStockProductIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#FFF0EF", justifyContent: "center", alignItems: "center" },
  lowStockName: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: "700" },
  stockCount: { minWidth: 48, alignItems: "flex-end" },
  stockCountText: { color: "#EF476F", fontSize: 16, fontWeight: "900" },
  stockUnit: { color: COLORS.muted, fontSize: 10 },
  bottomNav: { flexDirection: "row", backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 8 },
  navItem: { flex: 1, alignItems: "center" },
  navText: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  navTextActive: { color: COLORS.primary, fontWeight: "800" },
});
