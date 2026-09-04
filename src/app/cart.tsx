import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert, Animated, Easing, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from "react-native";
import { API_AUTH_URL } from "../constants/api";
import { addDemoOrder, clearCart, decreaseStock, getCart, getSession, updateCartQuantity } from "../constants/store";
import { celebrationStyles } from "./celebration-styles";

const COLORS = { primary: "#00a8b1", dark: "#0E7490", bg: "#F0FBFF", text: "#0F2A37", muted: "#5B7C89", border: "#DCF2F8", orange: "#F59E0B" };

export default function CartScreen() {
  const [items, setItems] = useState(getCart());
  const [name, setName] = useState(getSession()?.user.name || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("cod");
  const [slip, setSlip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0.6)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  useEffect(() => {
    if (!celebrating) return;
    celebrationScale.setValue(0.6);
    celebrationOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(celebrationScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(celebrationOpacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [celebrating, celebrationOpacity, celebrationScale]);

  const refresh = () => setItems([...getCart()]);
  const changeQuantity = (id: number, quantity: number) => { updateCartQuantity(id, quantity); refresh(); };
  const chooseSlip = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setSlip(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };
  const placeOrder = async () => {
    if (!items.length) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      const message = "กรุณากรอกชื่อ เบอร์โทร และที่อยู่จัดส่ง";
      Platform.OS === "web" ? alert(message) : Alert.alert("ข้อมูลไม่ครบ", message);
      return;
    }
    if (payment === "transfer" && !slip) {
      const message = "กรุณาแนบสลิปโอนเงินก่อนยืนยันคำสั่งซื้อ";
      Platform.OS === "web" ? alert(message) : Alert.alert("ต้องแนบสลิป", message);
      return;
    }
    setBusy(true);
    try {
      const session = getSession();
      const isDemoOrder = session?.token === "demo-session";
      if (isDemoOrder) {
        decreaseStock(items);
      } else {
        const response = await fetch(`${API_AUTH_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
          },
          body: JSON.stringify({
            items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
            customerName: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            paymentMethod: payment,
            slipUrl: slip,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || `สั่งซื้อไม่สำเร็จ (${response.status})`);
      }
      addDemoOrder(items, name, phone, address, payment);
      clearCart();
      setCelebrating(true);
      setTimeout(() => router.replace("/track-order"), 2300);
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
      Platform.OS === "web" ? alert(message) : Alert.alert("สั่งซื้อไม่สำเร็จ", message);
    } finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={25} color={COLORS.text} /></TouchableOpacity><Text style={styles.title}>ตะกร้าสินค้า</Text><View style={{ width: 25 }} /></View>
    {!items.length ? <View style={styles.empty}><Ionicons name="cart-outline" size={58} color={COLORS.primary} /><Text style={styles.emptyTitle}>ตะกร้ายังว่าง</Text><TouchableOpacity style={styles.button} onPress={() => router.replace("/")}><Text style={styles.buttonText}>เลือกซื้อสินค้า</Text></TouchableOpacity></View> : <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>รายการของคุณ ({items.length})</Text>
      {items.map((item) => <View style={styles.item} key={item.product.id}>
        <Image source={{ uri: item.product.image || "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop" }} style={styles.image} />
        <View style={styles.itemInfo}><Text style={styles.itemName} numberOfLines={2}>{item.product.product_name}</Text><Text style={styles.price}>฿{Number(item.product.price).toLocaleString()}</Text><View style={styles.stepper}><TouchableOpacity onPress={() => changeQuantity(item.product.id, item.quantity - 1)}><Ionicons name="remove" size={17} color={COLORS.dark} /></TouchableOpacity><Text style={styles.quantity}>{item.quantity}</Text><TouchableOpacity onPress={() => changeQuantity(item.product.id, item.quantity + 1)}><Ionicons name="add" size={17} color={COLORS.dark} /></TouchableOpacity></View></View>
      </View>)}
      <Text style={styles.sectionTitle}>ข้อมูลจัดส่ง</Text>
      <TextInput style={styles.input} placeholder="ชื่อผู้รับ" value={name} onChangeText={setName} placeholderTextColor="#94A3B8" />
      <TextInput style={styles.input} placeholder="เบอร์โทรศัพท์" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#94A3B8" />
      <TextInput style={[styles.input, styles.address]} placeholder="ที่อยู่สำหรับจัดส่ง" value={address} onChangeText={setAddress} multiline placeholderTextColor="#94A3B8" />
      <Text style={styles.sectionTitle}>วิธีชำระเงิน</Text>
      <View style={styles.payRow}>{[{ key: "cod", label: "เก็บเงินปลายทาง", icon: "cash-outline" }, { key: "transfer", label: "โอนเงิน", icon: "card-outline" }].map((option) => <TouchableOpacity key={option.key} style={[styles.payOption, payment === option.key && styles.payActive]} onPress={() => setPayment(option.key)}><Ionicons name={option.icon as never} size={21} color={payment === option.key ? COLORS.primary : COLORS.muted} /><Text style={styles.payText}>{option.label}</Text></TouchableOpacity>)}</View>
      {payment === "transfer" && <View style={styles.transferBox}>
        <Text style={styles.transferTitle}>โอนเงินมาที่บัญชี ChillCup</Text>
        <Text style={styles.account}>พร้อมเพย์: 099-999-9999</Text>
        <Text style={styles.account}>ธนาคาร SCB | ChillCup Store</Text>
        <Text style={styles.transferHint}>ยอดที่ต้องโอน ฿{total.toLocaleString()} แล้วแนบสลิปด้านล่าง</Text>
        <TouchableOpacity style={styles.slipButton} onPress={chooseSlip}>
          <Ionicons name={slip ? "checkmark-circle" : "cloud-upload-outline"} size={22} color={COLORS.primary} />
          <Text style={styles.slipText}>{slip ? "แนบสลิปแล้ว เลือกใหม่" : "เลือกรูปสลิปโอนเงิน"}</Text>
        </TouchableOpacity>
        {slip && <Image source={{ uri: slip }} style={styles.slipPreview} />}
      </View>}
      <View style={styles.summary}><Text style={styles.totalLabel}>ยอดรวม</Text><Text style={styles.total}>฿{total.toLocaleString()}</Text></View>
      <TouchableOpacity style={[styles.button, busy && { opacity: 0.6 }]} onPress={placeOrder} disabled={busy}><Text style={styles.buttonText}>{busy ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}</Text><Ionicons name="checkmark-circle-outline" size={21} color="#fff" /></TouchableOpacity>
    </ScrollView>}
    {celebrating && <View style={celebrationStyles.celebrationOverlay} pointerEvents="box-only">
      <Animated.View style={[celebrationStyles.celebrationCard, { opacity: celebrationOpacity, transform: [{ scale: celebrationScale }] }]}>
        <View style={[celebrationStyles.firework, celebrationStyles.fireworkOne]}><Text style={celebrationStyles.fireworkText}>+</Text></View>
        <View style={[celebrationStyles.firework, celebrationStyles.fireworkTwo]}><Text style={celebrationStyles.fireworkText}>*</Text></View>
        <View style={[celebrationStyles.firework, celebrationStyles.fireworkThree]}><Text style={celebrationStyles.fireworkText}>+</Text></View>
        <View style={celebrationStyles.thanksCharacter}><Ionicons name="happy-outline" size={58} color="#fff" /></View>
        <Text style={celebrationStyles.thanksTitle}>ขอบคุณที่สั่งซื้อ!</Text>
        <Text style={celebrationStyles.thanksText}>ออเดอร์ของคุณกำลังเดินทางไปหาแล้ว</Text>
        <View style={celebrationStyles.celebrationPill}><Ionicons name="sparkles" size={15} color={COLORS.primary} /><Text style={celebrationStyles.celebrationPillText}>กำลังเปิดหน้าติดตามสินค้า</Text></View>
      </Animated.View>
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: COLORS.bg }, header: { height: 62, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: COLORS.border }, title: { fontSize: 19, fontWeight: "800", color: COLORS.text }, content: { padding: 18, paddingBottom: 38 }, sectionTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text, marginTop: 8, marginBottom: 12 }, item: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border }, image: { width: 82, height: 82, borderRadius: 10, backgroundColor: "#E8FAFC" }, itemInfo: { flex: 1, marginLeft: 12 }, itemName: { color: COLORS.text, fontSize: 14, fontWeight: "700" }, price: { color: COLORS.primary, fontSize: 15, fontWeight: "800", marginTop: 5 }, stepper: { flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 15, marginTop: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 }, quantity: { color: COLORS.text, fontWeight: "800" }, input: { height: 48, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, color: COLORS.text, marginBottom: 10 }, address: { height: 82, paddingTop: 12, textAlignVertical: "top" }, payRow: { flexDirection: "row", gap: 10 }, payOption: { flex: 1, minHeight: 66, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, padding: 10, justifyContent: "center", alignItems: "center", gap: 5 }, payActive: { borderColor: COLORS.primary, backgroundColor: "#E8FAFC" }, payText: { color: COLORS.text, fontSize: 12, fontWeight: "700", textAlign: "center" }, transferBox: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginTop: 12 }, transferTitle: { color: COLORS.dark, fontWeight: "800", fontSize: 15 }, account: { color: COLORS.text, fontSize: 14, marginTop: 5 }, transferHint: { color: COLORS.muted, fontSize: 12, marginTop: 12 }, slipButton: { minHeight: 48, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.primary, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 13 }, slipText: { color: COLORS.primary, fontWeight: "800", fontSize: 13 }, slipPreview: { width: "100%", height: 190, resizeMode: "contain", marginTop: 12, borderRadius: 8, backgroundColor: "#F8FAFC" }, summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 14 }, totalLabel: { color: COLORS.muted, fontSize: 15, fontWeight: "700" }, total: { color: COLORS.dark, fontSize: 23, fontWeight: "900" }, button: { minHeight: 50, borderRadius: 11, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 9 }, buttonText: { color: "#fff", fontSize: 15, fontWeight: "800" }, empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 13 }, emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: "800" } });
