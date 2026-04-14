"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MAX_LETTER_LENGTH = 5000;

async function convertToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Could not get canvas context"));
          return;
        }
        // White background for transparent images (PNG etc)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image"));
            }
          },
          "image/jpeg",
          0.92,
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

const MILESTONE_OPTIONS = [
  "Wedding Day",
  "Birth of First Child",
  "High School Graduation",
  "College Graduation",
  "First Home Purchase",
  "Retirement",
  "18th Birthday",
  "21st Birthday",
  "30th Birthday",
  "50th Birthday",
  "Other Milestone",
];

type DeliveryType = "digital" | "physical" | "physical_photo";

interface LetterData {
  id: string;
  title: string;
  content: string;
  letter_type: string;
  scheduled_date: string | null;
  milestone_label: string | null;
  status: string;
  delivery_type: DeliveryType;
  recipient_email: string | null;
  photo_url: string | null;
  executor_name: string | null;
  executor_email: string | null;
  executor_phone: string | null;
  executor_address: string | null;
  recipients: {
    name: string;
    relationship: string;
  };
}

interface GiftExecutor {
  executor_name: string;
  executor_email: string;
  executor_phone: string;
  executor_address: string;
}

export default function EditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [customMilestone, setCustomMilestone] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");
  const [executorPhone, setExecutorPhone] = useState("");
  const [executorAddress, setExecutorAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("physical");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [giftExecutor, setGiftExecutor] = useState<GiftExecutor | null>(null);
  const [useGiftExecutor, setUseGiftExecutor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function loadLetter() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("letters")
        .select("*, recipients(name, relationship)")
        .eq("id", letterId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.push("/dashboard");
        return;
      }

      const letterData = data as LetterData;
      setLetter(letterData);
      setTitle(data.title);
      setContent(data.content || "");
      setScheduledDate(data.scheduled_date || "");
      // Initialize milestone state
      const savedLabel = data.milestone_label || "";
      if (savedLabel && !MILESTONE_OPTIONS.includes(savedLabel)) {
        // It's a custom milestone
        setMilestoneLabel("Other Milestone");
        setCustomMilestone(savedLabel);
      } else {
        setMilestoneLabel(savedLabel);
      }
      setExecutorName(data.executor_name || "");
      setExecutorEmail(data.executor_email || "");
      setExecutorPhone(data.executor_phone || "");
      setExecutorAddress(data.executor_address || "");
      setDeliveryType(data.delivery_type || "physical");
      setRecipientEmail(data.recipient_email || "");
      setPhotoUrl(data.photo_url || "");

      setLoading(false);

      // Fetch gift order executor (non-critical, load in background)
      try {
        const res = await fetch(`/api/letters/${letterId}/gift-executor`);
        if (res.ok) {
          const { giftExecutor: ge } = await res.json();
          if (ge) {
            setGiftExecutor(ge);
            // Default to checked if letter has no executor set but gift order does
            const letterHasExecutor = !!(data.executor_email);
            if (!letterHasExecutor) {
              setUseGiftExecutor(true);
              setExecutorName(ge.executor_name);
              setExecutorEmail(ge.executor_email);
              setExecutorPhone(ge.executor_phone);
              setExecutorAddress(ge.executor_address);
            }
          }
        }
      } catch {
        // Gift executor fetch is non-critical
      }

      setLoading(false);
    }

    loadLetter();
  }, [letterId, router]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const effectiveMilestone =
        milestoneLabel === "Other Milestone" ? customMilestone : milestoneLabel;

      const res = await fetch("/api/letters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterId,
          title,
          content,
          scheduledDate: scheduledDate || null,
          milestoneLabel: effectiveMilestone || null,
          executorName: executorName || null,
          executorEmail: executorEmail || null,
          executorPhone: executorPhone || null,
          executorAddress: executorAddress || null,
          recipientEmail: recipientEmail || null,
          photoUrl: photoUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <div className="text-center py-20 text-warm-gray">
            Loading letter...
          </div>
        </div>
      </div>
    );
  }

  if (!letter) return null;

  const isLocked = ["printed", "delivered"].includes(letter.status);

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-warm-gray hover:text-navy transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-navy">Edit Letter</h1>
          <p className="mt-2 text-warm-gray">
            To: {letter.recipients?.name}{" "}
            {letter.recipients?.relationship && (
              <span className="text-warm-gray-light">
                ({letter.recipients.relationship})
              </span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy capitalize">
              {letter.letter_type}
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 capitalize">
              {letter.status.replace(/_/g, " ")}
            </span>
            {letter.milestone_label && (
              <span className="text-xs text-warm-gray">
                {letter.milestone_label}
              </span>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-gold-dark">
            This letter has been {letter.status} and can no longer be edited.
          </div>
        )}

        <div className="space-y-6">
          {/* Delivery Type (read-only) */}
          <div>
            <label className="mb-3 block text-sm font-medium text-navy">
              Delivery Type
            </label>
            <div className="rounded-xl border-2 border-gold bg-gold/5 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {deliveryType === "digital"
                    ? "\u{1F4E7}"
                    : deliveryType === "physical_photo"
                      ? "\u{1F4F8}"
                      : "\u{2709}\u{FE0F}"}
                </span>
                <div>
                  <p className="font-semibold text-navy text-sm">
                    {deliveryType === "digital"
                      ? "Digital Letter"
                      : deliveryType === "physical_photo"
                        ? "Physical Letter + Photo"
                        : "Physical Letter"}
                    {" \u2014 "}
                    <span className="text-forest">
                      {deliveryType === "digital"
                        ? "$1/year"
                        : deliveryType === "physical_photo"
                          ? "$15/year"
                          : "$10/year"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-warm-gray">
                    {deliveryType === "digital"
                      ? "Delivered by email on the scheduled date"
                      : deliveryType === "physical_photo"
                        ? "Printed on quality paper with a wallet-sized photo included"
                        : "Printed on quality paper and mailed to their address"}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-warm-gray-light">
              To change your delivery type, please contact support.
            </p>
          </div>

          {/* Recipient Email (for digital delivery) */}
          {deliveryType === "digital" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setSaved(false);
                }}
                disabled={isLocked}
                placeholder="recipient@example.com"
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-warm-gray-light">
                We will send the letter to this email on the scheduled date.
              </p>
            </div>
          )}

          {/* Photo Upload (for physical+photo delivery) */}
          {deliveryType === "physical_photo" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Upload Photo
              </label>
              <p className="mb-3 text-xs text-warm-gray">
                A wallet-sized copy of this photo will be printed and included with your letter.
              </p>
              {photoUrl && (
                <div className="mb-3">
                  <img
                    src={photoUrl}
                    alt="Letter photo"
                    className="h-32 w-32 rounded-lg border border-cream-dark object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*,.heic,.heif"
                disabled={isLocked || uploadingPhoto}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  setUploadingPhoto(true);
                  setError("");

                  try {
                    const supabase = createClient();
                    const jpegBlob = await convertToJpeg(file);
                    const path = `${letterId}/${Date.now()}.jpg`;

                    const { error: uploadError } = await supabase.storage
                      .from("letter-photos")
                      .upload(path, jpegBlob, {
                        upsert: true,
                        contentType: "image/jpeg",
                      });

                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage
                      .from("letter-photos")
                      .getPublicUrl(path);

                    setPhotoUrl(urlData.publicUrl);
                    setSaved(false);
                  } catch (err) {
                    const message =
                      err instanceof Error ? err.message : "Unknown error";
                    setError(
                      `Failed to upload photo: ${message}. Please try a different image or format (JPG, PNG).`,
                    );
                  }

                  setUploadingPhoto(false);
                }}
                className="text-sm text-warm-gray file:mr-4 file:rounded-lg file:border-0 file:bg-navy/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy hover:file:bg-navy/20 disabled:opacity-60"
              />
              {uploadingPhoto && (
                <p className="mt-2 text-xs text-warm-gray">Uploading...</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Letter Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaved(false);
              }}
              disabled={isLocked}
              className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Info box for milestone letters */}
          {letter.letter_type === "milestone" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex gap-3">
                <span className="text-xl leading-none">📋</span>
                <div>
                  <p className="font-semibold text-amber-900 text-sm">
                    How milestone letters work
                  </p>
                  <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                    This letter will NOT be sent automatically. It stays safely stored in
                    your vault until you or your executor logs in and releases it. When the
                    moment arrives — whether that is a wedding, a new baby, or any milestone
                    — simply come back to your dashboard and click Release, or ask your
                    executor to do it on your behalf.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info note for annual letters */}
          {letter.letter_type === "annual" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                ✅ This letter will be delivered automatically on the scheduled date each year.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Your Letter
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LETTER_LENGTH) {
                  setContent(e.target.value);
                  setSaved(false);
                }
              }}
              rows={16}
              disabled={isLocked}
              className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 font-serif text-base leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-warm-gray-light">
                You can edit this until ~2 weeks before the delivery date.
              </p>
              <p
                className={`text-xs font-medium ${
                  content.length > MAX_LETTER_LENGTH * 0.9
                    ? "text-red-500"
                    : "text-warm-gray-light"
                }`}
              >
                {content.length.toLocaleString()}/{MAX_LETTER_LENGTH.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Milestone field for milestone letters */}
          {letter.letter_type === "milestone" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                What is this letter for?
              </label>
              <select
                value={milestoneLabel}
                onChange={(e) => {
                  setMilestoneLabel(e.target.value);
                  if (e.target.value !== "Other Milestone") {
                    setCustomMilestone("");
                  }
                  setSaved(false);
                }}
                disabled={isLocked}
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Select a milestone...</option>
                {MILESTONE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {milestoneLabel === "Other Milestone" && (
                <input
                  type="text"
                  value={customMilestone}
                  onChange={(e) => {
                    setCustomMilestone(e.target.value);
                    setSaved(false);
                  }}
                  disabled={isLocked}
                  placeholder="Describe the milestone..."
                  className="mt-3 w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              )}
            </div>
          )}

          {/* Scheduled Date for annual letters */}
          {letter.letter_type === "annual" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setSaved(false);
                }}
                disabled={isLocked}
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Fallback date field for other letter types */}
          {letter.letter_type !== "milestone" && letter.letter_type !== "annual" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                Delivery Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setSaved(false);
                }}
                disabled={isLocked}
                className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Executor Section */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Executor
            </label>
            <p className="mb-3 text-xs text-warm-gray">
              The person responsible for releasing this letter when the time comes.
            </p>

            {giftExecutor && (
              <>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGiftExecutor}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseGiftExecutor(checked);
                      setSaved(false);
                      if (checked && giftExecutor) {
                        setExecutorName(giftExecutor.executor_name);
                        setExecutorEmail(giftExecutor.executor_email);
                        setExecutorPhone(giftExecutor.executor_phone);
                        setExecutorAddress(giftExecutor.executor_address);
                      }
                    }}
                    disabled={isLocked}
                    className="h-4 w-4 rounded border-cream-dark text-forest focus:ring-forest/30 disabled:opacity-60"
                  />
                  <span className="text-sm text-navy">
                    Same as gift plan executor
                  </span>
                </label>
                <div className="mt-3 mb-4 border-b border-cream-dark" />
              </>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-warm-gray">
                  Name
                </label>
                <input
                  type="text"
                  value={executorName}
                  onChange={(e) => {
                    setExecutorName(e.target.value);
                    setSaved(false);
                  }}
                  disabled={isLocked || useGiftExecutor}
                  placeholder="Executor name"
                  className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-cream/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-warm-gray">
                  Email
                </label>
                <input
                  type="email"
                  value={executorEmail}
                  onChange={(e) => {
                    setExecutorEmail(e.target.value);
                    setSaved(false);
                  }}
                  disabled={isLocked || useGiftExecutor}
                  placeholder="executor@example.com"
                  className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-cream/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-warm-gray">
                  Phone
                </label>
                <input
                  type="tel"
                  value={executorPhone}
                  onChange={(e) => {
                    setExecutorPhone(e.target.value);
                    setSaved(false);
                  }}
                  disabled={isLocked || useGiftExecutor}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-cream/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-warm-gray">
                  Address
                </label>
                <input
                  type="text"
                  value={executorAddress}
                  onChange={(e) => {
                    setExecutorAddress(e.target.value);
                    setSaved(false);
                  }}
                  disabled={isLocked || useGiftExecutor}
                  placeholder="123 Main St, City, State 12345"
                  className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-cream/50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!isLocked && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && (
                <p className="text-sm font-medium text-forest">
                  Saved successfully!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
