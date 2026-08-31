import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

// ======================================
// Backend API Configuration
// ======================================
const API_BASE_URL = "http://119.59.102.161:3101/api/products";
const API_AUTH_URL = "http://119.59.102.161:3101/api";

const COLORS = {
  primary: "#00a8b1",
  primaryDark: "#0E7490",
  primaryLight: "#67E8F9",
  accent: "#06B6D4",
  background: "#F0FBFF",
  surface: "#FFFFFF",
  border: "#DCF2F8",
  text: "#0F2A37",
  textSecondary: "#5B7C89",
  badgeBg: "#10B981",
  warning: "#F59E0B",
  danger: "#FF6B6B",
  favorite: "#F472B6",
};

interface Product {
  id: number;
  product_name: string;
  price: number;
  stock: number;
  created_at?: string;

  productCode?: string;
  brand?: string;
  category?: string;
  color?: string;
  storage?: string;
  ram?: string;
  image?: string;
  description?: string;
  status?: string;
}

interface ProductForm {
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  color: string;
  storage: string;
  ram: string;
  image: string;
  description: string;
  status: string;
}

interface User {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role?: string;
}

const emptyForm: ProductForm = {
  productCode: "",
  productName: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  color: "",
  storage: "",
  ram: "",
  image: "",
  description: "",
  status: "Available",
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // Navigation & Menu Drawer States
  const [activeTab, setActiveTab] = useState<"Home" | "Add" | "Products" | "Categories">("Products");
  const [menuVisible, setMenuVisible] = useState(false);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form States สำหรับ Register/Login
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Products States
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Extras: Favorites, Categories, Sort
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"none" | "asc" | "desc">("none");

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Helper Alert
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ======================================
  // GET PRODUCTS
  // ======================================
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`ไม่สามารถโหลดข้อมูลสินค้าได้ (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("รูปแบบข้อมูล Products ไม่ถูกต้อง");
      }
      setProducts(data);
      filterData(searchQuery, data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ======================================
  // SEARCH & FILTER
  // ======================================
  const filterData = (text: string, list: Product[]) => {
    if (!text.trim()) {
      setFilteredProducts(list);
      return;
    }
    const keyword = text.toLowerCase().trim();
    const filtered = list.filter(
      (item) =>
        item.product_name?.toLowerCase().includes(keyword) ||
        item.category?.toLowerCase().includes(keyword) ||
        item.brand?.toLowerCase().includes(keyword) ||
        item.productCode?.toLowerCase().includes(keyword)
    );
    setFilteredProducts(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterData(text, products);
  };

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  const visibleProducts = filteredProducts
    .filter((p) => selectedCategory === "All" || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortOrder === "asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sortOrder === "desc") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  // ======================================
  // AUTHENTICATION HANDLERS (FIXED)
  // ======================================
  const resetAuthForm = () => {
    setAuthUsername("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthConfirmPassword("");
  };

  const handleAuthSubmit = async () => {
    // 1. ตรวจสอบข้อมูลเบื้องต้นฝั่ง Client
    if (isLoginMode) {
      if (!authUsername.trim() || !authPassword.trim()) {
        showAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอก Username และ Password");
        return;
      }
    } else {
      if (!authUsername.trim()) {
        showAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอก Username");
        return;
      }
      if (!authEmail.trim()) {
        showAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอก Email");
        return;
      }
      if (!authPassword) {
        showAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอก Password");
        return;
      }
      if (authPassword !== authConfirmPassword) {
        showAlert("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจสอบ Password อีกครั้ง");
        return;
      }
    }

    setAuthLoading(true);

    const endpoint = isLoginMode ? "/login" : "/register";
    const payload = isLoginMode
      ? {
          username: authUsername.trim(),
          password: authPassword,
        }
      : {
          username: authUsername.trim(),
          email: authEmail.trim(),
          password: authPassword,
          name: authUsername.trim(), // แนบ name ไปด้วยเพื่อให้ตรงตาม server.js
        };

    try {
      // 2. ยิง API ไปที่ Backend
      const response = await fetch(`${API_AUTH_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // อ่าน JSON Response ออกมา
      const data = await response.json().catch(() => ({}));

      // 3. ถ้า HTTP Status ไม่ใช่ 200/201 (เช่น HTTP 400 Bad Request หรือ 401 Unauthorized)
      if (!response.ok) {
        const errorMessage = data.message || `เกิดข้อผิดพลาด (${response.status})`;
        showAlert("ไม่สามารถดำเนินการได้", errorMessage);
        return;
      }

      // 4. กรณีดำเนินการสำเร็จ
      if (isLoginMode) {
        setCurrentUser(data.user || { id: 1, username: authUsername });
        setAuthModalVisible(false);
        resetAuthForm();
        showAlert("สำเร็จ", `เข้าสู่ระบบเรียบร้อย ยินดีต้อนรับ ${data.user?.name || authUsername}`);
      } else {
        showAlert("สมัครสมาชิกสำเร็จ", data.message || "สามารถเข้าสู่ระบบด้วยบัญชีใหม่ได้ทันที");
        setIsLoginMode(true);
        setAuthPassword("");
        setAuthConfirmPassword("");
      }
    } catch (error) {
      console.error("Auth error:", error);
      showAlert(
        "เชื่อมต่อไม่สำเร็จ",
        "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่าย"
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    const logoutAction = () => {
      setCurrentUser(null);
      showAlert("ออกจากระบบ", "คุณได้ออกจากระบบเรียบร้อยแล้ว");
    };

    if (Platform.OS === "web") {
      if (confirm("คุณต้องการออกจากระบบหรือไม่?")) logoutAction();
    } else {
      Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ออกจากระบบ", style: "destructive", onPress: logoutAction },
      ]);
    }
  };

  // ======================================
  // DELETE PRODUCT
  // ======================================
  const handleDeleteConfirm = (product: Product) => {
    const message = `คุณต้องการลบสินค้า "${product.product_name}" ใช่หรือไม่?`;

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) {
        executeDeleteProduct(product.id);
      }
      return;
    }

    Alert.alert("ยืนยันการลบสินค้า", message, [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ลบสินค้า", style: "destructive", onPress: () => executeDeleteProduct(product.id) },
    ]);
  };

  const executeDeleteProduct = async (id: number) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setFilteredProducts((prev) => prev.filter((p) => p.id !== id));
      showAlert("สำเร็จ", "ลบสินค้าเรียบร้อยแล้ว");
    } catch (error) {
      console.error("Delete product error:", error);
      showAlert("เกิดข้อผิดพลาด", error instanceof Error ? error.message : "ไม่สามารถลบสินค้าได้");
    } finally {
      setDeletingId(null);
    }
  };

  // ======================================
  // FORM & MODAL HANDLERS
  // ======================================
  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setModalVisible(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setForm({
      productCode: product.productCode || "",
      productName: product.product_name || "",
      brand: product.brand || "",
      category: product.category || "",
      price: product.price !== null && product.price !== undefined ? String(product.price) : "",
      stock: product.stock !== null && product.stock !== undefined ? String(product.stock) : "",
      color: product.color || "",
      storage: product.storage || "",
      ram: product.ram || "",
      image: product.image || "",
      description: product.description || "",
      status: product.status || "Available",
    });
    setModalVisible(true);
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setEditingProduct(null);
    setForm({ ...emptyForm });
  };

  const saveProduct = async () => {
    if (!form.productName.trim()) {
      showAlert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อสินค้า");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        product_name: form.productName.trim(),
        productCode: form.productCode.trim(),
        brand: form.brand.trim(),
        category: form.category.trim(),
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        color: form.color.trim(),
        storage: form.storage.trim(),
        ram: form.ram.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        status: form.status.trim() || "Available",
      };

      if (!editingProduct) {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
        showAlert("เพิ่มสินค้าสำเร็จ", `Product ID: ${data.productId || data.id || "บันทึกสมบูรณ์"}`);
      } else {
        const response = await fetch(`${API_BASE_URL}/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
        showAlert("แก้ไขสินค้าสำเร็จ", `แก้ไขข้อมูลสินค้าเรียบร้อย`);
      }

      setModalVisible(false);
      setEditingProduct(null);
      setForm({ ...emptyForm });
      await fetchProducts();
    } catch (error) {
      console.error("Save product error:", error);
      showAlert("เกิดข้อผิดพลาด", error instanceof Error ? error.message : "ไม่สามารถบันทึกสินค้าได้");
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // RENDER PRODUCT ITEM
  // ======================================
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => openProductDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailWrap}>
          <Image
            source={
              item.image && item.image.startsWith("http")
                ? { uri: item.image }
                : { uri: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop" }
            }
            style={styles.thumbnail}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={favoriteIds.has(item.id) ? "heart" : "heart-outline"}
              size={15}
              color={favoriteIds.has(item.id) ? COLORS.favorite : "#94A3B8"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardTopRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.priceText}>฿{Number(item.price ?? 0).toLocaleString()}</Text>
              <View style={styles.tagRow}>
                {!!item.storage && (
                  <View style={styles.tag}>
                    <Ionicons name="water-outline" size={11} color={COLORS.primaryDark} />
                    <Text style={styles.tagText}>{item.storage}</Text>
                  </View>
                )}
                {!!item.ram && (
                  <View style={styles.tag}>
                    <Ionicons name="snow-outline" size={11} color={COLORS.primaryDark} />
                    <Text style={styles.tagText}>เย็น {item.ram}</Text>
                  </View>
                )}
                {!!item.color && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.color}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.infoText}>{item.category || "ChillCup"} · {item.brand || "Unnamed Brand"}</Text>
            </View>

            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.status === "Available" || item.status === "Active"
                        ? COLORS.badgeBg
                        : COLORS.danger,
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.status === "Available" ? "Active" : item.status || "Active"}
                </Text>
              </View>
              {typeof item.stock === "number" && item.stock > 0 && item.stock <= 5 ? (
                <View style={[styles.badge, styles.lowStockBadge]}>
                  <Text style={styles.badgeText}>เหลือ {item.stock} ชิ้น</Text>
                </View>
              ) : (
                <Text style={styles.stockText}>Stock: {item.stock ?? 0}</Text>
              )}
            </View>
          </View>

          <Text style={styles.productName} numberOfLines={1}>{item.product_name}</Text>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openEditProduct(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={14} color="#fff" />
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                deletingId === item.id && styles.deleteButtonDisabled,
              ]}
              onPress={() => handleDeleteConfirm(item)}
              disabled={deletingId === item.id}
              activeOpacity={0.7}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={14} color="#fff" />
                  <Text style={styles.buttonText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderInput = (
    label: string,
    field: keyof ProductForm,
    placeholder: string,
    keyboardType: "default" | "numeric" | "decimal-pad" = "default"
  ) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={form[field]}
        onChangeText={(value) => updateForm(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          onPress={() => setMenuVisible(true)}
          hitSlop={15}
        >
          <Ionicons name="menu" size={24} color={COLORS.text} />
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Ionicons name="snow" size={18} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>ChillCup</Text>
            <Text style={styles.headerSubtitle}>แก้วเก็บความเย็น</Text>
          </View>
        </View>

        {/* PROFILE ICON */}
        <Pressable
          style={({ pressed }) => [
            styles.profileButton,
            currentUser && { backgroundColor: COLORS.badgeBg },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => (currentUser ? handleLogout() : setAuthModalVisible(true))}
          hitSlop={15}
        >
          <Ionicons name={currentUser ? "checkmark-circle" : "person"} size={16} color="#fff" />
        </Pressable>
      </View>

      {/* SEARCH ROW */}
      <View style={[styles.searchRow, isMobile && styles.searchRowMobile]}>
        <View style={[styles.searchBox, isMobile && styles.searchBoxMobile]}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            placeholder="ค้นหาแก้ว ChillCup..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() =>
            setSortOrder((prev) => (prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"))
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name={sortOrder === "desc" ? "arrow-down" : sortOrder === "asc" ? "arrow-up" : "swap-vertical"}
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={openAddProduct} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton} onPress={fetchProducts} activeOpacity={0.7}>
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* CATEGORY CHIPS */}
      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* PRODUCT LIST */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleProducts}
          style={styles.productList}
          showsVerticalScrollIndicator={true}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 80,
            flexGrow: 1,
          }}
          renderItem={renderProduct}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="ice-cream-outline" size={40} color={COLORS.primaryLight} />
              <Text style={styles.emptyStateTitle}>ไม่พบสินค้า</Text>
              <Text style={styles.emptyStateText}>ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะ</Text>
            </View>
          }
        />
      )}

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Home")} activeOpacity={0.7}>
          <Ionicons
            name="home-outline"
            size={22}
            color={activeTab === "Home" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.navText, activeTab === "Home" && { color: COLORS.primary, fontWeight: "700" }]}>
            หน้าแรก
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("Add");
            openAddProduct();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-outline" size={24} color={COLORS.primary} />
          <Text style={[styles.navText, { color: COLORS.primary, fontWeight: "700" }]}>เพิ่ม</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Products")} activeOpacity={0.7}>
          <MaterialIcons
            name="inventory-2"
            size={22}
            color={activeTab === "Products" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.navText, activeTab === "Products" && { color: COLORS.primary, fontWeight: "700" }]}>
            สินค้า
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Categories")} activeOpacity={0.7}>
          <Ionicons
            name="folder-outline"
            size={22}
            color={activeTab === "Categories" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.navText, activeTab === "Categories" && { color: COLORS.primary, fontWeight: "700" }]}>
            หมวดหมู่
          </Text>
        </TouchableOpacity>
      </View>

      {/* DETAIL MODAL */}
      <Modal
        visible={detailModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>รายละเอียดสินค้า</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView style={{ padding: 18 }}>
                <View style={styles.detailImageBox}>
                  <Image
                    source={
                      selectedProduct.image && selectedProduct.image.startsWith("http")
                        ? { uri: selectedProduct.image }
                        : { uri: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop" }
                    }
                    style={styles.detailImage}
                  />
                </View>

                <Text style={styles.detailTitle}>{selectedProduct.product_name}</Text>
                <Text style={styles.detailPrice}>
                  ฿{Number(selectedProduct.price ?? 0).toLocaleString()}
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>แบรนด์:</Text>
                  <Text style={styles.detailValue}>{selectedProduct.brand || "-"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>หมวดหมู่:</Text>
                  <Text style={styles.detailValue}>{selectedProduct.category || "-"}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>จำนวนในสต็อก:</Text>
                  <Text style={styles.detailValue}>{selectedProduct.stock ?? 0} ชิ้น</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>สถานะ:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: selectedProduct.status === "Available" ? COLORS.badgeBg : COLORS.danger },
                    ]}
                  >
                    {selectedProduct.status || "Available"}
                  </Text>
                </View>

                <Text style={[styles.detailLabel, { marginTop: 12 }]}>รายละเอียด:</Text>
                <Text style={styles.detailDescription}>
                  {selectedProduct.description || "ไม่มีรายละเอียดสินค้า"}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setDetailModalVisible(false)}>
              <Text style={styles.closeDetailText}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD / EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContainer, isMobile && styles.modalContainerMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close" size={26} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              {renderInput("รหัสสินค้า", "productCode", "CC-001")}
              {renderInput("ชื่อสินค้า *", "productName", "ChillCup Classic 500ml")}
              {renderInput("แบรนด์", "brand", "ChillCup")}
              {renderInput("หมวดหมู่", "category", "แก้วเก็บความเย็น")}
              {renderInput("ราคา (บาท)", "price", "0", "decimal-pad")}
              {renderInput("สต็อก", "stock", "0", "numeric")}
              {renderInput("สี", "color", "Ice Blue")}
              {renderInput("ความจุ", "storage", "500ml")}
              {renderInput("เก็บความเย็นได้นาน (ชม.)", "ram", "24")}
              {renderInput("ลิงก์รูปภาพ", "image", "https://...")}
              {renderInput("สถานะ", "status", "Available")}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>รายละเอียดสินค้า</Text>
                <TextInput
                  style={[styles.formInput, styles.descriptionInput]}
                  value={form.description}
                  onChangeText={(value) => updateForm("description", value)}
                  placeholder="เช่น วัสดุสแตนเลส 304, ฝาล็อกกันหก, เก็บเย็นได้นาน 24 ชม."
                  placeholderTextColor="#94A3B8"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveProduct}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingProduct ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* AUTHENTICATION (LOGIN & REGISTER) MODAL */}
      <Modal
        visible={authModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContainer, { maxWidth: 420 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isLoginMode ? "Sign In" : "Register"}</Text>
              <TouchableOpacity
                onPress={() => {
                  setAuthModalVisible(false);
                  resetAuthForm();
                }}
                disabled={authLoading}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 18 }} keyboardShouldPersistTaps="handled">
              {/* 1. Username (ใช้ทั้ง Login & Register) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>1. Username *</Text>
                <TextInput
                  style={styles.formInput}
                  value={authUsername}
                  onChangeText={setAuthUsername}
                  placeholder="กรอกชื่อผู้ใช้ (Username)"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
              </View>

              {/* 2. Email (แสดงเฉพาะตอน Register) */}
              {!isLoginMode && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>2. Email *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    placeholder="example@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* 3. Password (ใช้ทั้ง Login & Register) */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{isLoginMode ? "Password *" : "3. Password *"}</Text>
                <TextInput
                  style={styles.formInput}
                  value={authPassword}
                  onChangeText={setAuthPassword}
                  placeholder="กรอกรหัสผ่าน"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />
              </View>

              {/* 4. Confirm Password (แสดงเฉพาะตอน Register) */}
              {!isLoginMode && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>4. ยืนยัน Password *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={authConfirmPassword}
                    onChangeText={setAuthConfirmPassword}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                  />
                </View>
              )}

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                style={[styles.saveButton, { marginHorizontal: 0, marginTop: 24 }, authLoading && styles.saveButtonDisabled]}
                onPress={handleAuthSubmit}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isLoginMode ? "Sign In" : "Register"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* TOGGLE MODE BUTTON */}
              <TouchableOpacity
                style={{ marginTop: 16, marginBottom: 8, alignItems: "center" }}
                onPress={() => {
                  setIsLoginMode(!isLoginMode);
                  resetAuthForm();
                }}
              >
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: "600" }}>
                  {isLoginMode
                    ? "ยังไม่มีบัญชี? สมัครสมาชิก (Register)"
                    : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ (Sign In)"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* SIDE DRAWER MENU */}
      <Modal visible={menuVisible} animationType="fade" transparent onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.menuDrawer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuUserRole}>
                  {currentUser ? (currentUser.name || currentUser.username).toUpperCase() : "GUEST"}
                </Text>
                <Text style={styles.menuSubTitle}>Navigation Menu</Text>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setActiveTab("Home");
                }}
              >
                <Ionicons name="home-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.menuItemText}>หน้าแรก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setActiveTab("Products");
                  fetchProducts();
                }}
              >
                <MaterialIcons name="inventory-2" size={20} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>สินค้า</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  setActiveTab("Categories");
                }}
              >
                <Ionicons name="folder-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.menuItemText}>หมวดหมู่</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={styles.menuLogoutBtn}
              onPress={() => {
                setMenuVisible(false);
                currentUser ? handleLogout() : setAuthModalVisible(true);
              }}
            >
              <Ionicons
                name={currentUser ? "log-out-outline" : "log-in-outline"}
                size={20}
                color={currentUser ? COLORS.danger : COLORS.primary}
              />
              <Text style={[styles.menuLogoutText, !currentUser && { color: COLORS.primary }]}>
                {currentUser ? "Logout" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ======================================
// STYLES
// ======================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.background,
  },
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  iconButton: {
    padding: 6,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  searchRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchRowMobile: {
    flexWrap: "wrap",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchBoxMobile: {
    width: "100%",
    flexBasis: "100%",
  },
  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 14,
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F7FA",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F7FA",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  chipRow: {
    backgroundColor: "#fff",
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEFBFE",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 7,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  chipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productList: {
    flex: 1,
    width: "100%",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#0891B2",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumbnailWrap: {
    position: "relative",
    marginRight: 14,
  },
  thumbnail: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: "#E6F7FB",
  },
  favoriteButton: {
    position: "absolute",
    top: -6,
    right: -6,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  cardDetails: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEFBFE",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  stockText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning,
    marginTop: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyStateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomNav: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  navText: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalContainerMobile: {
    width: "100%",
    maxHeight: "94%",
    borderRadius: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  formScroll: {
    paddingHorizontal: 18,
  },
  formGroup: {
    marginTop: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  formInput: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  descriptionInput: {
    height: 80,
    paddingTop: 10,
  },
  saveButton: {
    margin: 18,
    height: 46,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  detailModalContainer: {
    width: "100%",
    maxWidth: 450,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  detailImageBox: {
    width: "100%",
    height: 180,
    backgroundColor: "#EEFBFE",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    padding: 10,
  },
  detailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  detailDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  closeDetailBtn: {
    margin: 16,
    height: 42,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  closeDetailText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    flexDirection: "row",
  },
  menuDrawer: {
    width: 260,
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuUserRole: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  menuSubTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  menuLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  menuLogoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.danger,
  },
});