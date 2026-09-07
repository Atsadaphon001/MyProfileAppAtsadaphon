// หน้าเพิ่มสินค้า
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
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
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
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
          brand: brand.trim(),
          price: Number(price) || 0,
          image: image.trim(),
          stock: 0,
          status: "Available",
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
      <View style={styles.form}>

        <Text style={styles.label}>
          ชื่อสินค้า *
        </Text>

        <TextInput
          style={styles.input}
          placeholder="เช่น ChillCup Classic 500ml"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>
          แบรนด์
        </Text>

        <TextInput
          style={styles.input}
          placeholder="เช่น ChillCup"
          placeholderTextColor="#94A3B8"
          value={brand}
          onChangeText={setBrand}
        />

        <Text style={styles.label}>
          ราคา (บาท) *
        </Text>

        <TextInput
          style={styles.input}
          placeholder="0"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>
          ลิงก์รูปภาพ
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#94A3B8"
          value={image}
          onChangeText={setImage}
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

  button: {
    backgroundColor: COLORS.primary,
    marginTop: 22,
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
