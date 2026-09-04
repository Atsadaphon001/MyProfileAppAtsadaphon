import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getDemoOrders, getSession, markDemoOrderPaid } from "../constants/store";

interface Order { id: number; customer_name: string; phone: string; address: string; payment_method: string; slip_url?: string; total: number; status: string; created_at: string; }
const COLORS = { primary: "#00a8b1", dark: "#0E7490", bg: "#F0FBFF", text: "#0F2A37", muted: "#5B7C89", border: "#DCF2F8", orange: "#F59E0B" };

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const session = getSession();
  useEffect(() => { if (session?.user.role !== "admin") router.replace("/"); else loadOrders(); }, []);
  const loadOrders = () => setOrders([...getDemoOrders()]);
  const verify = async (id: number) => {
    setBusy(id);
    try {
      markDemoOrderPaid(id);
      loadOrders();
      Platform.OS === "web" ? alert("ยืนยันการชำระเงินแล้ว") : Alert.alert("สำเร็จ", "ยืนยันการชำระเงินแล้ว");
    } catch (error) { const message = error instanceof Error ? error.message : "ตรวจสอบไม่สำเร็จ"; Platform.OS === "web" ? alert(message) : Alert.alert("เกิดข้อผิดพลาด", message); }
    finally { setBusy(null); }
  };
  return <SafeAreaView style={styles.container}><StatusBar barStyle="dark-content" /><View style={styles.header}><TouchableOpacity onPress={() => router.replace("/")}><Ionicons name="arrow-back" size={25} color={COLORS.text} /></TouchableOpacity><Text style={styles.title}>ตรวจสอบคำสั่งซื้อ</Text><TouchableOpacity onPress={loadOrders}><Ionicons name="refresh" size={22} color={COLORS.primary} /></TouchableOpacity></View><ScrollView contentContainerStyle={styles.content}>{orders.length === 0 && <Text style={styles.empty}>ยังไม่มีคำสั่งซื้อ</Text>}{orders.map((order) => <View style={styles.card} key={order.id}><View style={styles.row}><Text style={styles.orderId}>คำสั่งซื้อ #{order.id}</Text><Text style={[styles.status, order.status === "awaiting_verification" && styles.waiting]}>{order.status}</Text></View><Text style={styles.customer}>{order.customer_name} | {order.phone}</Text><Text style={styles.address}>{order.address}</Text><Text style={styles.total}>฿{Number(order.total).toLocaleString()}</Text>{order.slip_url && <Image source={{ uri: order.slip_url }} style={styles.slip} />}{order.status === "awaiting_verification" && <TouchableOpacity style={styles.verify} onPress={() => verify(order.id)} disabled={busy === order.id}><Text style={styles.verifyText}>{busy === order.id ? "กำลังตรวจสอบ..." : "ยืนยันสลิปและตัดสต็อก"}</Text></TouchableOpacity>}</View>)}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.bg }, header: { height: 62, paddingHorizontal: 18, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, title: { color: COLORS.text, fontSize: 18, fontWeight: "800" }, content: { padding: 18 }, card: { backgroundColor: "#fff", borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, padding: 15, marginBottom: 12 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, orderId: { color: COLORS.dark, fontSize: 16, fontWeight: "800" }, status: { color: "#10B981", fontSize: 11, fontWeight: "800" }, waiting: { color: COLORS.orange }, customer: { color: COLORS.text, fontWeight: "700", marginTop: 12 }, address: { color: COLORS.muted, fontSize: 13, marginTop: 5 }, total: { color: COLORS.primary, fontSize: 19, fontWeight: "900", marginTop: 10 }, slip: { width: "100%", height: 250, resizeMode: "contain", marginTop: 12, backgroundColor: "#F8FAFC" }, verify: { backgroundColor: COLORS.primary, minHeight: 46, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 12 }, verifyText: { color: "#fff", fontWeight: "800" }, empty: { color: COLORS.muted, textAlign: "center", marginTop: 50 } });
