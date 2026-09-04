import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { PolarBearMark } from "../components/polar-bear-mark";
import { API_AUTH_URL, API_BASE_URL } from "../constants/api";
import { addToCart, getCartCount, getProductStock, getSession, setSession } from "../constants/store";

import {
  ActivityIndicator,
  Alert,
  Animated,
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
const COLORS = {
  primary: "#00a8b1",
  primaryDark: "#0E7490",
  primaryLight: "#67E8F9",
  accent: "#06B6D4",
  background: "#F4F9FB",
  surface: "#FFFFFF",
  border: "#D7E5EA",
  text: "#163247",
  textSecondary: "#5F7480",
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

const demoProducts: Product[] = [
  {
    id: 1,
    product_name: "ChillCup Arctic 500ml",
    brand: "ChillCup",
    category: "แก้วเก็บความเย็น",
    color: "Ice Blue",
    storage: "500ml",
    price: 399,
    stock: 18,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 2,
    product_name: "FrostPeak Tumbler 900ml",
    brand: "FrostPeak",
    category: "แก้วเก็บความเย็น",
    color: "Matte Black",
    storage: "900ml",
    price: 699,
    stock: 12,
    image: "https://images.unsplash.com/photo-1594700406777-45f8f9e6f2f3?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 3,
    product_name: "BreezeMate Daily Cup 350ml",
    brand: "BreezeMate",
    category: "แก้วกาแฟ",
    color: "Cloud White",
    storage: "350ml",
    price: 259,
    stock: 24,
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 4,
    product_name: "PolarSip Travel Mug 450ml",
    brand: "PolarSip",
    category: "แก้วกาแฟ",
    color: "Sage Green",
    storage: "450ml",
    price: 489,
    stock: 15,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 5,
    product_name: "HydroNest Sport Bottle 750ml",
    brand: "HydroNest",
    category: "ขวดน้ำ",
    color: "Ocean Blue",
    storage: "750ml",
    price: 599,
    stock: 10,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 6,
    product_name: "MellowCup Pastel 600ml",
    brand: "MellowCup",
    category: "แก้วเก็บความเย็น",
    color: "Lavender",
    storage: "600ml",
    price: 449,
    stock: 20,
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 7,
    product_name: "Summit Lock Tumbler 1200ml",
    brand: "Summit Lock",
    category: "แก้วเก็บความเย็น",
    color: "Forest Green",
    storage: "1200ml",
    price: 899,
    stock: 7,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 8,
    product_name: "UrbanChill Slim 400ml",
    brand: "UrbanChill",
    category: "แก้วกาแฟ",
    color: "Rose Pink",
    storage: "400ml",
    price: 329,
    stock: 16,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 9,
    product_name: "Alpine Steel Cup 500ml",
    brand: "Alpine",
    category: "แก้วเก็บความเย็น",
    color: "Silver",
    storage: "500ml",
    price: 529,
    stock: 9,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 10,
    product_name: "SunnyDay Kids Bottle 420ml",
    brand: "SunnyDay",
    category: "ขวดน้ำ",
    color: "Sunshine Yellow",
    storage: "420ml",
    price: 299,
    stock: 22,
    image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 11,
    product_name: "NightOwl Coffee Tumbler 380ml",
    brand: "NightOwl",
    category: "แก้วกาแฟ",
    color: "Charcoal",
    storage: "380ml",
    price: 379,
    stock: 14,
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 12,
    product_name: "CoralWave Straw Cup 700ml",
    brand: "CoralWave",
    category: "แก้วเก็บความเย็น",
    color: "Coral",
    storage: "700ml",
    price: 649,
    stock: 11,
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 13,
    product_name: "Terra Ceramic Chill 320ml",
    brand: "Terra",
    category: "แก้วกาแฟ",
    color: "Terracotta",
    storage: "320ml",
    price: 429,
    stock: 8,
    image: "https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 14,
    product_name: "AquaVault Flip Bottle 1000ml",
    brand: "AquaVault",
    category: "ขวดน้ำ",
    color: "Aqua",
    storage: "1000ml",
    price: 759,
    stock: 6,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 15,
    product_name: "CloudNine Double Wall 550ml",
    brand: "CloudNine",
    category: "แก้วเก็บความเย็น",
    color: "Cream",
    storage: "550ml",
    price: 579,
    stock: 13,
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 16,
    product_name: "VoyageSeal Commuter 420ml",
    brand: "VoyageSeal",
    category: "แก้วเดินทาง",
    color: "Midnight Blue",
    storage: "420ml",
    price: 559,
    stock: 10,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 17,
    product_name: "TrailFlow Active Bottle 800ml",
    brand: "TrailFlow",
    category: "สายออกกำลังกาย",
    color: "Arctic Cyan",
    storage: "800ml",
    price: 629,
    stock: 14,
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 18,
    product_name: "ChillCap Replacement Lid",
    brand: "ChillCup",
    category: "อุปกรณ์เสริม",
    color: "Clear Ice",
    storage: "Universal",
    price: 189,
    stock: 30,
    image: "https://images.unsplash.com/photo-1589365278144-c9e705f843ba?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 19,
    product_name: "RoamReady Handle Tumbler 600ml",
    brand: "RoamReady",
    category: "แก้วเดินทาง",
    color: "Stone Grey",
    storage: "600ml",
    price: 729,
    stock: 8,
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 20,
    product_name: "PulseGrip Shaker 700ml",
    brand: "PulseGrip",
    category: "สายออกกำลังกาย",
    color: "Graphite",
    storage: "700ml",
    price: 479,
    stock: 18,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
  {
    id: 21,
    product_name: "SipSteel Metal Straw Set",
    brand: "ChillCup",
    category: "อุปกรณ์เสริม",
    color: "Steel",
    storage: "3 pieces",
    price: 149,
    stock: 25,
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=600&auto=format&fit=crop",
    status: "Available",
  },
];

const LOCAL_ACCOUNTS_KEY = "chillcup-local-accounts";

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;
  const [webAccessGranted, setWebAccessGranted] = useState(Platform.OS !== "web");
  const [cartCount, setCartCount] = useState(getCartCount());
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<number>>(new Set());
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselVisibility = useRef(new Animated.Value(1)).current;
  const carouselSlideMotion = useRef(new Animated.Value(1)).current;
  const lastScrollOffset = useRef(0);
  const backgroundMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const hasWebAccess = sessionStorage.getItem("chillcup-web-access") === "granted";
    if (hasWebAccess) {
      setWebAccessGranted(true);
    } else {
      router.replace("/login");
    }
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundMotion, { toValue: 1, duration: 4500, useNativeDriver: true }),
        Animated.timing(backgroundMotion, { toValue: 0, duration: 4500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [backgroundMotion]);
  // Navigation & Menu Drawer States
  const [activeTab, setActiveTab] = useState<"Home" | "Add" | "Products" | "Categories">("Products");
  const [menuVisible, setMenuVisible] = useState(false);

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSession()?.user || null);
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
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});

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
      if (getSession()?.token === "demo-session") {
        const localProducts = demoProducts.map((product) => ({
          ...product,
          stock: getProductStock(product.id, product.stock),
        }));
        setProducts(localProducts);
        filterData(searchQuery, localProducts);
        return;
      }
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`ไม่สามารถโหลดข้อมูลสินค้าได้ (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("รูปแบบข้อมูล Products ไม่ถูกต้อง");
      }
      const productsWithLocalStock = data.map((product: Product) => ({
        ...product,
        stock: getProductStock(product.id, product.stock),
      }));
      setProducts(productsWithLocalStock);
      filterData(searchQuery, productsWithLocalStock);
    } catch (error) {
      const localProducts = demoProducts.map((product) => ({
        ...product,
        stock: getProductStock(product.id, product.stock),
      }));
      setProducts(localProducts);
      filterData(searchQuery, localProducts);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  // ======================================
  // SEARCH & FILTER
  // ======================================
  function filterData(text: string, list: Product[]) {
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
  }

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

  const changeCartQuantity = (product: Product, change: number) => {
    const stock = Math.max(0, product.stock ?? 0);
    setCartQuantities((previous) => {
      const current = previous[product.id] || 1;
      return { ...previous, [product.id]: Math.max(1, Math.min(stock || 1, current + change)) };
    });
  };

  const addProductToCart = (product: Product) => {
    if ((product.stock ?? 0) < 1) {
      showAlert("สินค้าหมด", "สินค้านี้ไม่มีในสต็อกแล้ว");
      return;
    }
    const quantity = cartQuantities[product.id] || 1;
    addToCart(product, quantity);
    setCartCount(getCartCount());
    showAlert("เพิ่มลงตะกร้าแล้ว", `${product.product_name} x ${quantity}`);
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  const visibleProducts = filteredProducts
    .filter((p) => selectedCategory === "All" || p.category === selectedCategory)
    .sort((a, b) => {
      if (sortOrder === "asc") return (a.price ?? 0) - (b.price ?? 0);
      if (sortOrder === "desc") return (b.price ?? 0) - (a.price ?? 0);
      return 0;
    });

  useEffect(() => {
    if (visibleProducts.length < 2) return;
    const timer = setInterval(() => {
      setSlideIndex((current) => (current + 1) % Math.min(visibleProducts.length, 5));
    }, 4200);
    return () => clearInterval(timer);
  }, [visibleProducts.length]);

  useEffect(() => {
    carouselSlideMotion.setValue(0);
    Animated.timing(carouselSlideMotion, {
      toValue: 1,
      duration: 620,
      easing: (value) => value * (2 - value),
      useNativeDriver: true,
    }).start();
  }, [carouselSlideMotion, slideIndex]);

  if (!webAccessGranted) {
    return <View style={styles.loadingContainer} />;
  }

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

    // Keep the local demo flow usable when the optional backend/MySQL is offline.
    if (isLoginMode) {
      const demoUsername = authUsername.trim().toLowerCase();
      const savedDemoPassword = typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(`chillcup-password-${demoUsername}`) || demoUsername
        : demoUsername;
      if ((demoUsername === "admin" || demoUsername === "user") && authPassword === savedDemoPassword) {
        const demoUser: User = demoUsername === "admin"
          ? { id: 0, username: "admin", name: "Administrator", role: "admin" }
          : { id: 1, username: "user", name: "Demo Customer", role: "user" };
        setSession(demoUser, "demo-session");
        setCurrentUser(demoUser);
        setAuthModalVisible(false);
        resetAuthForm();
        showAlert("สำเร็จ", `เข้าสู่ระบบเรียบร้อย ยินดีต้อนรับ ${demoUser.name}`);
        setAuthLoading(false);
        return;
      }
    }

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
        const signedInUser = data.user || { id: 1, username: authUsername };
        setSession(signedInUser, data.token || "");
        setCurrentUser(signedInUser);
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
      if (typeof sessionStorage !== "undefined") {
        const savedAccounts = sessionStorage.getItem(LOCAL_ACCOUNTS_KEY);
        const accounts: Array<{ username: string; email: string; password: string }> = savedAccounts
          ? JSON.parse(savedAccounts)
          : [];
        const username = authUsername.trim().toLowerCase();
        const localAccount = accounts.find((account) => account.username === username);

        if (isLoginMode && localAccount && localAccount.password === authPassword) {
          const localUser: User = { id: Date.now(), username: localAccount.username, email: localAccount.email, name: localAccount.username, role: "user" };
          setSession(localUser, "local-session");
          setCurrentUser(localUser);
          setAuthModalVisible(false);
          resetAuthForm();
          showAlert("สำเร็จ", `เข้าสู่ระบบเรียบร้อย ยินดีต้อนรับ ${localUser.username}`);
          return;
        }

        if (!isLoginMode && !localAccount) {
          accounts.push({ username, email: authEmail.trim(), password: authPassword });
          sessionStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
          showAlert("สมัครสมาชิกสำเร็จ", "สร้างบัญชีในโหมดออฟไลน์แล้ว สามารถเข้าสู่ระบบได้ทันที");
          setIsLoginMode(true);
          setAuthEmail("");
          setAuthPassword("");
          setAuthConfirmPassword("");
          return;
        }
      }
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
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.removeItem("chillcup-session");
        sessionStorage.removeItem("chillcup-web-access");
      }
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
      if (getSession()?.token === "demo-session") {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setFilteredProducts((prev) => prev.filter((p) => p.id !== id));
        showAlert("สำเร็จ", "ลบสินค้าเรียบร้อยแล้ว");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(getSession()?.token ? { Authorization: `Bearer ${getSession()?.token}` } : {}) },
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

      if (getSession()?.token === "demo-session") {
        if (editingProduct) {
          const updatedProduct = { ...editingProduct, ...payload, id: editingProduct.id };
          setProducts((prev) => prev.map((product) => product.id === editingProduct.id ? updatedProduct : product));
          setFilteredProducts((prev) => prev.map((product) => product.id === editingProduct.id ? updatedProduct : product));
          showAlert("สำเร็จ", "แก้ไขสินค้าเรียบร้อยแล้ว");
        } else {
          const newProduct = { ...payload, id: Date.now(), created_at: new Date().toISOString() } as Product;
          setProducts((prev) => [newProduct, ...prev]);
          setFilteredProducts((prev) => [newProduct, ...prev]);
          showAlert("สำเร็จ", "เพิ่มสินค้าเรียบร้อยแล้ว");
        }
        setModalVisible(false);
        setEditingProduct(null);
        setForm({ ...emptyForm });
        return;
      }

      if (!editingProduct) {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(getSession()?.token ? { Authorization: `Bearer ${getSession()?.token}` } : {}) },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
        showAlert("เพิ่มสินค้าสำเร็จ", `Product ID: ${data.productId || data.id || "บันทึกสมบูรณ์"}`);
      } else {
        const response = await fetch(`${API_BASE_URL}/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(getSession()?.token ? { Authorization: `Bearer ${getSession()?.token}` } : {}) },
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
    <Pressable
      style={[styles.card, !isMobile && styles.cardGrid, !isMobile && { width: width < 1100 ? "31.5%" : "23.5%" }, (item.stock ?? 0) < 1 && styles.cardOutOfStock, hoveredProductId === item.id && styles.cardFocused]}
      onHoverIn={() => setHoveredProductId(item.id)}
      onHoverOut={() => setHoveredProductId(null)}
    >
      <TouchableOpacity
        style={[styles.cardContent, !isMobile && styles.cardContentGrid]}
        onPress={() => openProductDetail(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.thumbnailWrap, !isMobile && styles.thumbnailWrapGrid]}>
          <Image
            source={
              item.image && item.image.startsWith("http") && !failedImageIds.has(item.id)
                ? { uri: item.image }
                : { uri: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop" }
            }
            style={[styles.thumbnail, !isMobile && styles.thumbnailGrid, hoveredProductId === item.id && styles.thumbnailFocused]}
            resizeMode="cover"
            onError={() => setFailedImageIds((previous) => new Set(previous).add(item.id))}
          />
          {(item.stock ?? 0) < 1 && <View style={styles.outOfStockImageShade}><Text style={styles.outOfStockImageText}>หมดแล้ว</Text></View>}

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
                  (item.stock ?? 0) < 1 && styles.outOfStockBadge,
                  {
                    backgroundColor:
                      item.status === "Available" || item.status === "Active"
                        ? COLORS.badgeBg
                        : COLORS.danger,
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {(item.stock ?? 0) < 1 ? "หมดแล้ว" : item.status === "Available" ? "Active" : item.status || "Active"}
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

          <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>

          {/* ACTION BUTTONS */}
          <View style={styles.actionRow}>
            {currentUser?.role !== "admin" && <View style={styles.purchaseControls}>
              <View style={[styles.quantityControl, (item.stock ?? 0) < 1 && styles.quantityControlDisabled]}>
                <TouchableOpacity style={styles.quantityButton} onPressIn={(event) => event.stopPropagation()} onPress={() => changeCartQuantity(item, -1)} disabled={(item.stock ?? 0) < 1}>
                  <Ionicons name="remove" size={15} color={COLORS.primaryDark} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{cartQuantities[item.id] || 1}</Text>
                <TouchableOpacity style={styles.quantityButton} onPressIn={(event) => event.stopPropagation()} onPress={() => changeCartQuantity(item, 1)} disabled={(item.stock ?? 0) < 1}>
                  <Ionicons name="add" size={15} color={COLORS.primaryDark} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.cartButton, (item.stock ?? 0) < 1 && styles.outOfStockButton]} onPressIn={(event) => event.stopPropagation()} onPress={() => addProductToCart(item)} disabled={(item.stock ?? 0) < 1} activeOpacity={0.7}>
                <Ionicons name="cart-outline" size={14} color="#fff" />
                <Text style={styles.buttonText}>{(item.stock ?? 0) < 1 ? "สินค้าหมด" : "ใส่ตะกร้า"}</Text>
              </TouchableOpacity>
            </View>}
            {currentUser?.role === "admin" && <>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditProduct(item)} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={14} color="#fff" />
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteButton, deletingId === item.id && styles.deleteButtonDisabled]} onPress={() => handleDeleteConfirm(item)} disabled={deletingId === item.id} activeOpacity={0.7}>
                {deletingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <><Ionicons name="trash-outline" size={14} color="#fff" /><Text style={styles.buttonText}>Delete</Text></>}
              </TouchableOpacity>
            </>}
          </View>
        </View>
      </TouchableOpacity>
    </Pressable>
  );

  const slides = visibleProducts.slice(0, 5);
  const activeSlide = slides[slideIndex % Math.max(slides.length, 1)];

  const handleProductListScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const offset = event.nativeEvent.contentOffset.y;
    const direction = offset - lastScrollOffset.current;
    const reachedTop = offset <= 4;
    if (!reachedTop && Math.abs(direction) < 6) return;
    lastScrollOffset.current = offset;

    // Keep the hero hidden during a partial upward scroll; reveal it only at the top.
    if (!reachedTop && direction <= 0) return;

    Animated.timing(carouselVisibility, {
      toValue: reachedTop ? 1 : 0,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

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
      <View style={styles.animatedBackground} pointerEvents="none">
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbOne, {
          transform: [
            { translateX: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [-30, 65] }) },
            { translateY: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [0, 45] }) },
          ],
        }]} />
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbTwo, {
          transform: [
            { translateX: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [35, -50] }) },
            { translateY: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [20, -35] }) },
          ],
        }]} />
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbThree, {
          opacity: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] }),
        }]} />
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbFour, {
          transform: [
            { translateX: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [80, -40] }) },
            { translateY: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [-20, 80] }) },
          ],
        }]} />
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbFive, {
          transform: [
            { translateX: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [-30, 100] }) },
            { translateY: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [120, -30] }) },
          ],
        }]} />
        <Animated.View style={[styles.backgroundOrb, styles.backgroundOrbSix, {
          transform: [
            { translateX: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [70, -90] }) },
            { translateY: backgroundMotion.interpolate({ inputRange: [0, 1], outputRange: [40, 150] }) },
          ],
        }]} />
      </View>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

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
          <PolarBearMark size="small" />
          <View>
            <Text style={styles.headerTitle}>ChillCup</Text>
            <Text style={styles.headerSubtitle}>แก้วเก็บความเย็น</Text>
          </View>
        </View>

        <View style={styles.headerSpacer} />

        {/* PROFILE ICON */}
        <Pressable
          style={({ pressed }) => [
            styles.profileButton,
            currentUser && { backgroundColor: COLORS.badgeBg },
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => (currentUser ? router.push({ pathname: "/account" } as never) : setAuthModalVisible(true))}
          hitSlop={15}
        >
          <Ionicons name={currentUser ? "checkmark-circle" : "person"} size={16} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          onPress={() => currentUser?.role !== "admin" && router.push("/cart")}
          hitSlop={12}
        >
          {currentUser?.role !== "admin" && <Ionicons name="cart-outline" size={23} color={COLORS.text} />}
          {currentUser?.role !== "admin" && cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
        </Pressable>
      </View>

      {activeSlide && <Animated.View style={[styles.heroCarousel, {
        height: carouselVisibility.interpolate({ inputRange: [0, 1], outputRange: [0, 220] }),
        opacity: carouselVisibility,
        transform: [{ translateY: carouselVisibility.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) }],
      }]}>
        <View style={styles.heroBearMark}><PolarBearMark size="small" /></View>
        <Animated.View style={[styles.heroSlideLayer, {
          opacity: carouselSlideMotion,
          transform: [{ scale: carouselSlideMotion.interpolate({ inputRange: [0, 1], outputRange: [1.035, 1] }) }],
        }]}>
          <Image
            source={{ uri: activeSlide.image || "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=900&auto=format&fit=crop" }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>CHILLCUP FEATURED</Text>
            <Text style={styles.heroTitle} numberOfLines={2}>{activeSlide.product_name}</Text>
            <Text style={styles.heroMeta}>{activeSlide.brand || "ChillCup"} · ฿{Number(activeSlide.price).toLocaleString()}</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => openProductDetail(activeSlide)} activeOpacity={0.8}>
              <Text style={styles.heroButtonText}>ดูรายละเอียด</Text><Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.carouselDots}>
            {slides.map((slide, index) => <Pressable key={slide.id} onPress={() => setSlideIndex(index)} style={[styles.carouselDot, index === slideIndex % slides.length && styles.carouselDotActive]} />)}
          </View>
        </Animated.View>
      </Animated.View>}

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

        {currentUser?.role === "admin" && <TouchableOpacity style={styles.addButton} onPress={openAddProduct} activeOpacity={0.8}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>}

        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonLoading]}
          onPress={() => void fetchProducts()}
          disabled={loading}
          activeOpacity={0.65}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="รีเฟรชรายการสินค้า"
        >
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="refresh" size={18} color={COLORS.primary} />}
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
          key={isMobile ? "products-1" : width < 1100 ? "products-3" : "products-4"}
          data={visibleProducts}
          style={styles.productList}
          numColumns={isMobile ? 1 : width < 1100 ? 3 : 4}
          columnWrapperStyle={!isMobile ? styles.productRow : undefined}
          showsVerticalScrollIndicator={true}
          onScroll={handleProductListScroll}
          scrollEventThrottle={16}
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
        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/home")} activeOpacity={0.7}>
          <Ionicons
            name="home-outline"
            size={22}
            color={activeTab === "Home" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.navText, activeTab === "Home" && { color: COLORS.primary, fontWeight: "700" }]}>
            หน้าแรก
          </Text>
        </TouchableOpacity>

        {currentUser?.role === "admin" && <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("Add");
            router.push("/add");
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-outline" size={24} color={COLORS.primary} />
          <Text style={[styles.navText, { color: COLORS.primary, fontWeight: "700" }]}>เพิ่ม</Text>
        </TouchableOpacity>}

        <TouchableOpacity style={styles.navItem} onPress={() => {
          setActiveTab("Products");
          router.replace("/");
        }} activeOpacity={0.7}>
          <MaterialIcons
            name="inventory-2"
            size={22}
            color={activeTab === "Products" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.navText, activeTab === "Products" && { color: COLORS.primary, fontWeight: "700" }]}>
            สินค้า
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => router.replace("/categories")} activeOpacity={0.7}>
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
                  router.replace("/home");
                }}
              >
                <Ionicons name="home-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.menuItemText}>หน้าแรก</Text>
              </TouchableOpacity>

              {currentUser?.role === "admin" && <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({ pathname: "/admin-orders" } as never);
                }}
              >
                <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>ตรวจสอบการชำระเงิน</Text>
              </TouchableOpacity>}

              {currentUser?.role !== "admin" && <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({ pathname: "/track-order" } as never);
                }}
              >
                <Ionicons name="navigate-circle-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>ติดตามคำสั่งซื้อ</Text>
              </TouchableOpacity>}

              {currentUser?.role !== "admin" && <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({ pathname: "/purchase-history" } as never);
                }}
              >
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>ประวัติการซื้อ</Text>
              </TouchableOpacity>}

              {currentUser && <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push({ pathname: "/account" } as never);
                }}
              >
                <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.menuItemText, { color: COLORS.primary }]}>จัดการบัญชี</Text>
              </TouchableOpacity>}

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
  animatedBackground: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  backgroundOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  backgroundOrbOne: {
    width: 330,
    height: 330,
    top: -160,
    right: -80,
    backgroundColor: "#A7E8EA",
    opacity: 0.28,
  },
  backgroundOrbTwo: {
    width: 280,
    height: 280,
    bottom: 90,
    left: -150,
    backgroundColor: "#C8EEF0",
    opacity: 0.3,
  },
  backgroundOrbThree: {
    width: 190,
    height: 190,
    top: "42%",
    right: "18%",
    backgroundColor: "#D9F7F5",
    opacity: 0.55,
  },
  backgroundOrbFour: {
    width: 240,
    height: 240,
    bottom: -90,
    right: 24,
    backgroundColor: "#FFE2C4",
    opacity: 0.38,
  },
  backgroundOrbFive: {
    width: 150,
    height: 150,
    top: "28%",
    left: "34%",
    backgroundColor: "#FFD6E7",
    opacity: 0.3,
  },
  backgroundOrbSix: {
    width: 120,
    height: 120,
    bottom: "18%",
    right: "34%",
    backgroundColor: "#D9D2FF",
    opacity: 0.26,
  },
  header: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 6,
  },
  headerSpacer: {
    flex: 1,
  },
  heroCarousel: {
    height: 220,
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.primaryDark,
    ...Platform.select({ web: { cursor: "pointer" as any } }),
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroSlideLayer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  heroBearMark: {
    position: "absolute",
    top: 16,
    right: 18,
    zIndex: 4,
    opacity: 0.96,
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(4, 40, 58, 0.48)",
  },
  heroCopy: {
    position: "absolute",
    left: 22,
    top: 24,
    maxWidth: 390,
  },
  heroEyebrow: {
    color: "#A7F3F0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 8,
  },
  heroMeta: {
    color: "#D5FAFA",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 7,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
  },
  heroButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },
  carouselDots: {
    position: "absolute",
    right: 18,
    bottom: 16,
    flexDirection: "row",
    gap: 7,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  carouselDotActive: {
    width: 23,
    backgroundColor: "#A7F3F0",
  },
  brandIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8EEAF0",
    shadowColor: "#0E7490",
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primaryDark,
    lineHeight: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#477584",
    fontWeight: "600",
  },
  iconButton: {
    padding: 6,
    position: "relative",
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
    marginRight: 14,
  },
  cartBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  searchRow: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
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
    backgroundColor: "#F3F8FA",
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
    backgroundColor: "#EAF5F6",
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
    backgroundColor: "#EAF5F6",
    borderWidth: 1,
    borderColor: "#BDEEF2",
    zIndex: 5,
    ...Platform.select({ web: { cursor: "pointer" as any } }),
  },
  refreshButtonLoading: {
    opacity: 0.7,
  },
  chipRow: {
    backgroundColor: COLORS.surface,
    maxHeight: 44,
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chip: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF5F6",
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
    maxWidth: 1120,
    alignSelf: "center",
  },
  productRow: {
    gap: 12,
    alignItems: "stretch",
  },
  card: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#73D5E3",
    shadowColor: "#39B9CC",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    ...Platform.select({
      web: { transitionDuration: "180ms", cursor: "pointer" as any },
    }),
  },
  cardGrid: {
    flexGrow: 0,
    flexShrink: 0,
    marginVertical: 6,
    padding: 10,
    minHeight: 382,
    borderWidth: 2,
  },
  cardFocused: {
    borderColor: COLORS.primaryLight,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    transform: [{ scale: 1.015 }],
    elevation: 5,
  },
  cardOutOfStock: {
    backgroundColor: "#FFF8F3",
    borderColor: "#F6B38A",
  },
  cardContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardContentGrid: {
    flex: 1,
    flexDirection: "column",
  },
  thumbnailWrap: {
    position: "relative",
    marginRight: 14,
  },
  thumbnailWrapGrid: {
    width: "100%",
    height: 158,
    marginRight: 0,
    marginBottom: 8,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#EAF5F6",
  },
  thumbnail: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: "#F3F8FA",
    ...Platform.select({
      web: { transitionDuration: "180ms" },
    }),
  },
  thumbnailGrid: {
    width: "100%",
    height: 158,
    marginRight: 0,
  },
  thumbnailFocused: {
    transform: [{ scale: 1.08 }],
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  outOfStockImageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(190, 72, 35, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockImageText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    backgroundColor: "#C2410C",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  favoriteButton: {
    position: "absolute",
    top: -6,
    right: -6,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#DDF8F7",
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
    minWidth: 0,
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
    backgroundColor: "#EAF5F6",
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
  outOfStockBadge: {
    backgroundColor: "#C2410C",
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
    minHeight: 42,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
  },
  purchaseControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  quantityControl: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: "#F3F8FA",
    overflow: "hidden",
  },
  quantityControlDisabled: {
    opacity: 0.45,
  },
  quantityButton: {
    width: 28,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ web: { cursor: "pointer" as any } }),
  },
  quantityText: {
    minWidth: 22,
    textAlign: "center",
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
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
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    ...Platform.select({
      web: { cursor: "pointer" as any },
    }),
  },
  outOfStockButton: {
    backgroundColor: "#C2410C",
    opacity: 0.7,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: "#F8FBFC",
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
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  detailImageBox: {
    width: "100%",
    height: 180,
    backgroundColor: "#F3F8FA",
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