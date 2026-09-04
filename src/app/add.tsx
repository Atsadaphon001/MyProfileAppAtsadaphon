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
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../constants/api";
import { getSession } from "../constants/store";

const COLORS = {
  primary: "#ff0000",
  background: "#ffffff",
  surface: "#8cc490",
  border: "#1900ff",
  text: "#0F172A",
  textSecondary: "#64748B",
};

export default function AddScreen() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (getSession()?.user.role !== "admin") router.replace("/");
  }, []);

  const saveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้าและราคา");
      return;
    }

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
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          Add Product
        </Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={styles.form}>

        <Text style={styles.label}>
          Product Name
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nike Air Max"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>
          Brand
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nike"
          value={brand}
          onChangeText={setBrand}
        />

        <Text style={styles.label}>
          Price
        </Text>

        <TextInput
          style={styles.input}
          placeholder="3900"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.label}>
          Image URL
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={image}
          onChangeText={setImage}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={saveProduct}
        >
          <Text style={styles.buttonText}>
            Save Product
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },

  form: {
    padding: 20,
  },

  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 12,
    color: COLORS.text,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },

  button: {
    backgroundColor: COLORS.primary,
    marginTop: 30,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

});