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
  addLetter: boolean;
  letterContent?: string;
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

/* ═══════════════════════════════════════════════════════════════════════════
   Letter Cart
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LetterCartItem {
  id: string;
  itemType: "letter";
  recipientName: string;
  recipientEmail: string;
  letterType: "annual" | "milestone";
  deliveryType: "digital" | "physical" | "physical_photo";
  quantity: number;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  unitPrice: number;
  totalPrice: number;
}

const LETTER_CART_KEY = "sfg_letter_cart";

export function getLetterCart(): LetterCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LETTER_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLetterToCart(item: Omit<LetterCartItem, "id">): LetterCartItem {
  const cart = getLetterCart();
  const newItem: LetterCartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(LETTER_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeLetterFromCart(id: string): void {
  const cart = getLetterCart().filter((item) => item.id !== id);
  localStorage.setItem(LETTER_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearLetterCart(): void {
  localStorage.removeItem(LETTER_CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getLetterCartTotal(): number {
  return getLetterCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getLetterCartCount(): number {
  return getLetterCart().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Voice Message Cart
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VoiceMessageCartItem {
  id: string;
  itemType: "voice-message";
  recipientName: string;
  recipientEmail: string;
  messageType: "annual" | "milestone";
  title: string;
  quantity: number;
  durationSeconds: number;
  unitPrice: number; // cents
  totalPrice: number; // cents
}

const VOICE_CART_KEY = "sfg_voice_cart";

export function getVoiceMessageCart(): VoiceMessageCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VOICE_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addVoiceMessageToCart(item: Omit<VoiceMessageCartItem, "id">): VoiceMessageCartItem {
  const cart = getVoiceMessageCart();
  const newItem: VoiceMessageCartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(VOICE_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeVoiceMessageFromCart(id: string): void {
  const cart = getVoiceMessageCart().filter((item) => item.id !== id);
  localStorage.setItem(VOICE_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearVoiceMessageCart(): void {
  localStorage.removeItem(VOICE_CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getVoiceMessageCartTotal(): number {
  return getVoiceMessageCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getVoiceMessageCartCount(): number {
  return getVoiceMessageCart().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Combined Cart helpers
   ═══════════════════════════════════════════════════════════════════════════ */

export function getCombinedCartCount(): number {
  return getCartCount() + getLetterCartCount() + getVoiceMessageCartCount();
}

export function getCombinedCartTotal(): number {
  // Gift cart totals are in dollars; letter + voice cart totals are in cents
  return getCartTotal() + getLetterCartTotal() / 100 + getVoiceMessageCartTotal() / 100;
}
