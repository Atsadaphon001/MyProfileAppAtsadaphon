// หน้าประวัติการสั่งซื้อ
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { DemoOrder, getDemoOrders, OrderStatus } from "../constants/store";

// [PURCHASE HISTORY] ประวัติคำสั่งซื้อของผู้ใช้
const COLORS = {
  bg: "rgba(244, 251, 253, 0.88)",
  white: "#FFFFFF",
  primary: "#00A8B1",
  deep: "#0E7490",
  ink: "#0F2A37",
  muted: "#63818D",
  line: "#CBEAF0",
  ice: "#E8FAFC",
};

// [ORDER STATUS] ชื่อสถานะคำสั่งซื้อแต่ละขั้นตอน
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "รับออเดอร์แล้ว",
  processing: "กำลังเตรียมสินค้า",
  shipped: "กำลังจัดส่ง",
  delivered: "จัดส่งสำเร็จ",
};

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  pending: "receipt-outline",
  processing: "cube-outline",
  shipped: "bicycle-outline",
  delivered: "checkmark-circle-outline",
};

export default function PurchaseHistoryScreen() {
  const [orders, setOrders] = useState<DemoOrder[]>(() => [...getDemoOrders()]);
  const refresh = useCallback(() => setOrders([...getDemoOrders()]), []);
  useEffect(() => {
    const timer = setInterval(refresh, 1_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")} hitSlop={12}>
          <Ionicons name="arrow-back" size={23} color={COLORS.ink} />
        </Pressable>
        <View style={styles.headerTitleWrap}><Text style={styles.eyebrow}>YOUR CHILLCUP</Text><Text style={styles.title}>ประวัติการซื้อ</Text></View>
        <Pressable style={styles.iconButton} onPress={refresh} hitSlop={12}><Ionicons name="refresh" size={21} color={COLORS.primary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}><View style={styles.summaryIcon}><Ionicons name="receipt-outline" size={24} color={COLORS.primary} /></View><View><Text style={styles.summaryLabel}>คำสั่งซื้อทั้งหมด</Text><Text style={styles.summaryValue}>{orders.length} ออเดอร์</Text></View></View>
        {orders.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="time-outline" size={42} color={COLORS.primary} /></View><Text style={styles.emptyTitle}>ยังไม่มีประวัติการซื้อ</Text><Text style={styles.emptyText}>ออเดอร์ที่สั่งซื้อสำเร็จจะแสดงที่หน้านี้</Text><Pressable style={styles.shopButton} onPress={() => router.replace("/")}><Ionicons name="bag-handle-outline" size={18} color={COLORS.white} /><Text style={styles.shopButtonText}>ไปเลือกสินค้า</Text></Pressable></View> : orders.map((order) => <View style={styles.card} key={order.id}>
          <View style={styles.cardHeader}><View><Text style={styles.orderLabel}>คำสั่งซื้อ</Text><Text style={styles.orderId}>#{String(order.id).slice(-8)}</Text></View><View style={styles.statusPill}><Ionicons name={STATUS_ICONS[order.status]} size={14} color={COLORS.primary} /><Text style={styles.statusText}>{STATUS_LABELS[order.status]}</Text></View></View>
          <View style={styles.dateRow}><Ionicons name="calendar-outline" size={14} color={COLORS.muted} /><Text style={styles.dateText}>{new Date(order.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</Text><Text style={styles.tracking}>{order.tracking_code}</Text></View>
          <View style={styles.itemList}>{order.items.map((item) => <View style={styles.itemRow} key={item.product.id}><View style={styles.itemIcon}><Ionicons name="cafe-outline" size={17} color={COLORS.primary} /></View><Text style={styles.itemName} numberOfLines={1}>{item.product.product_name}</Text><Text style={styles.itemQty}>x{item.quantity}</Text></View>)}</View>
          <View style={styles.cardFooter}><View><Text style={styles.totalLabel}>ยอดรวม</Text><Text style={styles.total}>฿{Number(order.total).toLocaleString()}</Text></View><Pressable style={styles.trackButton} onPress={() => router.push({ pathname: "/track-order" } as never)}><Text style={styles.trackText}>ติดตาม</Text><Ionicons name="arrow-forward" size={16} color={COLORS.white} /></Pressable></View>
        </View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { height: 72, paddingHorizontal: 18, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { alignItems: "center" },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: COLORS.ink, fontSize: 20, fontWeight: "900", marginTop: 2 },
  content: { padding: 17, paddingBottom: 42 },
  summary: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, backgroundColor: "#DDF8F7", borderWidth: 1, borderColor: "#B7ECEB", marginBottom: 16 },
  summaryIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center" },
  summaryLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  summaryValue: { color: COLORS.deep, fontSize: 19, fontWeight: "900", marginTop: 3 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line, padding: 16, marginBottom: 13, shadowColor: COLORS.deep, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  orderId: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 3 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.ice, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 13 },
  statusText: { color: COLORS.primary, fontSize: 11, fontWeight: "900" },
  dateRow: { flexDirection: "row", alignItems: "center", marginTop: 12, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: COLORS.bg },
  dateText: { color: COLORS.muted, fontSize: 11, marginLeft: 5 },
  tracking: { color: COLORS.primary, fontSize: 11, fontWeight: "800", marginLeft: "auto" },
  itemList: { paddingVertical: 5 },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 7 },
  itemIcon: { width: 31, height: 31, borderRadius: 9, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center", marginRight: 9 },
  itemName: { flex: 1, color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  itemQty: { color: COLORS.primary, fontSize: 12, fontWeight: "900", marginLeft: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: COLORS.bg, paddingTop: 12, marginTop: 3 },
  totalLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  total: { color: COLORS.deep, fontSize: 18, fontWeight: "900", marginTop: 2 },
  trackButton: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  trackText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { width: 92, height: 92, borderRadius: 30, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center", marginBottom: 18 },
  emptyTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "900" },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
  shopButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, marginTop: 22 },
  shopButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
});
