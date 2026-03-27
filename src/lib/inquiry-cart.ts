// Simple inquiry cart using localStorage (like a shopping cart but for inquiries)

export interface InquiryCartItem {
  productId: string;
  name: string;
  modelNumber: string;
  imageUrl?: string;
  quantity: number;
  expectedPrice?: number;
}

const STORAGE_KEY = "sysled_inquiry_cart";

export function getCartItems(): InquiryCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }
  setCartItems(items);
}

export function removeFromCart(productId: string) {
  setCartItems(getCartItems().filter((i) => i.productId !== productId));
}

export function updateCartItem(productId: string, updates: Partial<InquiryCartItem>) {
  const items = getCartItems();
  const item = items.find((i) => i.productId === productId);
  if (item) Object.assign(item, updates);
  setCartItems(items);
}

export function clearCart() {
  setCartItems([]);
}

export function getCartCount(): number {
  return getCartItems().length;
}
