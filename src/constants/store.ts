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
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  tracking_code: string;
  created_at: string;
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

let session: { user: SessionUser; token: string } | null = null;
let cart: CartItem[] = [];
let demoOrders: DemoOrder[] = [];
const stockOverrides = new Map<number, number>();
let ordersHydrated = false;
let stockHydrated = false;

function hydrateStockOverrides() {
  if (stockHydrated || typeof sessionStorage === "undefined") return;
  stockHydrated = true;
  const saved = sessionStorage.getItem("chillcup-stock-overrides");
  if (!saved) return;
  try {
    const entries = JSON.parse(saved) as Array<[number, number]>;
    entries.forEach(([id, stock]) => stockOverrides.set(Number(id), Number(stock)));
  } catch { stockOverrides.clear(); }
}

function persistStockOverrides() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("chillcup-stock-overrides", JSON.stringify(Array.from(stockOverrides.entries())));
  }
}

function hydrateDemoOrders() {
  if (ordersHydrated || typeof sessionStorage === "undefined") return;
  ordersHydrated = true;
  const saved = sessionStorage.getItem("chillcup-demo-orders");
  if (!saved) return;
  try { demoOrders = JSON.parse(saved); } catch { demoOrders = []; }
}

function persistDemoOrders() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("chillcup-demo-orders", JSON.stringify(demoOrders));
  }
}

export function setSession(user: SessionUser, token = "") {
  session = { user, token };
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
  return cart;
}

export function addToCart(product: CartProduct, quantity = 1) {
  const safeQuantity = Math.max(1, Math.min(quantity, product.stock));
  const existing = cart.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + safeQuantity, product.stock);
  } else if (product.stock > 0) {
    cart = [...cart, { product, quantity: safeQuantity }];
  }
}

export function updateCartQuantity(productId: number, quantity: number) {
  cart = cart
    .map((item) => item.product.id === productId
      ? { ...item, quantity: Math.max(0, Math.min(quantity, item.product.stock)) }
      : item)
    .filter((item) => item.quantity > 0);
}

export function clearCart() {
  cart = [];
}

export function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getProductStock(productId: number, fallback: number) {
  hydrateStockOverrides();
  return stockOverrides.has(productId) ? stockOverrides.get(productId)! : fallback;
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
  const id = Date.now();
  demoOrders = [{
    id,
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
  return demoOrders;
}

export function markDemoOrderPaid(id: number) {
  hydrateDemoOrders();
  demoOrders = demoOrders.map((order) => order.id === id ? { ...order, status: "processing" } : order);
  persistDemoOrders();
}

export function updateDemoOrderStatus(id: number, status: OrderStatus) {
  hydrateDemoOrders();
  demoOrders = demoOrders.map((order) => order.id === id ? { ...order, status } : order);
  persistDemoOrders();
}
