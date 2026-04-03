"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const MAX_LETTER_LENGTH = 5000;

interface LetterData {
  id: string;
  title: string;
  content: string;
  letter_type: string;
  scheduled_date: string | null;
  milestone_label: string | null;
  status: string;
  executor_email: string | null;
  recipients: {
    name: string;
    relationship: string;
  };
}

export default function EditLetterPage() {
  const router = useRouter();
  const params = useParams();
  const letterId = params.id as string;

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [executorEmail, setExecutorEmail] = useState("");
  const [loading, setLoading] = useState(true);
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

      setLetter(data as LetterData);
      setTitle(data.title);
      setContent(data.content || "");
      setScheduledDate(data.scheduled_date || "");
      setExecutorEmail(data.executor_email || "");
      setLoading(false);
    }

    loadLetter();
  }, [letterId, router]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/letters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterId,
          title,
          content,
          scheduledDate: scheduledDate || null,
          executorEmail: executorEmail || null,
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Executor Email{" "}
              <span className="text-warm-gray-light font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={executorEmail}
              onChange={(e) => {
                setExecutorEmail(e.target.value);
                setSaved(false);
              }}
              disabled={isLocked}
              placeholder="spouse@email.com"
              className="w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-warm-gray-light">
              Your executor will be notified to manage deliveries if your
              account becomes inactive.
            </p>
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
