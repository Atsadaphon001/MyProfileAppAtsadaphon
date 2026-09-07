export interface SessionUser {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface CartProduct {
  id: number;
  product_name: string;
  price: number;
  stock: number;
  image?: string;
  brand?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

export interface DemoOrder {
  id: number;
  owner_username: string;
  owner_id?: number;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  status_updated_at?: string;
  tracking_code: string;
  created_at: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

let session: { user: SessionUser; token: string } | null = null;
let cart: CartItem[] = [];
let demoOrders: DemoOrder[] = [];
const stockOverrides = new Map<number, number>();
const LOCAL_PRODUCT_CATALOG_KEY = "chillcup-local-product-catalog";
const ORDERS_KEY = "chillcup-orders";
const LEGACY_ORDERS_KEY = "chillcup-demo-orders";
const STOCK_KEY = "chillcup-stock-overrides";
let cartOwnerKey: string | null | undefined;
let ordersHydrated = false;
let stockHydrated = false;

function getActiveAccountKey() {
  const user = getSession()?.user;
  return user?.username ? user.username.trim().toLowerCase() : null;
}

function getCartStorageKey(accountKey: string) {
  return `chillcup-cart-${accountKey}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

function hydrateCart() {
  const accountKey = getActiveAccountKey();
  if (cartOwnerKey === accountKey) return;
  cartOwnerKey = accountKey;
  cart = accountKey ? readStorage<CartItem[]>(getCartStorageKey(accountKey), []) : [];
}

function persistCart() {
  const accountKey = getActiveAccountKey();
  if (accountKey && typeof localStorage !== "undefined") {
    localStorage.setItem(getCartStorageKey(accountKey), JSON.stringify(cart));
  }
}

function hydrateStockOverrides() {
  if (stockHydrated || typeof localStorage === "undefined") return;
  stockHydrated = true;
  const saved = localStorage.getItem(STOCK_KEY);
  if (!saved) return;
  try {
    const entries = JSON.parse(saved) as Array<[number, number]>;
    entries.forEach(([id, stock]) => stockOverrides.set(Number(id), Number(stock)));
  } catch { stockOverrides.clear(); }
}

function persistStockOverrides() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STOCK_KEY, JSON.stringify(Array.from(stockOverrides.entries())));
  }
}

// แคตตาล็อกสำหรับโหมดทดลอง: ทำให้หน้าสินค้าและหน้าวิเคราะห์ใช้ข้อมูลชุดเดียวกัน
export function getLocalProductCatalog<T extends { id: number }>(): T[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_PRODUCT_CATALOG_KEY) || "null");
    return Array.isArray(saved) ? saved as T[] : null;
  } catch {
    return null;
  }
}

export function saveLocalProductCatalog<T extends { id: number }>(products: T[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_PRODUCT_CATALOG_KEY, JSON.stringify(products));
  }
}

function hydrateDemoOrders() {
  if (ordersHydrated || typeof localStorage === "undefined") return;
  ordersHydrated = true;
  const legacyOrders = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(LEGACY_ORDERS_KEY) : null;
  const saved = localStorage.getItem(ORDERS_KEY) || legacyOrders;
  if (!saved) return;
  try { demoOrders = JSON.parse(saved); } catch { demoOrders = []; }
}

function persistDemoOrders() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(demoOrders));
  }
}

export function setSession(user: SessionUser, token = "") {
  session = { user, token };
  // บังคับให้โหลดตะกร้าของบัญชีที่เพิ่งเข้าสู่ระบบ ไม่ปะปนกับบัญชีก่อนหน้า
  cartOwnerKey = undefined;
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("chillcup-session", JSON.stringify(session));
  }
}

export function updateSessionUser(updates: Partial<SessionUser>) {
  const current = getSession();
  if (!current) return null;
  const nextUser = { ...current.user, ...updates };
  setSession(nextUser, current.token);
  return nextUser;
}

export function clearSession() {
  session = null;
  cart = [];
  cartOwnerKey = undefined;
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("chillcup-session");
}

export function getSession() {
  if (!session && typeof sessionStorage !== "undefined") {
    const saved = sessionStorage.getItem("chillcup-session");
    if (saved) {
      try { session = JSON.parse(saved); } catch { session = null; }
    }
  }
  return session;
}

export function getCart() {
  hydrateCart();
  return cart;
}

export function addToCart(product: CartProduct, quantity = 1) {
  hydrateCart();
  const safeQuantity = Math.max(1, Math.min(quantity, product.stock));
  const existing = cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + safeQuantity, product.stock);
  } else if (product.stock > 0) {
    cart = [...cart, { product, quantity: safeQuantity }];
  }
  persistCart();
}

export function updateCartQuantity(productId: number, quantity: number) {
  hydrateCart();
  cart = cart
    .map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stock)) }
      : item)
    .filter((item) => item.quantity > 0);
  persistCart();
}

export function clearCart() {
  hydrateCart();
  cart = [];
  persistCart();
}

export function getCartCount() {
  hydrateCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getProductStock(productId: number, fallback: number) {
  hydrateStockOverrides();
  return stockOverrides.has(productId) ? stockOverrides.get(productId)! : fallback;
}

export function setProductStock(productId: number, stock: number) {
  hydrateStockOverrides();
  stockOverrides.set(productId, Math.max(0, Math.floor(stock)));
  persistStockOverrides();
}

export function decreaseStock(items: CartItem[]) {
  hydrateStockOverrides();
  for (const item of items) {
    const currentStock = getProductStock(item.product.id, item.product.stock);
    stockOverrides.set(item.product.id, Math.max(0, currentStock - item.quantity));
  }
  persistStockOverrides();
}

export function addDemoOrder(items: CartItem[], customerName: string, phone: string, address: string, paymentMethod: string) {
  hydrateDemoOrders();
  const owner = getSession()?.user;
  if (!owner?.username) throw new Error("กรุณาเข้าสู่ระบบก่อนสร้างคำสั่งซื้อ");
  const id = Date.now();
  demoOrders = [{
    id,
    owner_username: owner.username.trim().toLowerCase(),
    owner_id: owner.id,
    customer_name: customerName,
    phone,
    address,
    payment_method: paymentMethod,
    items: items.map((item) => ({ ...item, product: { ...item.product } })),
    total: items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    status: "pending",
    tracking_code: `CC${String(id).slice(-8)}`,
    created_at: new Date().toISOString(),
  }, ...demoOrders];
  persistDemoOrders();
  return id;
}

export function getDemoOrders() {
  hydrateDemoOrders();
  advanceDemoOrderStatuses();
  const user = getSession()?.user;
  if (!user) return [];
  if (user.role === "admin") return demoOrders;
  const ownerKey = user.username.trim().toLowerCase();
  return demoOrders.filter((order) => order.owner_username?.trim().toLowerCase() === ownerKey);
}

export function markDemoOrderPaid(id: number) {
  if (getSession()?.user.role !== "admin") return;
  hydrateDemoOrders();
  demoOrders = demoOrders.map((order) => order.id === id && (order.status === "pending" || order.status === "awaiting_verification" as OrderStatus)
    ? { ...order, status: "processing", status_updated_at: new Date().toISOString() }
    : order);
  persistDemoOrders();
}

export function updateDemoOrderStatus(id: number, status: OrderStatus) {
  if (getSession()?.user.role !== "admin") return;
  hydrateDemoOrders();
  demoOrders = demoOrders.map((order) => order.id === id ? { ...order, status, status_updated_at: new Date().toISOString() } : order);
  persistDemoOrders();
}

// ให้เจ้าของออเดอร์เริ่มการจำลองสถานะใหม่ได้จากหน้าติดตามสินค้า
export function restartOrderSimulation(id: number) {
  hydrateDemoOrders();
  const user = getSession()?.user;
  if (!user) return false;
  const username = user.username.trim().toLowerCase();
  const canRestart = user.role === "admin" || demoOrders.some((order) => order.id === id && order.owner_username === username);
  if (!canRestart) return false;
  demoOrders = demoOrders.map((order) => order.id === id
    ? { ...order, status: "processing", status_updated_at: new Date().toISOString() }
    : order);
  persistDemoOrders();
  return true;
}

// สำหรับพรีเซนต์: หลัง Admin เริ่มดำเนินการ สถานะจะขยับทุก 5 วินาที
function advanceDemoOrderStatuses() {
  hydrateDemoOrders();
  const now = Date.now();
  let changed = false;
  demoOrders = demoOrders.map((order) => {
    const updatedAt = new Date(order.status_updated_at || order.created_at).getTime();
    if (now - updatedAt < 5_000) return order;
    if (order.status === "processing") {
      changed = true;
      return { ...order, status: "shipped", status_updated_at: new Date(now).toISOString() };
    }
    if (order.status === "shipped") {
      changed = true;
      return { ...order, status: "delivered", status_updated_at: new Date(now).toISOString() };
    }
    return order;
  });
  if (changed) persistDemoOrders();
}
