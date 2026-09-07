// หน้าติดตามคำสั่งซื้อ
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    DemoOrder,
    getDemoOrders,
    OrderStatus,
    updateDemoOrderStatus,
} from "../constants/store";

// [TRACK ORDER] หน้าติดตามสถานะคำสั่งซื้อ
const COLORS = {
  ice: "#E8FAFC",
  mist: "rgba(244, 251, 253, 0.88)",
  primary: "#00A8B1",
  deep: "#0E7490",
  ink: "#0F2A37",
  muted: "#63818D",
  line: "#CBEAF0",
  white: "#FFFFFF",
  success: "#10B981",
};

const STATUS_STEPS: Array<{ key: OrderStatus; label: string; detail: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "pending", label: "รับคำสั่งซื้อแล้ว", detail: "ร้านค้ากำลังเตรียมออเดอร์ของคุณ", icon: "receipt-outline" },
  { key: "processing", label: "กำลังเตรียมสินค้า", detail: "ทีม ChillCup กำลังแพ็กสินค้าอย่างตั้งใจ", icon: "cube-outline" },
  { key: "shipped", label: "กำลังจัดส่ง", detail: "พัสดุออกเดินทางไปยังที่อยู่ของคุณแล้ว", icon: "bicycle-outline" },
  { key: "delivered", label: "จัดส่งสำเร็จ", detail: "ขอบคุณที่เลือก ChillCup", icon: "checkmark-circle-outline" },
];

const statusIndex = (status: OrderStatus) => STATUS_STEPS.findIndex((step) => step.key === status);

export default function TrackOrderScreen() {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);

  const refresh = () => {
    const nextOrders = getDemoOrders();
    setOrders([...nextOrders]);
    setSelectedId((current) => current ?? nextOrders[0]?.id ?? null);
  };

  useEffect(() => {
    refresh();
  }, []);

  const selectedOrder = orders.find((order) => order.id === selectedId) || orders[0];
  const currentIndex = selectedOrder ? statusIndex(selectedOrder.status) : -1;
  const nextStep = currentIndex >= 0 && currentIndex < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentIndex + 1] : null;

  const simulateNext = () => {
    if (!selectedOrder || !nextStep) return;
    setMoving(true);
    updateDemoOrderStatus(selectedOrder.id, nextStep.key);
    setTimeout(() => {
      refresh();
      setMoving(false);
    }, 320);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")} hitSlop={12}>
          <Ionicons name="arrow-back" size={23} color={COLORS.ink} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>CHILLCUP CARE</Text>
          <Text style={styles.title}>ติดตามคำสั่งซื้อ</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={refresh} hitSlop={12}>
          <Ionicons name="refresh" size={21} color={COLORS.primary} />
        </Pressable>
      </View>

      {!selectedOrder ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Ionicons name="navigate-outline" size={42} color={COLORS.primary} /></View>
          <Text style={styles.emptyTitle}>ยังไม่มีคำสั่งซื้อ</Text>
          <Text style={styles.emptyText}>เมื่อสั่งซื้อแล้ว สถานะการจัดส่งจะแสดงที่หน้านี้</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace("/")}>
            <Ionicons name="bag-handle-outline" size={19} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>ไปเลือกสินค้า</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroKicker}>ORDER STATUS</Text>
                <Text style={styles.heroOrder}>#{selectedOrder.id}</Text>
              </View>
              <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
            </View>
            <Text style={styles.heroStatus}>{STATUS_STEPS[currentIndex]?.label}</Text>
            <Text style={styles.heroDetail}>{STATUS_STEPS[currentIndex]?.detail}</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(8, ((currentIndex + 1) / STATUS_STEPS.length) * 100)}%` }]} /></View>
            <View style={styles.progressLabels}><Text style={styles.progressLabel}>รับออเดอร์</Text><Text style={styles.progressLabel}>ถึงมือคุณ</Text></View>
          </View>

          {orders.length > 1 && <>
            <Text style={styles.sectionTitle}>คำสั่งซื้อของฉัน</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderPicker}>
              {orders.map((order) => <Pressable key={order.id} style={[styles.orderChip, selectedOrder.id === order.id && styles.orderChipActive]} onPress={() => setSelectedId(order.id)}>
                <Ionicons name="cube-outline" size={17} color={selectedOrder.id === order.id ? COLORS.white : COLORS.primary} />
                <Text style={[styles.orderChipText, selectedOrder.id === order.id && styles.orderChipTextActive]}>#{String(order.id).slice(-6)}</Text>
              </Pressable>)}
            </ScrollView>
          </>}

          <View style={styles.infoRow}>
            <View style={styles.infoCard}><Text style={styles.infoLabel}>รหัสติดตาม</Text><Text style={styles.infoValue}>{selectedOrder.tracking_code}</Text></View>
            <View style={styles.infoCard}><Text style={styles.infoLabel}>ยอดรวม</Text><Text style={styles.infoValue}>฿{Number(selectedOrder.total).toLocaleString()}</Text></View>
          </View>

          <Text style={styles.sectionTitle}>เส้นทางการจัดส่ง</Text>
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, index) => {
              const done = index <= currentIndex;
              const active = index === currentIndex;
              return <View style={styles.timelineRow} key={step.key}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone, active && styles.timelineDotActive]}><Ionicons name={step.icon} size={17} color={done ? COLORS.white : COLORS.muted} /></View>
                  {index < STATUS_STEPS.length - 1 && <View style={[styles.timelineLine, index < currentIndex && styles.timelineLineDone]} />}
                </View>
                <View style={[styles.timelineCopy, active && styles.timelineCopyActive]}>
                  <View style={styles.timelineTitleRow}><Text style={[styles.timelineTitle, done && styles.timelineTitleDone]}>{step.label}</Text>{active && <Text style={styles.nowLabel}>ล่าสุด</Text>}</View>
                  <Text style={styles.timelineDetail}>{step.detail}</Text>
                </View>
              </View>;
            })}
          </View>

          <View style={styles.itemsCard}>
            <View style={styles.itemsHeader}><Text style={styles.sectionTitle}>รายการสินค้า</Text><Text style={styles.itemCount}>{selectedOrder.items.length} รายการ</Text></View>
            {selectedOrder.items.map((item) => <View style={styles.itemRow} key={item.product.id}><View style={styles.itemIcon}><Ionicons name="cafe-outline" size={19} color={COLORS.primary} /></View><Text style={styles.itemName} numberOfLines={1}>{item.product.product_name}</Text><Text style={styles.itemQty}>x{item.quantity}</Text></View>)}
          </View>

          <View style={styles.demoPanel}>
            <View style={styles.demoIcon}><Ionicons name="sparkles-outline" size={20} color={COLORS.primary} /></View>
            <View style={styles.demoCopy}><Text style={styles.demoTitle}>โหมดทดลองสถานะ</Text><Text style={styles.demoText}>กดเพื่อดูประสบการณ์เมื่อออเดอร์เดินทางไปแต่ละช่วง</Text></View>
            <Pressable style={[styles.nextButton, !nextStep && styles.nextButtonDisabled]} onPress={simulateNext} disabled={!nextStep || moving}>{moving ? <ActivityIndicator size="small" color={COLORS.white} /> : <Ionicons name={nextStep ? "arrow-forward" : "checkmark"} size={19} color={COLORS.white} />}</Pressable>
          </View>
          {nextStep && <Text style={styles.nextHint}>จำลองต่อไป: {nextStep.label}</Text>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mist },
  header: { height: 72, paddingHorizontal: 18, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center" },
  headerTitleWrap: { alignItems: "center" },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: COLORS.ink, fontSize: 20, fontWeight: "900", marginTop: 2 },
  content: { padding: 17, paddingBottom: 42 },
  heroCard: { overflow: "hidden", borderRadius: 24, padding: 20, backgroundColor: COLORS.deep, shadowColor: COLORS.deep, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  heroGlow: { position: "absolute", width: 170, height: 170, borderRadius: 85, backgroundColor: "#33D6DB", opacity: 0.18, right: -48, top: -74 },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroKicker: { color: "#B9F6F4", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  heroOrder: { color: COLORS.white, fontSize: 17, fontWeight: "900", marginTop: 4 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#8FFFEA" },
  liveText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  heroStatus: { color: COLORS.white, fontSize: 26, fontWeight: "900", marginTop: 26 },
  heroDetail: { color: "#C8F4F4", fontSize: 13, marginTop: 6 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)", marginTop: 24, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#8FFFEA" },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  progressLabel: { color: "#B9F6F4", fontSize: 10, fontWeight: "700" },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginTop: 22, marginBottom: 11 },
  orderPicker: { gap: 9, paddingBottom: 2 },
  orderChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  orderChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  orderChipText: { color: COLORS.deep, fontSize: 12, fontWeight: "800" },
  orderChipTextActive: { color: COLORS.white },
  infoRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  infoCard: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  infoLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  infoValue: { color: COLORS.ink, fontSize: 15, fontWeight: "900", marginTop: 5 },
  timeline: { padding: 16, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  timelineRow: { flexDirection: "row", minHeight: 72 },
  timelineRail: { width: 38, alignItems: "center" },
  timelineDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.mist, borderWidth: 1, borderColor: COLORS.line, justifyContent: "center", alignItems: "center", zIndex: 1 },
  timelineDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timelineDotActive: { backgroundColor: COLORS.deep, borderColor: "#8FFFEA", borderWidth: 2 },
  timelineLine: { position: "absolute", width: 2, top: 34, bottom: 0, backgroundColor: COLORS.line },
  timelineLineDone: { backgroundColor: COLORS.primary },
  timelineCopy: { flex: 1, marginLeft: 12, paddingBottom: 16 },
  timelineCopyActive: { paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: "#8FFFEA" },
  timelineTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timelineTitle: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  timelineTitleDone: { color: COLORS.ink },
  timelineDetail: { color: COLORS.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  nowLabel: { color: COLORS.primary, fontSize: 10, fontWeight: "900", backgroundColor: COLORS.ice, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  itemsCard: { marginTop: 22, padding: 16, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  itemsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemCount: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.mist },
  itemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center", marginRight: 10 },
  itemName: { flex: 1, color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  itemQty: { color: COLORS.primary, fontSize: 13, fontWeight: "900", marginLeft: 8 },
  demoPanel: { flexDirection: "row", alignItems: "center", marginTop: 22, padding: 14, borderRadius: 18, backgroundColor: "#DDF8F7", borderWidth: 1, borderColor: "#B7ECEB" },
  demoIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.white, justifyContent: "center", alignItems: "center" },
  demoCopy: { flex: 1, marginHorizontal: 11 },
  demoTitle: { color: COLORS.deep, fontSize: 13, fontWeight: "900" },
  demoText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  nextButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  nextButtonDisabled: { backgroundColor: COLORS.success },
  nextHint: { color: COLORS.primary, textAlign: "right", fontSize: 11, fontWeight: "800", marginTop: 7 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyIcon: { width: 92, height: 92, borderRadius: 30, backgroundColor: COLORS.ice, justifyContent: "center", alignItems: "center", marginBottom: 18 },
  emptyTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "900" },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: "center", lineHeight: 21, marginTop: 8, maxWidth: 280 },
  primaryButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, marginTop: 22 },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
});
