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
  isProfessional: boolean;
  recipientIndustry: string;
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
  deliveryType: "digital" | "physical" | "physical_photo";
  deliveryLabel: string;
  quantity: number;
  unitPrice: number;  // cents per letter
  totalPrice: number; // cents
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
   Voice Cart
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VoiceCartItem {
  id: string;
  itemType: "voice";
  audioQuantity: number;
  videoQuantity: number;
  unitPriceAudio: number; // 500 cents
  unitPriceVideo: number; // 1000 cents
  totalPrice: number; // cents
}

const VOICE_CART_KEY = "sfg_voice_cart";

export function getVoiceCart(): VoiceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VOICE_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addVoiceToCart(item: Omit<VoiceCartItem, "id">): VoiceCartItem {
  const cart = getVoiceCart();
  const newItem: VoiceCartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(VOICE_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeVoiceFromCart(id: string): void {
  const cart = getVoiceCart().filter((item) => item.id !== id);
  localStorage.setItem(VOICE_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearVoiceCart(): void {
  localStorage.removeItem(VOICE_CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getVoiceCartTotal(): number {
  return getVoiceCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getVoiceCartCount(): number {
  return getVoiceCart().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Cart
   ═══════════════════════════════════════════════════════════════════════════ */

export interface VaultCartItem {
  id: string;
  itemType: "vault";
  audioCredits: number;
  videoCredits: number;
  unitPriceAudio: number; // 500 cents
  unitPriceVideo: number; // 1000 cents
  totalPrice: number; // cents
}

const VAULT_CART_KEY = "sfg_vault_cart";

export function getVaultCart(): VaultCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VAULT_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addVaultToCart(item: Omit<VaultCartItem, "id">): VaultCartItem {
  const cart = getVaultCart();
  const newItem: VaultCartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(VAULT_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeVaultFromCart(id: string): void {
  const cart = getVaultCart().filter((item) => item.id !== id);
  localStorage.setItem(VAULT_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearVaultCart(): void {
  localStorage.removeItem(VAULT_CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getVaultCartTotal(): number {
  return getVaultCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getVaultCartCount(): number {
  return getVaultCart().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gift Credit Cart
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GiftCreditCartItem {
  id: string;
  itemType: "gift_credit";
  tier: string; // starter/classic/premium/deluxe/legacy
  tierName: string;
  quantity: number;
  unitPrice: number; // cents
  totalPrice: number; // cents
  isGifted?: boolean;
  giftRecipientName?: string;
  giftRecipientEmail?: string;
  giftMessage?: string;
}

const GIFT_CREDIT_CART_KEY = "sfg_gift_credits_cart";

export function getGiftCreditCart(): GiftCreditCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GIFT_CREDIT_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGiftCreditToCart(item: Omit<GiftCreditCartItem, "id">): GiftCreditCartItem {
  const cart = getGiftCreditCart();
  const newItem: GiftCreditCartItem = { ...item, id: generateId() };
  cart.push(newItem);
  localStorage.setItem(GIFT_CREDIT_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
  return newItem;
}

export function removeGiftCreditFromCart(id: string): void {
  const cart = getGiftCreditCart().filter((item) => item.id !== id);
  localStorage.setItem(GIFT_CREDIT_CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function clearGiftCreditCart(): void {
  localStorage.removeItem(GIFT_CREDIT_CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function getGiftCreditCartTotal(): number {
  return getGiftCreditCart().reduce((sum, item) => sum + item.totalPrice, 0);
}

export function getGiftCreditCartCount(): number {
  return getGiftCreditCart().length;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Combined Cart helpers
   ═══════════════════════════════════════════════════════════════════════════ */

export function getCombinedCartCount(): number {
  return getCartCount() + getLetterCartCount() + getVoiceCartCount() + getVaultCartCount() + getGiftCreditCartCount();
}

export function getCombinedCartTotal(): number {
  // Gift cart totals are in dollars; letter + voice + vault + gift credit cart totals are in cents
  return getCartTotal() + getLetterCartTotal() / 100 + getVoiceCartTotal() / 100 + getVaultCartTotal() / 100 + getGiftCreditCartTotal() / 100;
}
