"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VoiceRecorder from "@/components/VoiceRecorder";

interface RequestInfo {
  id: string;
  prompt: string | null;
  format: string | null;
  requester_name: string;
  milestone_label: string | null;
}

export default function ContributePage() {
  const params = useParams();
  const code = params.code as string;

  const [request, setRequest] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isRecordingFormat = request?.format === "audio" || request?.format === "video";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/contribute/${code}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Request not found");
        } else {
          setRequest(data.request);
        }
      } catch {
        setError("Something went wrong");
      }
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleSubmit() {
    if (isRecordingFormat && !recordingBlob) return;
    if (!isRecordingFormat && !message.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      let recordingUrl: string | undefined;

      // For recordings, upload directly to Supabase storage via signed URL
      // to bypass Vercel's 4.5 MB body size limit
      if (isRecordingFormat && recordingBlob) {
        // Step 1: Get a signed upload URL from the server
        const urlRes = await fetch(`/api/contribute/${code}/upload-url`, {
          method: "POST",
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) {
          setError(urlData.error || "Failed to prepare upload");
          setSubmitting(false);
          return;
        }

        // Step 2: Upload the recording directly to Supabase storage
        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": urlData.contentType },
          body: recordingBlob,
        });

        if (!uploadRes.ok) {
          setError("Failed to upload recording. Please try again.");
          setSubmitting(false);
          return;
        }

        recordingUrl = urlData.publicUrl;
      }

      // Step 3: Send metadata to the contribute API
      const res = await fetch(`/api/contribute/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributor_name: name.trim(),
          message: isRecordingFormat
            ? `Recording from ${name.trim() || "Anonymous"}`
            : message.trim(),
          recording_url: recordingUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy">Request Not Found</h1>
          <p className="mt-3 text-warm-gray">{error}</p>
          <Link href="/" className="mt-8 inline-flex items-center rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-cream transition hover:bg-navy/90">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (!request) return null;

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-forest/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-forest">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {isRecordingFormat ? "Recording Sent!" : "Message Sent!"}
          </h1>
          <p className="mt-3 text-warm-gray">
            Your {isRecordingFormat ? "recording" : "message"} has been delivered to <span className="font-semibold text-navy">{request.requester_name}</span>. Thank you for contributing!
          </p>
          <Link href="/" className="mt-8 inline-flex items-center rounded-lg bg-forest px-6 py-3 text-sm font-semibold text-cream transition hover:bg-forest-light">
            Visit SendForGood
          </Link>
        </div>
      </main>
    );
  }

  const formatLabel = request.format === "video" ? "video message" : request.format === "audio" ? "voice message" : "message";

  return (
    <main className="min-h-screen bg-gradient-to-b from-cream to-cream-dark px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
              <span className="text-4xl">{request.format === "video" ? "🎬" : request.format === "audio" ? "🎙️" : "📨"}</span>
            </div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              {request.requester_name} is asking for a {formatLabel}
            </h1>
            <p className="mt-3 text-warm-gray">
              {isRecordingFormat
                ? `Record your ${formatLabel} below and we'll deliver it for you.`
                : "Write your message below and we'll deliver it for you."}
            </p>
          </div>

          {request.milestone_label && (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-navy/5 px-4 py-2">
              <span className="text-sm">🎯</span>
              <p className="text-sm font-medium text-navy">
                This is for their <span className="font-bold">{request.milestone_label}</span>
              </p>
            </div>
          )}

          {request.prompt && (
            <div className="mt-6 rounded-xl border-l-4 border-gold bg-cream/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-warm-gray mb-1">
                What they&apos;d like you to {isRecordingFormat ? "record" : "write"} about
              </p>
              <p className="text-sm italic text-navy">
                &ldquo;{request.prompt}&rdquo;
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                Your Name <span className="text-warm-gray-light">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John"
                className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>

            {isRecordingFormat ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-navy">
                  Your {request.format === "video" ? "Video" : "Voice"} Recording
                </label>
                <VoiceRecorder
                  defaultFormat={request.format as "audio" | "video"}
                  showFormatToggle={false}
                  maxDurationSeconds={120}
                  onRecordingComplete={(blob) => setRecordingBlob(blob)}
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={6}
                  className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                />
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || (isRecordingFormat ? !recordingBlob : !message.trim())}
            className="mt-6 w-full rounded-lg bg-forest px-4 py-3.5 text-sm font-bold text-cream shadow-lg transition hover:bg-forest-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Uploading & Sending..." : isRecordingFormat ? "Send Recording" : "Send Message"}
          </button>

          <p className="mt-4 text-center text-xs text-warm-gray">
            Powered by <Link href="/" className="font-medium text-navy underline hover:text-gold">SendForGood</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
