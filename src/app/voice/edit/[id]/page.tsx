"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder from "@/components/VoiceRecorder";

const MILESTONE_OPTIONS = [
  "Wedding Day",
  "Graduation",
  "First Child",
  "Retirement",
  "18th Birthday",
  "21st Birthday",
  "30th Birthday",
  "50th Birthday",
  "Other",
];

interface VoiceMessageData {
  id: string;
  title: string | null;
  message_format: "audio" | "video";
  status: string;
  audio_url: string | null;
  duration_seconds: number | null;
  recipient_name: string | null;
  recipient_email: string | null;
  scheduled_date: string | null;
  milestone_label: string | null;
  letter_type: string | null;
}

export default function EditVoiceMessagePage() {
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;

  const [message, setMessage] = useState<VoiceMessageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"date" | "milestone">("date");
  const [scheduledDate, setScheduledDate] = useState("");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [customMilestone, setCustomMilestone] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadMessage() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const res = await fetch(`/api/voice-messages/${messageId}`);
      if (!res.ok) {
        router.push("/dashboard");
        return;
      }

      const { voiceMessage } = await res.json();
      const vm = voiceMessage as VoiceMessageData;
      setMessage(vm);
      setRecipientName(vm.recipient_name || "");
      setRecipientEmail(vm.recipient_email || "");
      setAudioUrl(vm.audio_url || null);
      setDurationSeconds(vm.duration_seconds || null);
      setScheduledDate(vm.scheduled_date || "");

      const savedLabel = vm.milestone_label || "";
      if (savedLabel && !MILESTONE_OPTIONS.includes(savedLabel)) {
        setMilestoneLabel("Other");
        setCustomMilestone(savedLabel);
      } else {
        setMilestoneLabel(savedLabel);
      }

      setDeliveryMode(vm.letter_type === "milestone" ? "milestone" : "date");
      setLoading(false);
    }

    loadMessage();
  }, [messageId, router]);

  const handleRecordingComplete = useCallback(
    (blob: Blob, duration: number) => {
      setRecordingBlob(blob);
      setDurationSeconds(duration);
      setSaved(false);
    },
    []
  );

  async function uploadRecording(): Promise<string | null> {
    if (!recordingBlob || !message) return audioUrl;

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = message.message_format === "video" ? "webm" : "webm";
      const path = `${message.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("voice-messages")
        .upload(path, recordingBlob, {
          upsert: true,
          contentType:
            message.message_format === "video" ? "video/webm" : "audio/webm",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("voice-messages")
        .getPublicUrl(path);

      setUploading(false);
      return urlData.publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to upload recording: ${msg}`);
      setUploading(false);
      return null;
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      let finalAudioUrl = audioUrl;

      // Upload new recording if one was made
      if (recordingBlob) {
        const uploaded = await uploadRecording();
        if (uploaded === null && recordingBlob) {
          setSaving(false);
          return; // upload failed, error already set
        }
        finalAudioUrl = uploaded;
      }

      const effectiveMilestone =
        milestoneLabel === "Other" ? customMilestone : milestoneLabel;

      const hasRecording = !!finalAudioUrl;

      const res = await fetch(`/api/voice-messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: recipientName || null,
          recipient_email: recipientEmail || null,
          scheduled_date:
            deliveryMode === "date" ? scheduledDate || null : null,
          milestone_label:
            deliveryMode === "milestone" ? effectiveMilestone || null : null,
          letter_type: deliveryMode === "milestone" ? "milestone" : "annual",
          audio_url: finalAudioUrl,
          duration_seconds: durationSeconds,
          status: hasRecording ? "recorded" : "draft",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setAudioUrl(finalAudioUrl);
        setRecordingBlob(null);
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
            Loading voice message...
          </div>
        </div>
      </div>
    );
  }

  if (!message) return null;

  const isLocked = message.status === "delivered";

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
          <h1 className="mt-4 text-3xl font-bold text-navy">
            Edit Voice Message
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                message.message_format === "video"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-navy/10 text-navy"
              }`}
            >
              {message.message_format === "video" ? "Video" : "Audio"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                message.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : message.status === "recorded"
                    ? "bg-green-100 text-green-800"
                    : "bg-forest/10 text-forest"
              }`}
            >
              {message.status === "draft"
                ? "Not recorded"
                : message.status === "recorded"
                  ? "Recorded"
                  : message.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-sm text-gold-dark">
            This message has been delivered and can no longer be edited.
          </div>
        )}

        <div className="space-y-6">
          {/* Recording Section */}
          {!isLocked && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-navy">
                {audioUrl ? "Your Recording" : "Record Your Message"}
              </label>

              {/* Existing recording playback */}
              {audioUrl && !recordingBlob && (
                <div className="mb-4 rounded-xl bg-cream p-4">
                  <p className="mb-2 text-xs font-medium text-warm-gray">
                    Current recording:
                  </p>
                  {message.message_format === "video" ? (
                    <video controls src={audioUrl} className="w-full rounded-lg" />
                  ) : (
                    <audio controls src={audioUrl} className="w-full" />
                  )}
                  {durationSeconds && (
                    <p className="mt-2 text-xs text-warm-gray">
                      Duration: {Math.floor(durationSeconds / 60)}:
                      {(durationSeconds % 60).toString().padStart(2, "0")}
                    </p>
                  )}
                </div>
              )}

              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                defaultFormat={message.message_format}
                showFormatToggle={false}
                disableAudio={message.message_format === "video"}
                disableVideo={message.message_format === "audio"}
              />
            </div>
          )}

          {/* Recipient Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                setSaved(false);
              }}
              disabled={isLocked}
              placeholder="Who is this message for?"
              className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Recipient Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Recipient Email
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
            <p className="mt-1.5 text-xs text-warm-gray">
              We will send the message to this email on the delivery date.
            </p>
          </div>

          {/* When to deliver */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-navy">
              When should this be delivered?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isLocked) {
                    setDeliveryMode("date");
                    setSaved(false);
                  }
                }}
                disabled={isLocked}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  deliveryMode === "date"
                    ? "border-navy bg-navy/5"
                    : "border-cream-dark bg-white hover:border-navy/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="text-2xl">📅</span>
                <p
                  className={`mt-2 text-sm font-semibold ${deliveryMode === "date" ? "text-navy" : "text-warm-gray"}`}
                >
                  On a specific date
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isLocked) {
                    setDeliveryMode("milestone");
                    setSaved(false);
                  }
                }}
                disabled={isLocked}
                className={`rounded-xl border-2 p-4 text-left transition-colors ${
                  deliveryMode === "milestone"
                    ? "border-navy bg-navy/5"
                    : "border-cream-dark bg-white hover:border-navy/30"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="text-2xl">🎯</span>
                <p
                  className={`mt-2 text-sm font-semibold ${deliveryMode === "milestone" ? "text-navy" : "text-warm-gray"}`}
                >
                  On a milestone
                </p>
              </button>
            </div>
          </div>

          {/* Date picker */}
          {deliveryMode === "date" && (
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
              <p className="mt-1.5 text-xs text-warm-gray">
                Your message will be delivered on this date.
              </p>
            </div>
          )}

          {/* Milestone picker */}
          {deliveryMode === "milestone" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">
                What milestone?
              </label>
              <select
                value={milestoneLabel}
                onChange={(e) => {
                  setMilestoneLabel(e.target.value);
                  if (e.target.value !== "Other") {
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
              {milestoneLabel === "Other" && (
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
              <p className="mt-1.5 text-xs text-warm-gray">
                Your message will be held until you or your executor releases
                it.
              </p>
            </div>
          )}

          {/* Info boxes */}
          {deliveryMode === "milestone" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex gap-3">
                <span className="text-xl leading-none">📋</span>
                <div>
                  <p className="font-semibold text-amber-900 text-sm">
                    How milestone messages work
                  </p>
                  <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                    This message will NOT be sent automatically. It stays safely
                    stored until you or your executor logs in and releases it.
                    When the moment arrives, simply come back to your dashboard
                    and click Release.
                  </p>
                </div>
              </div>
            </div>
          )}

          {deliveryMode === "date" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-800">
                This message will be delivered once on the scheduled date.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Save */}
          {!isLocked && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading..."
                  : saving
                    ? "Saving..."
                    : "Save Changes"}
              </button>
              {saved && (
                <p className="text-sm font-medium text-forest">
                  Saved successfully!
                </p>
              )}
            </div>
          )}

          {/* Success state with dashboard link */}
          {saved && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-800">
                Your voice message has been saved.{" "}
                <Link
                  href="/dashboard"
                  className="font-medium text-green-900 underline hover:text-green-700"
                >
                  Back to Dashboard
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
