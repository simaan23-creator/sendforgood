import type { TierId } from "@/lib/constants";

export interface CartItem {
  id: string;
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionLabel: string;
  occasionDate: string;
  years: number;
  tier: TierId;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  recipientAge: string;
  recipientGender: string;
  interests: string;
  giftNotes: string;
  cardMessage: string;
  petType: string;
  executorName: string;
  executorEmail: string;
  executorPhone: string;
  executorAddress: string;
  unitPrice: number;
  totalPrice: number;
}

const CART_KEY = "sfg_cart";

function generateId(): string {
  return crypto.randomUUID();
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToCart(item: Omit<CartItem, "id">): CartItem {
  const cart = getCart();
  const newItem: CartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeFromCart(id: string): void {
  const cart = getCart().filter((item) => item.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getCartCount(): number {
  return getCart().length;
}
