import { NextResponse } from "next/server";
import { stripe, TIER_PRICES, DELIVERY_TYPE_PRICES } from "@/lib/stripe";
import type { DeliveryType } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

interface CartItemPayload {
  id: string;
  recipientName: string;
  relationship: string;
  occasionType: string;
  occasionLabel: string;
  occasionDate: string;
  years: number;
  tier: string;
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
  letterContent: string;
  unitPrice: number;
  totalPrice: number;
}

interface LetterItemPayload {
  id: string;
  itemType: "letter";
  recipientName: string;
  recipientEmail: string;
  letterType: "annual" | "milestone";
  deliveryType: DeliveryType;
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

interface VoiceItemPayload {
  id: string;
  itemType: "voice";
  audioQuantity: number;
  videoQuantity: number;
  unitPriceAudio: number;
  unitPriceVideo: number;
  totalPrice: number;
}

interface VaultItemPayload {
  id: string;
  itemType: "vault";
  audioCredits: number;
  videoCredits: number;
  unitPriceAudio: number;
  unitPriceVideo: number;
  totalPrice: number;
}

interface GiftCreditItemPayload {
  id: string;
  itemType: "gift_credit";
  tier: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isGifted?: boolean;
  giftRecipientName?: string;
  giftRecipientEmail?: string;
  giftMessage?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Get affiliate code from request header instead of cookies (cookies() can hang)
    const affiliateCode = request.headers.get("cookie")?.match(/sfg_affiliate=([^;]+)/)?.[1] || "";
    const { items, letterItems, voiceItems, vaultItems, giftCreditItems, email, fullName } = body as {
      items: CartItemPayload[];
      letterItems?: LetterItemPayload[];
      voiceItems?: VoiceItemPayload[];
      vaultItems?: VaultItemPayload[];
      giftCreditItems?: GiftCreditItemPayload[];
      email: string;
      fullName: string;
    };

    // Check if user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const hasGifts = items && items.length > 0;
    const hasLetters = letterItems && letterItems.length > 0;
    const hasVoice = voiceItems && voiceItems.length > 0;
    const hasVault = vaultItems && vaultItems.length > 0;
    const hasGiftCredits = giftCreditItems && giftCreditItems.length > 0;

    if (!hasGifts && !hasLetters && !hasVoice && !hasVault && !hasGiftCredits) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate all items and build Stripe line items
    const lineItems = [];

    // Gift line items
    if (hasGifts) {
      for (const item of items) {
        const tierInfo = TIER_PRICES[item.tier];
        if (!tierInfo) {
          return NextResponse.json(
            { error: `Invalid tier: ${item.tier}` },
            { status: 400 }
          );
        }

        const LETTER_ADDON_CENTS = 800; // $8/yr in cents
        const giftTotal = tierInfo.price * item.years;
        const letterTotal = item.addLetter ? LETTER_ADDON_CENTS * item.years : 0;
        const itemTotal = giftTotal + letterTotal;

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tierInfo.name} Gift Plan — ${item.recipientName} (${item.years} yr${item.years > 1 ? "s" : ""})${item.addLetter ? " + Letter" : ""}`,
              description: `${tierInfo.description} for ${item.recipientName} (${item.occasionType})`,
            },
            unit_amount: itemTotal,
          },
          quantity: 1,
        });
      }
    }

    // Letter line items
    if (hasLetters) {
      for (const letter of letterItems) {
        const deliveryInfo = DELIVERY_TYPE_PRICES[letter.deliveryType];
        if (!deliveryInfo) {
          return NextResponse.json(
            { error: `Invalid delivery type: ${letter.deliveryType}` },
            { status: 400 }
          );
        }

        const quantityLabel =
          letter.letterType === "annual"
            ? `${letter.quantity} yr${letter.quantity > 1 ? "s" : ""}`
            : `${letter.quantity} letter${letter.quantity > 1 ? "s" : ""}`;

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Legacy Letter — ${letter.recipientName} (${quantityLabel})`,
              description: `${deliveryInfo.label} for ${letter.recipientName}`,
            },
            unit_amount: letter.totalPrice,
          },
          quantity: 1,
        });
      }
    }

    // Voice message line items
    if (hasVoice) {
      for (const voice of voiceItems) {
        if (voice.audioQuantity > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Audio Messages (${voice.audioQuantity})`,
                description: `${voice.audioQuantity} audio message${voice.audioQuantity > 1 ? "s" : ""} at $5/yr each`,
              },
              unit_amount: 500,
            },
            quantity: voice.audioQuantity,
          });
        }
        if (voice.videoQuantity > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Video Messages (${voice.videoQuantity})`,
                description: `${voice.videoQuantity} video message${voice.videoQuantity > 1 ? "s" : ""} at $10/yr each`,
              },
              unit_amount: 1000,
            },
            quantity: voice.videoQuantity,
          });
        }
      }
    }

    // Vault credit line items
    if (hasVault) {
      for (const vault of vaultItems) {
        if (vault.audioCredits > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Vault Audio Credits (${vault.audioCredits})`,
                description: `${vault.audioCredits} audio credit${vault.audioCredits > 1 ? "s" : ""} at $5 each`,
              },
              unit_amount: 500,
            },
            quantity: vault.audioCredits,
          });
        }
        if (vault.videoCredits > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: `Vault Video Credits (${vault.videoCredits})`,
                description: `${vault.videoCredits} video credit${vault.videoCredits > 1 ? "s" : ""} at $10 each`,
              },
              unit_amount: 1000,
            },
            quantity: vault.videoCredits,
          });
        }
      }
    }

    // Gift credit line items
    if (hasGiftCredits) {
      for (const gc of giftCreditItems) {
        const productName = gc.isGifted
          ? `Gift: ${gc.tierName} Gift Credit for ${gc.giftRecipientName}`
          : `${gc.tierName} Gift Credit (${gc.quantity})`;
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: `${gc.quantity} ${gc.tierName} gift credit${gc.quantity > 1 ? "s" : ""} at $${(gc.unitPrice / 100).toFixed(0)} each`,
            },
            unit_amount: gc.unitPrice,
          },
          quantity: gc.quantity,
        });
      }
    }

    // Serialize cart items to metadata (chunked for Stripe's 500-char limit)
    const cartJson = JSON.stringify(items || []);
    const metadataChunks: Record<string, string> = {};
    const CHUNK_SIZE = 490;
    for (let i = 0; i < cartJson.length; i += CHUNK_SIZE) {
      metadataChunks[`cart_items_${Math.floor(i / CHUNK_SIZE)}`] = cartJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    // Serialize letter items to metadata (chunked)
    const letterJson = JSON.stringify(letterItems || []);
    for (let i = 0; i < letterJson.length; i += CHUNK_SIZE) {
      metadataChunks[`letter_items_${Math.floor(i / CHUNK_SIZE)}`] = letterJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    // Serialize voice items to metadata (chunked)
    const voiceJson = JSON.stringify(voiceItems || []);
    for (let i = 0; i < voiceJson.length; i += CHUNK_SIZE) {
      metadataChunks[`voice_items_${Math.floor(i / CHUNK_SIZE)}`] = voiceJson.slice(
        i,
        i + CHUNK_SIZE
      );
    }

    // Calculate total voice audio and video counts
    let totalVoiceAudio = 0;
    let totalVoiceVideo = 0;
    if (hasVoice) {
      for (const voice of voiceItems) {
        totalVoiceAudio += voice.audioQuantity || 0;
        totalVoiceVideo += voice.videoQuantity || 0;
      }
    }

    // Calculate total vault credits
    let totalVaultAudio = 0;
    let totalVaultVideo = 0;
    if (hasVault) {
      for (const vault of vaultItems) {
        totalVaultAudio += vault.audioCredits || 0;
        totalVaultVideo += vault.videoCredits || 0;
      }
    }

    // Serialize gift credit items for metadata (include gifted fields)
    const giftCreditsJson = hasGiftCredits
      ? JSON.stringify(giftCreditItems.map((gc) => ({
          tier: gc.tier,
          quantity: gc.quantity,
          unitPrice: gc.unitPrice,
          isGifted: gc.isGifted || false,
          giftRecipientName: gc.giftRecipientName || "",
          giftRecipientEmail: gc.giftRecipientEmail || "",
          giftMessage: gc.giftMessage || "",
        })))
      : "";
    if (giftCreditsJson) {
      for (let i = 0; i < giftCreditsJson.length; i += CHUNK_SIZE) {
        metadataChunks[`gift_credits_${Math.floor(i / CHUNK_SIZE)}`] = giftCreditsJson.slice(
          i,
          i + CHUNK_SIZE
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: email,
      metadata: {
        isCartOrder: "true",
        userId: user?.id || "",
        email: email || "",
        fullName: fullName || "",
        itemCount: (items?.length || 0).toString(),
        letterItemCount: (letterItems?.length || 0).toString(),
        voiceItemCount: (voiceItems?.length || 0).toString(),
        voiceAudio: totalVoiceAudio.toString(),
        voiceVideo: totalVoiceVideo.toString(),
        vaultAudioCredits: totalVaultAudio.toString(),
        vaultVideoCredits: totalVaultVideo.toString(),
        giftCreditItemCount: (giftCreditItems?.length || 0).toString(),
        affiliate_code: affiliateCode,
        ...metadataChunks,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Cart checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
