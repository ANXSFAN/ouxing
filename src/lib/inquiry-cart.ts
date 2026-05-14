// Simple inquiry cart using localStorage (like a shopping cart but for inquiries)

export interface InquiryCartItem {
  productId: string;
  variantId: string | null;
  name: string;
  modelNumber: string;
  imageUrl?: string;
  quantity: number;
  expectedPrice?: number;
}

const STORAGE_KEY = "sysled_inquiry_cart";

/** Stable key for matching a cart line — distinguishes variants of the same product. */
export function cartKey(productId: string, variantId: string | null | undefined): string {
  return `${productId}::${variantId ?? ""}`;
}

export function getCartItems(): InquiryCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const items = data ? (JSON.parse(data) as InquiryCartItem[]) : [];
    // Legacy carts may lack variantId; normalize so downstream code can rely on it.
    return items.map((i) => ({ ...i, variantId: i.variantId ?? null }));
  } catch {
    return [];
  }
}

export function setCartItems(items: InquiryCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("inquiry-cart-change"));
}

export function addToCart(item: Omit<InquiryCartItem, "quantity" | "expectedPrice">) {
  const items = getCartItems();
  const key = cartKey(item.productId, item.variantId);
  const existing = items.find((i) => cartKey(i.productId, i.variantId) === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }
  setCartItems(items);
}

export function removeFromCart(productId: string, variantId: string | null = null) {
  const key = cartKey(productId, variantId);
  setCartItems(getCartItems().filter((i) => cartKey(i.productId, i.variantId) !== key));
}

export function updateCartItem(
  productId: string,
  variantId: string | null,
  updates: Partial<InquiryCartItem>,
) {
  const items = getCartItems();
  const key = cartKey(productId, variantId);
  const item = items.find((i) => cartKey(i.productId, i.variantId) === key);
  if (item) Object.assign(item, updates);
  setCartItems(items);
}

export function clearCart() {
  setCartItems([]);
}

export function getCartCount(): number {
  return getCartItems().length;
}
