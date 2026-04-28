"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface LetterRow {
  id: string;
  title: string;
  content: string;
  scheduled_date: string | null;
  status: string;
  letter_type: string;
  delivery_type: string | null;
  photo_url: string | null;
  recipient_name: string | null;
  milestone_label: string | null;
  recipients: { name: string | null } | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "Unscheduled";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  if (status === "draft") return "Draft";
  if (status === "scheduled") return "Scheduled";
  if (status === "delivered" || status === "released") return "Delivered";
  return status;
}

export default function LetterViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [letter, setLetter] = useState<LetterRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/auth?redirect=/letters/view/${id}`);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("letters")
        .select(
          "id, title, content, scheduled_date, status, letter_type, delivery_type, photo_url, recipient_name, milestone_label, recipients(name)"
        )
        .eq("id", id)
        .single();

      if (queryError || !data) {
        setError(queryError?.message || "Letter not found");
      } else {
        setLetter(data as unknown as LetterRow);
      }
      setLoading(false);
    }
    load();
  }, [id, supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error || !letter) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <h1 className="text-2xl font-bold text-navy">Letter not available</h1>
            <p className="mt-3 text-warm-gray">
              {error || "We couldn\u2019t find this letter."}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-cream-dark"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const recipientName =
    letter.recipient_name ||
    letter.recipients?.name ||
    "your recipient";
  const isEditable = letter.status === "draft" || letter.status === "scheduled";

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-navy underline hover:text-gold"
        >
          &larr; Back to dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-cream-dark bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Letter to {recipientName}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
                {letter.title}
              </h1>
              <p className="mt-2 text-sm text-warm-gray">
                {statusLabel(letter.status)} &middot; {formatDate(letter.scheduled_date)}
                {letter.milestone_label ? ` \u00B7 ${letter.milestone_label}` : ""}
              </p>
            </div>
            {isEditable && (
              <Link
                href={`/letters/edit/${letter.id}`}
                className="inline-flex whitespace-nowrap items-center rounded-lg border border-navy px-3 py-2 text-sm font-medium text-navy transition hover:bg-navy hover:text-cream"
              >
                Edit
              </Link>
            )}
          </div>

          {letter.delivery_type === "physical_photo" && letter.photo_url && (
            <div className="mt-6 overflow-hidden rounded-xl border border-cream-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={letter.photo_url}
                alt="Photo for this letter"
                className="w-full object-contain"
              />
            </div>
          )}

          <article className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-navy">
            {letter.content || (
              <span className="italic text-warm-gray">
                This letter is empty.
              </span>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}
