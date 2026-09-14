// หน้าเพิ่มสินค้า
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";
import { getSession } from "../constants/store";

// [ADD PRODUCT] หน้าเพิ่มสินค้าเฉพาะ Admin
const COLORS = {
  primary: "#00A8B1",
  background: "#EEF8FA",
  surface: "#FFFFFF",
  border: "#D6EDF2",
  text: "#0F172A",
  textSecondary: "#5B7C89",
};

export default function AddScreen() {
  // [ADD PRODUCT STATE] ข้อมูลฟอร์มสินค้าใหม่
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [color, setColor] = useState("");
  const [storage, setStorage] = useState("");
  const [ram, setRam] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Available");
  const [saving, setSaving] = useState(false);

  // [ADMIN ACCESS] ตรวจสิทธิ์ก่อนเปิดหน้าเพิ่มสินค้า
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "admin") router.replace("/");
  }, []);

  // [SAVE NEW PRODUCT] ส่งข้อมูลสินค้าใหม่ไปยัง Backend
  const saveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้าและราคา");
      return;
    }

    setSaving(true);
    try {
      const session = getSession();
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify({
          product_name: name.trim(),
          productCode: productCode.trim(),
          brand: brand.trim(),
          category: category.trim(),
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          color: color.trim(),
          storage: storage.trim(),
          ram: ram.trim(),
          image: image.trim(),
          description: description.trim(),
          status: status.trim() || "Available",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "ไม่สามารถเพิ่มสินค้าได้");
      Alert.alert("สำเร็จ", "เพิ่มสินค้าเรียบร้อยแล้ว");
      router.replace("/");
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", error instanceof Error ? error.message : "ไม่สามารถเพิ่มสินค้าได้");
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* [ADD PRODUCT HEADER] หัวข้อและปุ่มย้อนกลับ */}
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.primary}
          />
        </Pressable>

        <Text style={styles.title}>
          เพิ่มสินค้าใหม่
        </Text>

        <View style={styles.iconButton}><Ionicons name="cube-outline" size={21} color={COLORS.primary} /></View>
      </View>

      {/* [ADD PRODUCT FORM] ช่องกรอกข้อมูลสินค้า */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>

            <Text style={styles.label}>รหัสสินค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น LHC3249"
              placeholderTextColor="#94A3B8"
              value={productCode}
              onChangeText={setProductCode}
            />

            <Text style={styles.label}>ชื่อสินค้า *</Text>
            <TextInput
              style={styles.input}
              placeholder="เช่น ChillCup Classic 500ml"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>แบรนด์</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น ChillCup"
                  placeholderTextColor="#94A3B8"
                  value={brand}
                  onChangeText={setBrand}
                />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>หมวดหมู่</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เช่น แก้วเก็บความเย็น"
                  placeholderTextColor="#94A3B8"
                  value={category}
                  onChangeText={setCategory}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ราคา (บาท) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>สต็อก</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>สี</Text>
                <TextInput
                  style={styles.input}
                  placeholder="เลือกสีได้"
                  placeholderTextColor="#94A3B8"
                  value={color}
                  onChangeText={setColor}
                />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ความจุ (Storage)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="550ml"
                  placeholderTextColor="#94A3B8"
                  value={storage}
                  onChangeText={setStorage}
                />
              </View>
            </View>

            <Text style={styles.label}>เก็บความเย็นได้นาน (ชม.)</Text>
            <TextInput
              style={styles.input}
              placeholder="24"
              placeholderTextColor="#94A3B8"
              value={ram}
              onChangeText={setRam}
            />

            <Text style={styles.label}>ลิงก์รูปภาพ</Text>
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              value={image}
              onChangeText={setImage}
            />

            <Text style={styles.label}>สถานะสินค้า</Text>
            <TextInput
              style={styles.input}
              placeholder="Available"
              placeholderTextColor="#94A3B8"
              value={status}
              onChangeText={setStatus}
            />

            <Text style={styles.label}>รายละเอียดสินค้า</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="คำอธิบายสินค้า..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            {/* [ADD PRODUCT BUTTON] ปุ่มบันทึกสินค้า */}
            <Pressable
              style={({ pressed }) => [styles.button, (pressed || saving) && styles.buttonPressed]}
              onPress={() => void saveProduct()}
              disabled={saving}
            >
              <Ionicons name={saving ? "sync" : "add-circle-outline"} size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {saving ? "กำลังบันทึก..." : "เพิ่มสินค้า"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// [ADD PRODUCT STYLES] รูปแบบหน้าเพิ่มสินค้า
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 70,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.text,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2FAFC",
  },

  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  form: {
    margin: 20,
    padding: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
    color: COLORS.text,
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    color: COLORS.text,
    backgroundColor: "#F8FCFD",
  },

  textArea: {
    height: 100,
    paddingVertical: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  button: {
    backgroundColor: COLORS.primary,
    marginTop: 30,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
  },

  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

});
