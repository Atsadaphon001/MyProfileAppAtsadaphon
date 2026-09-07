// หน้าวิเคราะห์ระดับราคา
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../constants/api";
import { getSession } from "../constants/store";

type PriceTier = "Low" | "Mid" | "High";

// [PRICE ANALYSIS PRODUCT] ข้อมูลสินค้าที่ใช้จัดกลุ่มราคา
type Product = {
  id: number;
  product_name: string;
  price: number;
  brand?: string;
  category?: string;
  stock?: number;
  priceTier?: PriceTier;
};

type ClusterResult = {
  products: Product[];
  centroids: Record<PriceTier, number>;
};

// [PRICE TIER CONFIG] ชื่อ สี และลำดับของกลุ่ม Low/Mid/High
const TIER_ORDER: PriceTier[] = ["Low", "Mid", "High"];
const TIER_META: Record<PriceTier, { label: string; color: string; background: string }> = {
  Low: { label: "ราคาประหยัด", color: "#047857", background: "#D1FAE5" },
  Mid: { label: "ราคากลาง", color: "#B45309", background: "#FEF3C7" },
  High: { label: "พรีเมียม", color: "#BE123C", background: "#FFE4E6" },
};

// [PRICE FALLBACK DATA] ข้อมูลสำรองสำหรับวิเคราะห์เมื่อ API ยังไม่พร้อมใช้งาน
const fallbackProducts: Product[] = [
  { id: 1, product_name: "ChillCup Arctic 500ml", price: 399, brand: "ChillCup", category: "แก้วเก็บความเย็น", stock: 18 },
  { id: 2, product_name: "FrostPeak Tumbler 900ml", price: 699, brand: "FrostPeak", category: "แก้วเก็บความเย็น", stock: 12 },
  { id: 3, product_name: "BreezeMate Daily Cup 350ml", price: 259, brand: "BreezeMate", category: "แก้วกาแฟ", stock: 24 },
  { id: 4, product_name: "PolarSip Travel Mug 450ml", price: 489, brand: "PolarSip", category: "แก้วเดินทาง", stock: 15 },
  { id: 5, product_name: "HydroNest Sport Bottle 750ml", price: 559, brand: "HydroNest", category: "ขวดน้ำ", stock: 10 },
  { id: 6, product_name: "MellowCup Pastel 600ml", price: 329, brand: "MellowCup", category: "แก้วเก็บความเย็น", stock: 20 },
];

// [K-MEANS PRICE CLUSTER] คำนวณและแบ่งสินค้าออกเป็น 3 ระดับราคา
function clusterPrices(products: Product[]): ClusterResult {
  if (products.length === 0) return { products: [], centroids: { Low: 0, Mid: 0, High: 0 } };

  const prices = products.map((product) => Number(product.price) || 0);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  let centroids = [minimum, (minimum + maximum) / 2, maximum];
  let assignments = prices.map(() => 0);

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const nextAssignments = prices.map((price) => {
      const distances = centroids.map((centroid) => Math.abs(price - centroid));
      return distances.indexOf(Math.min(...distances));
    });
    const nextCentroids = centroids.map((centroid, clusterIndex) => {
      const clusterPrices = prices.filter((_, index) => nextAssignments[index] === clusterIndex);
      return clusterPrices.length ? clusterPrices.reduce((sum, price) => sum + price, 0) / clusterPrices.length : centroid;
    });
    const stable = nextCentroids.every((centroid, index) => Math.abs(centroid - centroids[index]) < 0.01);
    assignments = nextAssignments;
    centroids = nextCentroids;
    if (stable) break;
  }

  const sortedClusterIndexes = centroids.map((_, index) => index).sort((a, b) => centroids[a] - centroids[b]);
  const tierByCluster = new Map(sortedClusterIndexes.map((clusterIndex, rank) => [clusterIndex, TIER_ORDER[rank]]));
  const tierCentroids = TIER_ORDER.reduce((result, tier, rank) => {
    result[tier] = centroids[sortedClusterIndexes[rank]];
    return result;
  }, {} as Record<PriceTier, number>);

  return {
    centroids: tierCentroids,
    products: products.map((product, index) => ({ ...product, priceTier: tierByCluster.get(assignments[index]) || "Low" })),
  };
}

export default function PriceAnalysisScreen() {
  // [PRICE ANALYSIS STATE] ผลการวิเคราะห์ สถานะโหลด และข้อผิดพลาด
  const [result, setResult] = useState<ClusterResult>({ products: [], centroids: { Low: 0, Mid: 0, High: 0 } });
  const [loading, setLoading] = useState(true);
  const [fallbackNotice, setFallbackNotice] = useState("");

  // [LOAD PRICE DATA] โหลดสินค้าและเริ่มวิเคราะห์เมื่อเปิดหน้า Admin
  useEffect(() => {
    if (getSession()?.user.role !== "admin") {
      router.replace("/");
      return;
    }

    const loadProducts = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
        const payload = await response.json();
        const data = Array.isArray(payload) ? payload : payload.data;
        if (!Array.isArray(data) || data.length === 0) throw new Error("รูปแบบข้อมูลสินค้าไม่ถูกต้อง");
        setResult(clusterPrices(data));
      } catch (loadError) {
        setResult(clusterPrices(fallbackProducts));
        setFallbackNotice("เชื่อมต่อ API ไม่ได้ จึงใช้ข้อมูลสินค้าในเครื่องเพื่อแสดงตัวอย่างการวิเคราะห์");
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  // [PRICE ANALYSIS SUMMARY] คำนวณราคาเฉลี่ยและแจ้งข้อผิดพลาด
  const average = result.products.length
    ? result.products.reduce((sum, product) => sum + Number(product.price), 0) / result.products.length
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* [PRICE ANALYSIS HEADER] หัวข้อและปุ่มย้อนกลับ */}
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMIN INSIGHT</Text>
          <Text style={styles.title}>วิเคราะห์ระดับราคา</Text>
        </View>
        <View style={styles.iconButton}><Ionicons name="analytics-outline" size={21} color={COLORS.primary} /></View>
      </View>

      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>กำลังวิเคราะห์ราคาสินค้า...</Text></View> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {fallbackNotice ? <View style={styles.noticeBox}><Ionicons name="information-circle-outline" size={20} color="#0369A1" /><Text style={styles.noticeText}>{fallbackNotice}</Text></View> : null}

          {/* [PRICE ANALYSIS HERO] สรุปว่าเป็นการจัดกลุ่มราคาด้วย K-Means */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="trending-up-outline" size={27} color="#fff" /></View>
            <View style={styles.heroCopy}><Text style={styles.heroTitle}>AI Price Clusters</Text><Text style={styles.heroText}>จัดกลุ่มสินค้าตามราคาอัตโนมัติด้วย K-Means</Text></View>
          </View>

          {/* [PRICE SUMMARY] จำนวนสินค้า ราคาเฉลี่ย และจำนวนกลุ่ม */}
          <View style={styles.statsRow}>
            <Stat value={String(result.products.length)} label="สินค้าทั้งหมด" />
            <Stat value={`฿${average.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} label="ราคาเฉลี่ย" />
            <Stat value="3" label="กลุ่มราคา" />
          </View>

          {/* [PRICE TIER SUMMARY] สรุป Low/Mid/High และจุดกึ่งกลาง */}
          <Text style={styles.sectionTitle}>กลุ่มราคาที่พบ</Text>
          <View style={styles.tierGrid}>
            {TIER_ORDER.map((tier) => {
              const count = result.products.filter((product) => product.priceTier === tier).length;
              const meta = TIER_META[tier];
              return <View key={tier} style={[styles.tierCard, { borderColor: meta.background }]}><View style={[styles.tierDot, { backgroundColor: meta.color }]} /><Text style={styles.tierName}>{meta.label}</Text><Text style={[styles.tierValue, { color: meta.color }]}>{count} สินค้า</Text><Text style={styles.tierCentroid}>จุดกึ่งกลาง ฿{result.centroids[tier].toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text></View>;
            })}
          </View>

          {/* [PRICE ANALYSIS DETAILS] อธิบายหลักการทำงานของ K-Means */}
          <View style={styles.infoCard}><View style={styles.infoTitleRow}><Ionicons name="information-circle-outline" size={20} color={COLORS.primary} /><Text style={styles.infoTitle}>ส่วนนี้ทำงานอย่างไร</Text></View><Text style={styles.infoText}>ระบบนำราคาสินค้าทั้งหมดมาแบ่งเป็น 3 กลุ่ม โดยคำนวณจุดกึ่งกลางของแต่ละกลุ่มซ้ำจนค่าคงที่ แล้วกำหนดป้าย Low, Mid และ High ให้สินค้าแต่ละรายการ</Text><Text style={styles.infoNote}>ข้อมูลนี้ช่วยให้ Admin มองเห็นโครงสร้างราคาและเปรียบเทียบสินค้าได้เร็วขึ้น</Text></View>

          {/* [PRICE PRODUCT DETAILS] รายการสินค้าแยกตามระดับราคา */}
          <Text style={styles.sectionTitle}>รายละเอียดสินค้า</Text>
          {TIER_ORDER.map((tier) => {
            const meta = TIER_META[tier];
            const tierProducts = result.products.filter((product) => product.priceTier === tier).sort((a, b) => a.price - b.price);
            return <View key={tier} style={styles.listSection}><View style={styles.listHeader}><View style={[styles.tierBadge, { backgroundColor: meta.background }]}><Text style={[styles.tierBadgeText, { color: meta.color }]}>{tier}</Text></View><Text style={styles.listHeaderText}>{meta.label} ({tierProducts.length})</Text></View>{tierProducts.map((product) => <View style={styles.productRow} key={product.id}><View style={styles.productCopy}><Text style={styles.productName} numberOfLines={1}>{product.product_name}</Text><Text style={styles.productMeta}>{product.category || product.brand || "สินค้า ChillCup"}</Text></View><Text style={styles.productPrice}>฿{Number(product.price).toLocaleString()}</Text></View>)}</View>;
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// [PRICE STAT CARD] การ์ดตัวเลขสรุปผล
function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

// [PRICE ANALYSIS STYLES] รูปแบบหน้า Price Analysis
const COLORS = { background: "rgba(244, 249, 251, 0.88)", white: "#FFFFFF", primary: "#00A8B1", ink: "#163247", muted: "#5F7480", line: "#D7E5EA" };
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 74, paddingHorizontal: 18, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#E8FAFC", alignItems: "center", justifyContent: "center" },
  headerCopy: { alignItems: "center" },
  eyebrow: { color: COLORS.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 20, fontWeight: "900", marginTop: 2 },
  content: { width: "100%", maxWidth: 920, alignSelf: "center", padding: 18, paddingBottom: 42 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FFF1F2", borderRadius: 12, padding: 13, marginBottom: 14 },
  errorText: { color: "#BE123C", flex: 1, fontSize: 13 },
  noticeBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#E0F2FE", borderRadius: 12, padding: 13, marginBottom: 14 },
  noticeText: { color: "#075985", flex: 1, fontSize: 12, lineHeight: 18 },
  hero: { backgroundColor: "#0E7490", borderRadius: 18, padding: 20, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#00A8B1", alignItems: "center", justifyContent: "center" },
  heroCopy: { flex: 1, marginLeft: 14 },
  heroTitle: { color: "#fff", fontSize: 19, fontWeight: "900" },
  heroText: { color: "#D9F7FA", fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 14 },
  statValue: { color: COLORS.ink, fontSize: 20, fontWeight: "900" },
  statLabel: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "900", marginBottom: 10 },
  tierGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  tierCard: { flex: 1, backgroundColor: COLORS.white, borderWidth: 2, borderRadius: 14, padding: 13 },
  tierDot: { width: 9, height: 9, borderRadius: 5, marginBottom: 9 },
  tierName: { color: COLORS.ink, fontSize: 12, fontWeight: "800" },
  tierValue: { fontSize: 16, fontWeight: "900", marginTop: 5 },
  tierCentroid: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  infoCard: { backgroundColor: "#E8FAFC", borderRadius: 14, padding: 16, marginBottom: 22 },
  infoTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoTitle: { color: "#0E7490", fontSize: 14, fontWeight: "900" },
  infoText: { color: COLORS.ink, fontSize: 13, lineHeight: 20 },
  infoNote: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  listSection: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 14, marginBottom: 12 },
  listHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tierBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  tierBadgeText: { fontSize: 11, fontWeight: "900" },
  listHeaderText: { color: COLORS.ink, fontSize: 14, fontWeight: "800", marginLeft: 8 },
  productRow: { minHeight: 48, borderTopWidth: 1, borderTopColor: "#EEF4F6", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  productCopy: { flex: 1, minWidth: 0, paddingRight: 12 },
  productName: { color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  productMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  productPrice: { color: COLORS.ink, fontSize: 13, fontWeight: "900" },
});
