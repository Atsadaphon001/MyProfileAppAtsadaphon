// ช่องค้นหาสินค้า
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type SortOrder = "none" | "asc" | "desc";

// [SEARCH PROPS] ค่าที่ส่งเข้าคอมโพเนนต์ค้นหาและเรียงราคา
interface ProductSearchProps {
  value: string;
  isMobile: boolean;
  sortOrder: SortOrder;
  onChangeText: (text: string) => void;
  onToggleSort: () => void;
}

// [SEARCH COMPONENT] ช่อง Search และปุ่ม Sort ราคา
export function ProductSearch({ value, isMobile, sortOrder, onChangeText, onToggleSort }: ProductSearchProps) {
  return (
    <View style={[styles.row, isMobile && styles.rowMobile]}>
      <View style={[styles.searchBox, isMobile && styles.searchBoxMobile]}>
        <Ionicons name="search" size={18} color="#5F7480" />
        <TextInput
          placeholder="ค้นหาแก้ว ChillCup..."
          placeholderTextColor="#5F7480"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
        {value !== "" && (
          <TouchableOpacity onPress={() => onChangeText("")}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.sortButton} onPress={onToggleSort} activeOpacity={0.7}>
        <Ionicons
          name={sortOrder === "desc" ? "arrow-down" : sortOrder === "asc" ? "arrow-up" : "swap-vertical"}
          size={16}
          color="#0E7490"
        />
      </TouchableOpacity>
    </View>
  );
}

// [SEARCH STYLES] รูปแบบช่องค้นหาและปุ่มเรียงราคา
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowMobile: { alignItems: "stretch" },
  searchBox: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, borderColor: "#D7E5EA", backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 9 },
  searchBoxMobile: { minWidth: 0 },
  input: { flex: 1, color: "#163247", fontSize: 14 },
  sortButton: { width: 46, height: 46, borderRadius: 13, borderWidth: 1, borderColor: "#D7E5EA", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
});
