import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { getDemoOrders, getSession, markDemoOrderPaid } from "../constants/store";

type Order = ReturnType<typeof getDemoOrders>[number];
const C = { primary: "#00A8B1", dark: "#0E7490", bg: "#EEF8FA", text: "#0F2A37", muted: "#5B7C89", border: "#D6EDF2", white: "#FFFFFF", success: "#047857" };

function statusMeta(status: string) {
  if (status === "processing") return { label: "กำลังเตรียมสินค้า", icon: "cube-outline" as const, color: C.success };
  if (status === "shipped") return { label: "กำลังจัดส่ง", icon: "bicycle-outline" as const, color: C.primary };
  if (status === "delivered") return { label: "จัดส่งสำเร็จ", icon: "checkmark-circle-outline" as const, color: C.success };
  return { label: "รอดำเนินการ", icon: "receipt-outline" as const, color: C.dark };
}

export default function AdminOrdersScreen() {
  const session = getSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const refresh = () => setOrders([...getDemoOrders()]);

  useEffect(() => {
    if (session?.user.role !== "admin") { router.replace("/"); return; }
    refresh();
    const timer = setInterval(refresh, 1_000);
    return () => clearInterval(timer);
  }, []);

  const startProcessing = (id: number) => {
    setBusyId(id);
    markDemoOrderPaid(id);
    refresh();
    setBusyId(null);
    const message = "เริ่มดำเนินการสินค้าแล้ว ระบบจะเปลี่ยนสถานะทุก 5 วินาที";
    PlatformAlert("ยืนยันสำเร็จ", message);
  };

  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}><Ionicons name="arrow-back" size={24} color={C.text} /></Pressable><View><Text style={styles.eyebrow}>CHILLCUP ADMIN</Text><Text style={styles.title}>ตรวจสอบคำสั่งซื้อ</Text></View><Pressable style={styles.iconButton} onPress={refresh}><Ionicons name="refresh" size={22} color={C.primary} /></Pressable></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}><Ionicons name="receipt-outline" size={25} color={C.primary} /><View><Text style={styles.summaryTitle}>{orders.length} คำสั่งซื้อ</Text><Text style={styles.summaryText}>กดยืนยันเพื่อเริ่มสถานะจำลองอัตโนมัติ</Text></View></View>
      {orders.length === 0 ? <View style={styles.empty}><Ionicons name="file-tray-outline" size={52} color={C.primary} /><Text style={styles.emptyText}>ยังไม่มีคำสั่งซื้อ</Text></View> : orders.map(order => {
        const status = statusMeta(order.status);
        const canStart = order.status === "pending";
        return <View key={order.id} style={styles.card}>
          <View style={styles.row}><View><Text style={styles.orderId}>คำสั่งซื้อ #{order.id}</Text><Text style={styles.date}>{new Date(order.created_at).toLocaleDateString("th-TH")}</Text></View><View style={styles.status}><Ionicons name={status.icon} size={15} color={status.color} /><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></View>
          <View style={styles.customer}><View style={styles.avatar}><Text style={styles.avatarText}>{order.customer_name?.charAt(0).toUpperCase() || "C"}</Text></View><View style={{ flex: 1 }}><Text style={styles.customerName}>{order.customer_name}</Text><Text style={styles.detail}>{order.phone} · {order.payment_method}</Text></View><Text style={styles.total}>฿{Number(order.total).toLocaleString()}</Text></View>
          <View style={styles.addressRow}><Ionicons name="location-outline" size={16} color={C.muted} /><Text style={styles.detail}>{order.address}</Text></View>
          {canStart && <Pressable style={[styles.confirm, busyId === order.id && styles.disabled]} onPress={() => startProcessing(order.id)} disabled={busyId === order.id}><Ionicons name="shield-checkmark-outline" size={18} color={C.white} /><Text style={styles.confirmText}>{busyId === order.id ? "กำลังยืนยัน..." : "ยืนยันและเริ่มดำเนินการ"}</Text></Pressable>}
        </View>;
      })}
    </ScrollView>
  </SafeAreaView>;
}

function PlatformAlert(title: string, message: string) { Alert.alert(title, message); }

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: C.bg }, header: { height: 70, paddingHorizontal: 18, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#F2FAFC" }, eyebrow: { color: C.primary, fontSize: 10, fontWeight: "800", textAlign: "center", letterSpacing: 1.1 }, title: { color: C.text, fontSize: 18, fontWeight: "800" }, content: { padding: 18, paddingBottom: 38 }, summary: { backgroundColor: "#DDF6F8", padding: 16, borderRadius: 18, flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 }, summaryTitle: { color: C.text, fontSize: 16, fontWeight: "800" }, summaryText: { color: C.muted, fontSize: 12, marginTop: 3 }, card: { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, marginBottom: 12 }, row: { flexDirection: "row", justifyContent: "space-between" }, orderId: { color: C.dark, fontSize: 16, fontWeight: "800" }, date: { color: C.muted, fontSize: 11, marginTop: 3 }, status: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E8F6F8", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7 }, statusText: { fontSize: 11, fontWeight: "800" }, customer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 15 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#DDF6F8", alignItems: "center", justifyContent: "center" }, avatarText: { color: C.dark, fontWeight: "800" }, customerName: { color: C.text, fontWeight: "800" }, detail: { color: C.muted, fontSize: 12, marginTop: 2, flex: 1 }, total: { color: C.primary, fontSize: 18, fontWeight: "900" }, addressRow: { flexDirection: "row", gap: 6, marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }, confirm: { backgroundColor: C.primary, minHeight: 48, borderRadius: 12, marginTop: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, confirmText: { color: C.white, fontWeight: "800" }, disabled: { opacity: 0.7 }, empty: { alignItems: "center", paddingTop: 64 }, emptyText: { color: C.text, fontWeight: "800", marginTop: 12 } });
