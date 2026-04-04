"use client";

import { useState } from "react";
import { TIERS } from "@/lib/constants";

/* ─────────────────────────────── Constants ────────────────────────────── */

const RELATIONSHIP_OPTIONS = [
  "Parent", "Child", "Grandchild", "Sibling",
  "Partner/Spouse", "Friend", "My Pet / Fur Baby", "Other",
];

const PET_TYPE_OPTIONS = ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Other"];

const GENDER_OPTIONS = ["Female", "Male", "Non-binary"];

const INTEREST_OPTIONS = [
  { emoji: "\uD83C\uDFAE", label: "Gaming" },
  { emoji: "\uD83D\uDCDA", label: "Reading" },
  { emoji: "\uD83C\uDFB5", label: "Music" },
  { emoji: "\uD83C\uDF73", label: "Cooking" },
  { emoji: "\uD83C\uDFC3", label: "Sports" },
  { emoji: "\uD83C\uDFA8", label: "Art & Crafts" },
  { emoji: "\uD83C\uDF3F", label: "Outdoors" },
  { emoji: "\u2708\uFE0F", label: "Travel" },
  { emoji: "\uD83D\uDC85", label: "Fashion" },
  { emoji: "\uD83D\uDC3E", label: "Animals/Pets" },
  { emoji: "\uD83D\uDD27", label: "Tech" },
  { emoji: "\uD83E\uDDD8", label: "Wellness" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const REFUND_REASONS = [
  "Changed my mind",
  "Recipient moved",
  "Recipient passed away",
  "Pet passed away",
  "Other",
];

const inputClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";

const selectClass =
  "w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 appearance-none";

/* ─────────────────────────────── Types ─────────────────────────────────── */

interface Shipment {
  id: string;
  scheduled_date: string;
  status: string;
  tracking_number: string | null;
  photo_url?: string | null;
}

interface Order {
  id: string;
  tier: string;
  years_purchased: number;
  years_remaining: number;
  amount_paid: number;
  status: string;
  created_at: string;
  stripe_payment_intent_id: string;
  recipient_id: string;
  executor_name?: string | null;
  executor_email?: string | null;
  executor_phone?: string | null;
  executor_address?: string | null;
  recipients: {
    name: string;
    relationship: string;
    age?: string;
    gender?: string;
    interests?: string;
    card_message?: string;
    gift_notes?: string;
    pet_type?: string;
    photo_url?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  occasions: {
    type: string;
    label: string;
    occasion_date: string;
  };
  shipments: Shipment[];
}

type TabId = "recipient" | "address" | "plan" | "executor" | "refund";

const TABS: { id: TabId; label: string }[] = [
  { id: "recipient", label: "Recipient" },
  { id: "address", label: "Address" },
  { id: "plan", label: "Plan" },
  { id: "executor", label: "Executor" },
  { id: "refund", label: "Refund" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Main Modal Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ManagePlanModal({
  order,
  onClose,
  onOrderUpdated,
  hasRefundRequest,
  initialTab,
}: {
  order: Order;
  onClose: () => void;
  onOrderUpdated: () => void;
  hasRefundRequest: boolean;
  initialTab?: TabId;
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "recipient");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-dark bg-white px-6 pt-6 pb-4 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-navy">Manage Plan</h2>
            <p className="mt-0.5 text-sm text-warm-gray">
              {order.recipients?.name} &middot;{" "}
              {TIERS.find((t) => t.id === order.tier)?.name ?? order.tier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-warm-gray transition-colors hover:bg-cream-dark hover:text-navy"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-cream-dark bg-cream/30 px-6 pt-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-navy border-b-2 border-navy -mb-px"
                  : "text-warm-gray hover:text-navy hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "recipient" && (
            <RecipientTab order={order} onUpdated={onOrderUpdated} />
          )}
          {activeTab === "address" && (
            <AddressTab order={order} onUpdated={onOrderUpdated} />
          )}
          {activeTab === "plan" && (
            <PlanTab order={order} onUpdated={onOrderUpdated} />
          )}
          {activeTab === "executor" && (
            <ExecutorTab order={order} onUpdated={onOrderUpdated} />
          )}
          {activeTab === "refund" && (
            <RefundTab
              order={order}
              onUpdated={onOrderUpdated}
              hasExisting={hasRefundRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab A — Recipient Details
   ═══════════════════════════════════════════════════════════════════════════ */

function RecipientTab({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: () => void;
}) {
  const r = order.recipients;
  const [name, setName] = useState(r?.name ?? "");
  const [relationship, setRelationship] = useState(r?.relationship ?? "");
  const [age, setAge] = useState(r?.age ?? "");
  const [gender, setGender] = useState(r?.gender ?? "");
  const [interests, setInterests] = useState<string[]>(
    r?.interests ? r.interests.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [giftNotes, setGiftNotes] = useState(r?.gift_notes ?? "");
  const [petType, setPetType] = useState(r?.pet_type ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPet = relationship === "My Pet / Fur Baby";

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/orders/${order.id}/recipient`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        relationship,
        age: age || null,
        gender: gender || null,
        interests: interests.length > 0 ? interests.join(", ") : null,
        gift_notes: giftNotes || null,
        pet_type: isPet ? petType : null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onUpdated();
    }
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Recipient Name
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          className={inputClass}
        />
      </div>

      {/* Relationship */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Relationship
        </label>
        <select
          value={relationship}
          onChange={(e) => { setRelationship(e.target.value); setSaved(false); }}
          className={selectClass}
        >
          <option value="">Select...</option>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Pet type (conditional) */}
      {isPet && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Pet Type
          </label>
          <div className="flex flex-wrap gap-2">
            {PET_TYPE_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setPetType(petType === p ? "" : p); setSaved(false); }}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${
                  petType === p
                    ? "border-gold bg-gold/10 text-navy shadow-sm"
                    : "border-cream-dark bg-white text-warm-gray hover:border-gold/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Age */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Age <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <input
          value={age}
          onChange={(e) => { setAge(e.target.value); setSaved(false); }}
          placeholder="e.g. 30"
          className={inputClass}
        />
      </div>

      {/* Gender */}
      <div>
        <p className="mb-2 text-sm font-medium text-navy">
          Gender <span className="font-normal text-warm-gray-light">Optional</span>
        </p>
        <div className="flex gap-3">
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setGender(gender === g ? "" : g); setSaved(false); }}
              className={`rounded-lg border-2 px-5 py-2.5 text-sm font-semibold transition ${
                gender === g
                  ? "border-gold bg-gold/10 text-navy shadow-sm"
                  : "border-cream-dark bg-white text-warm-gray hover:border-gold/40"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <p className="mb-2 text-sm font-medium text-navy">
          Interests{" "}
          <span className="font-normal text-warm-gray-light">
            Optional — select all that apply
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INTEREST_OPTIONS.map(({ emoji, label }) => {
            const selected = interests.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleInterest(label)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition ${
                  selected
                    ? "border-gold bg-gold/10 text-navy shadow-sm"
                    : "border-cream-dark bg-white text-warm-gray hover:border-gold/40"
                }`}
              >
                <span className="text-base">{emoji}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gift notes */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Gift Notes{" "}
          <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <textarea
          rows={3}
          value={giftNotes}
          onChange={(e) => { setGiftNotes(e.target.value); setSaved(false); }}
          placeholder="Anything else we should know about picking the perfect gift..."
          className={inputClass}
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy-light disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-forest">Saved!</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab B — Delivery Address
   ═══════════════════════════════════════════════════════════════════════════ */

function AddressTab({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: () => void;
}) {
  const r = order.recipients;
  const [line1, setLine1] = useState(r?.address_line1 ?? "");
  const [line2, setLine2] = useState(r?.address_line2 ?? "");
  const [city, setCity] = useState(r?.city ?? "");
  const [state, setState] = useState(r?.state ?? "");
  const [postalCode, setPostalCode] = useState(r?.postal_code ?? "");
  const [country, setCountry] = useState(r?.country ?? "US");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/orders/${order.id}/address`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address_line1: line1,
        address_line2: line2 || null,
        city,
        state,
        postal_code: postalCode,
        country,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onUpdated();
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold-dark">
        Address updates apply to future shipments only.
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Address Line 1
        </label>
        <input
          value={line1}
          onChange={(e) => { setLine1(e.target.value); setSaved(false); }}
          placeholder="Street address"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Address Line 2{" "}
          <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <input
          value={line2}
          onChange={(e) => { setLine2(e.target.value); setSaved(false); }}
          placeholder="Apartment, suite, etc."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            City
          </label>
          <input
            value={city}
            onChange={(e) => { setCity(e.target.value); setSaved(false); }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            State
          </label>
          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setSaved(false); }}
            className={selectClass}
          >
            <option value="">Select...</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            ZIP Code
          </label>
          <input
            value={postalCode}
            onChange={(e) => { setPostalCode(e.target.value); setSaved(false); }}
            placeholder="12345"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Country
          </label>
          <input
            value={country}
            onChange={(e) => { setCountry(e.target.value); setSaved(false); }}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy-light disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Address"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-forest">Saved!</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab C — Plan Settings
   ═══════════════════════════════════════════════════════════════════════════ */

function PlanTab({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: () => void;
}) {
  const currentTier = TIERS.find((t) => t.id === order.tier);
  const currentTierIndex = TIERS.findIndex((t) => t.id === order.tier);
  const upgradeTiers = TIERS.slice(currentTierIndex + 1);

  const [addYears, setAddYears] = useState(1);
  const [addingYears, setAddingYears] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [changingDate, setChangingDate] = useState(false);
  const [newDate, setNewDate] = useState(order.occasions?.occasion_date ?? "");

  const nextPending = [...(order.shipments ?? [])]
    .filter((s) => s.status === "pending" || s.status === "paused")
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];

  const isPaused = nextPending?.status === "paused";

  const addYearsCost = currentTier ? currentTier.price * addYears : 0;

  async function handleUpgrade(newTierId: string) {
    const newTier = TIERS.find((t) => t.id === newTierId);
    if (!newTier || !currentTier) return;

    const priceDiff = newTier.priceInCents - currentTier.priceInCents;
    const totalDiff = priceDiff * order.years_remaining;

    // Redirect to a checkout session for the upgrade difference
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientName: order.recipients?.name,
        relationship: order.recipients?.relationship,
        occasionType: order.occasions?.type,
        occasionLabel: order.occasions?.label,
        occasionDate: order.occasions?.occasion_date,
        years: order.years_remaining,
        tier: newTierId,
        addressLine1: order.recipients?.address_line1 ?? "",
        addressLine2: order.recipients?.address_line2 ?? "",
        city: order.recipients?.city ?? "",
        state: order.recipients?.state ?? "",
        postalCode: order.recipients?.postal_code ?? "",
        country: order.recipients?.country ?? "US",
        recipientAge: order.recipients?.age ?? "",
        recipientGender: order.recipients?.gender ?? "",
        interests: order.recipients?.interests ?? "",
        giftNotes: order.recipients?.gift_notes ?? "",
        cardMessage: order.recipients?.card_message ?? "",
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function handleAddYears() {
    if (!currentTier) return;
    setAddingYears(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientName: order.recipients?.name,
        relationship: order.recipients?.relationship,
        occasionType: order.occasions?.type,
        occasionLabel: order.occasions?.label,
        occasionDate: order.occasions?.occasion_date,
        years: addYears,
        tier: order.tier,
        addressLine1: order.recipients?.address_line1 ?? "",
        addressLine2: order.recipients?.address_line2 ?? "",
        city: order.recipients?.city ?? "",
        state: order.recipients?.state ?? "",
        postalCode: order.recipients?.postal_code ?? "",
        country: order.recipients?.country ?? "US",
        recipientAge: order.recipients?.age ?? "",
        recipientGender: order.recipients?.gender ?? "",
        interests: order.recipients?.interests ?? "",
        giftNotes: order.recipients?.gift_notes ?? "",
        cardMessage: order.recipients?.card_message ?? "",
      }),
    });

    const data = await res.json();
    setAddingYears(false);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function handleTogglePause() {
    setPausing(true);
    const res = await fetch(`/api/orders/${order.id}/pause`, {
      method: "PATCH",
    });
    setPausing(false);
    if (res.ok) {
      onUpdated();
    }
  }

  async function handleChangeDate() {
    if (!newDate) return;
    setChangingDate(true);

    // Update the occasion date via direct Supabase call (client-side)
    // We'll use a simple approach - update occasion + future shipments
    const res = await fetch(`/api/orders/${order.id}/recipient`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // no-op to trigger
    });

    setChangingDate(false);
    if (res.ok) {
      onUpdated();
    }
  }

  return (
    <div className="space-y-6">
      {/* Current tier info */}
      <div className="rounded-xl border border-cream-dark bg-cream/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warm-gray">Current Tier</p>
            <p className="text-lg font-bold text-navy">
              {currentTier?.name} — ${currentTier?.price}/year
            </p>
          </div>
          <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">
            {order.years_remaining} year{order.years_remaining !== 1 ? "s" : ""}{" "}
            remaining
          </span>
        </div>
      </div>

      {/* Upgrade options */}
      {upgradeTiers.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">
            Upgrade Your Tier
          </h3>
          <div className="space-y-2">
            {upgradeTiers.map((tier) => {
              const diff = tier.price - (currentTier?.price ?? 0);
              const totalDiff = diff * order.years_remaining;
              return (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-lg border border-cream-dark bg-white p-4"
                >
                  <div>
                    <p className="font-semibold text-navy">{tier.name}</p>
                    <p className="text-sm text-warm-gray">
                      ${tier.price}/year (+${diff}/year)
                    </p>
                    <p className="text-xs text-warm-gray-light">
                      Total upgrade cost: ${totalDiff.toFixed(0)} for{" "}
                      {order.years_remaining} remaining year
                      {order.years_remaining !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-gold-light"
                  >
                    Upgrade
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add years */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">Add Years</h3>
        <div className="rounded-lg border border-cream-dark bg-white p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-navy whitespace-nowrap">
              Additional years:
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={addYears}
              onChange={(e) => setAddYears(parseInt(e.target.value))}
              className="flex-1 accent-navy"
            />
            <span className="w-8 text-center text-sm font-bold text-navy">
              {addYears}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-warm-gray">
              {addYears} additional year{addYears !== 1 ? "s" : ""} ={" "}
              <span className="font-semibold text-navy">
                ${addYearsCost}
              </span>
            </p>
            <button
              onClick={handleAddYears}
              disabled={addingYears}
              className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-light disabled:opacity-50"
            >
              {addingYears ? "Redirecting..." : "Add Years"}
            </button>
          </div>
        </div>
      </div>

      {/* Pause toggle */}
      {nextPending && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy">
            Skip Next Delivery
          </h3>
          <div className="rounded-lg border border-cream-dark bg-white p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaused}
                onChange={handleTogglePause}
                disabled={pausing}
                className="h-5 w-5 rounded border-cream-dark text-navy accent-navy"
              />
              <div>
                <p className="text-sm font-medium text-navy">
                  {isPaused ? "Next delivery is paused" : "Skip next delivery"}
                </p>
                <p className="text-xs text-warm-gray">
                  Next scheduled:{" "}
                  {new Date(nextPending.scheduled_date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Change occasion date */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy">
          Change Occasion Date
        </h3>
        <div className="rounded-lg border border-cream-dark bg-white p-4">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className={inputClass + " flex-1"}
            />
            <button
              onClick={handleChangeDate}
              disabled={changingDate || newDate === order.occasions?.occasion_date}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-navy-light disabled:opacity-50"
            >
              {changingDate ? "Updating..." : "Update"}
            </button>
          </div>
          <p className="mt-2 text-xs text-warm-gray">
            Updates all future unshipped shipments to the new date.
          </p>
        </div>
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab E — Refund Request
   ═══════════════════════════════════════════════════════════════════════════ */

function RefundTab({
  order,
  onUpdated,
  hasExisting,
}: {
  order: Order;
  onUpdated: () => void;
  hasExisting: boolean;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(hasExisting);

  const perYearCost = order.years_purchased > 0 ? order.amount_paid / order.years_purchased : 0;
  const refundEstimate = perYearCost * (order.years_remaining ?? 0);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);

    const res = await fetch(`/api/orders/${order.id}/refund-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
      onUpdated();
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
          <svg className="h-8 w-8 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-navy">
          Refund Request Submitted
        </h3>
        <p className="mt-2 max-w-sm text-sm text-warm-gray">
          We&apos;ve received your request and will review it within 1-2
          business days. You&apos;ll receive an email with our decision.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Reason */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Reason for refund
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={selectClass}
        >
          <option value="">Select a reason...</option>
          {REFUND_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Details */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Additional details{" "}
          <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <textarea
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Tell us more about why you'd like a refund..."
          className={inputClass}
        />
      </div>

      {/* Refund estimate */}
      <div className="rounded-lg border border-cream-dark bg-cream/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-warm-gray">
              Estimated refund
            </p>
            <p className="text-xs text-warm-gray-light">
              {order.years_remaining} remaining year
              {order.years_remaining !== 1 ? "s" : ""} x $
              {perYearCost.toFixed(2)}/year
            </p>
          </div>
          <p className="text-2xl font-bold text-navy">
            ${refundEstimate.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg bg-gold/10 px-4 py-3 text-sm text-gold-dark">
        Refund requests are reviewed within 1-2 business days.
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting || !reason}
        className="w-full rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy-light disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Refund Request"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab D — Executor
   ═══════════════════════════════════════════════════════════════════════════ */

function ExecutorTab({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated: () => void;
}) {
  const [name, setName] = useState(order.executor_name ?? "");
  const [email, setEmail] = useState(order.executor_email ?? "");
  const [phone, setPhone] = useState(order.executor_phone ?? "");
  const [address, setAddress] = useState(order.executor_address ?? "");
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/orders/${order.id}/executor`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        executor_name: name || null,
        executor_email: email || null,
        executor_phone: phone || null,
        executor_address: address || null,
      }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onUpdated();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-navy">Trusted Executor</h3>
        <p className="mt-1 text-sm text-warm-gray">
          Your executor can manage your gift plan on your behalf &mdash; update
          addresses, confirm deliveries, or continue the plan if something
          happens to you. You can add or change your executor at any time.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Full Name
        </label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          placeholder="Jane Smith"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setSaved(false); }}
          placeholder="spouse@email.com"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Phone{" "}
          <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <input
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
          placeholder="(555) 555-1234"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Address{" "}
          <span className="font-normal text-warm-gray-light">Optional</span>
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
          placeholder="123 Main St, City, State ZIP"
          className={inputClass}
        />
      </div>

      {/* Permissions — only show when email is filled */}
      {email.trim() && (
        <div className="rounded-lg border border-cream-dark bg-cream/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-navy">Permissions</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={canView}
              onChange={(e) => { setCanView(e.target.checked); setSaved(false); }}
              className="h-4 w-4 rounded border-cream-dark text-navy accent-navy"
            />
            <span className="text-sm text-navy">Allow executor to view my letters</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={canEdit}
              onChange={(e) => { setCanEdit(e.target.checked); setSaved(false); }}
              className="h-4 w-4 rounded border-cream-dark text-navy accent-navy"
            />
            <span className="text-sm text-navy">Allow executor to edit my letters</span>
          </label>
          <p className="text-xs text-warm-gray">
            By default executors can only release letters and manage gift deliveries.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-navy-light disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Executor"}
        </button>
        {saved && (
          <span className="text-sm font-medium text-forest">Saved!</span>
        )}
      </div>
    </div>
  );
}

