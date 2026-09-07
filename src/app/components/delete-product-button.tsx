// ปุ่มลบสินค้า
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";

// [DELETE PROPS] ค่าที่ส่งเข้าปุ่มลบสินค้า
interface DeleteProductButtonProps {
  loading: boolean;
  onPress: () => void;
}

// [DELETE BUTTON] ปุ่ม Delete สำหรับ Admin พร้อมสถานะกำลังลบ
export function DeleteProductButton({ loading, onPress }: DeleteProductButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.disabled]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name="trash-outline" size={14} color="#fff" />
          <Text style={styles.text}>Delete</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// [DELETE STYLES] รูปแบบปุ่มลบสินค้า
const styles = StyleSheet.create({
  button: { width: 86, height: 36, borderRadius: 6, backgroundColor: "#FF6B6B", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  disabled: { opacity: 0.7 },
  text: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
