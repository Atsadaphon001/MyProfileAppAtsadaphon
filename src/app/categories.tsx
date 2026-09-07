// หน้าหมวดหมู่สินค้า
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getSession } from "../constants/store";

// [CATEGORIES] หน้าหมวดหมู่สินค้า
const COLORS = {
  primary: "#00A8B1",
  deep: "#0E7490",
  background: "rgba(244, 251, 253, 0.88)",
  border: "#CBEAF0",
  text: "#0F2A37",
  muted: "#63818D",
  ice: "#E8FAFC",
};

// [CATEGORY DATA] รายการหมวดหมู่และไอคอน
const categories = [
  { name: "แก้วกาแฟ", description: "จิบกาแฟร้อนหรือเย็นได้ทุกวัน", icon: "cafe-outline" as const },
  { name: "แก้วเก็บความเย็น", description: "รักษาอุณหภูมิได้นานหลายชั่วโมง", icon: "snow-outline" as const },
  { name: "ขวดน้ำ", description: "พกพาง่าย จุน้ำได้มากขึ้น", icon: "water-outline" as const },
  { name: "แก้วเดินทาง", description: "ฝาปิดแน่น เหมาะกับการเดินทาง", icon: "car-outline" as const },
  { name: "สายออกกำลังกาย", description: "พร้อมเติมความสดชื่นทุกกิจกรรม", icon: "fitness-outline" as const },
  { name: "อุปกรณ์เสริม", description: "ฝา หลอด และอะไหล่สำหรับแก้วใบโปรด", icon: "construct-outline" as const },
];

export default function CategoriesScreen() {
  // [CATEGORY SCREEN] แสดงหมวดหมู่และการนำทาง
  const isAdmin = getSession()?.user.role === "admin";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.eyebrow}>CHILLCUP COLLECTION</Text>
          <Text style={styles.title}>หมวดหมู่สินค้า</Text>
        </View>

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.list}>
        {categories.map((item) => (
          <TouchableOpacity key={item.name} style={styles.card} activeOpacity={0.78} onPress={() => router.replace({ pathname: "/", params: { category: item.name } })}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={25} color={COLORS.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          <View style={styles.arrowWrap}>
            <Ionicons name="chevron-forward" size={19} color={COLORS.deep} />
          </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/home")}>
          <Ionicons name="home-outline" size={22} color="#64748B" />
          <Text style={styles.navText}>หน้าแรก</Text>
        </TouchableOpacity>
        {isAdmin && <TouchableOpacity style={styles.navItem} onPress={() => router.push("/add")}>
            <Ionicons name="add-outline" size={24} color={COLORS.primary} />
          <Text style={styles.navText}>เพิ่ม</Text>
        </TouchableOpacity>}
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/")}>
          <MaterialIcons name="inventory-2" size={22} color="#64748B" />
          <Text style={styles.navText}>สินค้า</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/categories")}>
          <Ionicons name="folder" size={22} color={COLORS.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>หมวดหมู่</Text>
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

  list: {
    flex: 1,
    paddingTop: 4,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  eyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.deep,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.ice,
    justifyContent: "center",
    alignItems: "center",
  },

  copy: {
    flex: 1,
    marginLeft: 13,
  },

  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },

  description: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
  },

  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.ice,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#DCF2F8",
    paddingVertical: 8,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
  },

  navText: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
  },

  navTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});
