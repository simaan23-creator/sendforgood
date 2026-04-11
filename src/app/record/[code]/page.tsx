"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder from "@/components/VoiceRecorder";

interface MemoryRequest {
  title: string;
  occasion: string;
  delivery_date: string;
  note_to_recorder: string | null;
  requester_first_name: string;
}

export default function RecordMemoryPage() {
  const params = useParams();
  const code = params.code as string;
  const supabase = createClient();

  const [request, setRequest] = useState<MemoryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recorderName, setRecorderName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchRequest() {
      try {
        const res = await fetch(`/api/memory-requests/${code}`);
        if (!res.ok) {
          throw new Error("This request was not found or is no longer active.");
        }
        const data = await res.json();
        setRequest(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [code]);

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setAudioBlob(blob);
    },
    []
  );

  async function handleSubmit() {
    if (!audioBlob) return;
    setSubmitting(true);
    setError(null);

    try {
      // Upload audio to Supabase storage
      const fileName = `${code}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("memory-recordings")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Failed to upload recording. Please try again.");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("memory-recordings").getPublicUrl(fileName);

      // Submit recording
      const res = await fetch(`/api/memory-requests/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recorder_name: recorderName || null,
          audio_url: publicUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit recording");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <span className="text-5xl">😔</span>
            <h1 className="mt-4 text-2xl font-bold text-navy">
              Request not found
            </h1>
            <p className="mt-3 text-warm-gray">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest/10">
              <svg
                className="h-8 w-8 text-forest"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-navy">
              Thank you!
            </h1>
            <p className="mt-3 text-warm-gray">
              Your voice message has been recorded and saved. It will be
              delivered to {request?.requester_first_name} on their chosen
              date.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const deliveryDate = request
    ? new Date(request.delivery_date + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : "";

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        {/* Request info */}
        <div className="mb-8 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
          <p className="text-sm font-medium text-gold">
            {request?.requester_first_name} is asking you to record:
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">
            {request?.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">
              {request?.occasion}
            </span>
            <span className="inline-flex items-center rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold-dark">
              Delivers {deliveryDate}
            </span>
          </div>
          {request?.note_to_recorder && (
            <div className="mt-4 rounded-lg bg-cream p-4">
              <p className="text-xs font-medium text-warm-gray">
                Note from {request.requester_first_name}:
              </p>
              <p className="mt-1 text-sm text-navy">
                {request.note_to_recorder}
              </p>
            </div>
          )}
        </div>

        {/* Recorder name */}
        <div className="mb-6">
          <label
            htmlFor="recorder_name"
            className="mb-1.5 block text-sm font-medium text-navy"
          >
            Your name{" "}
            <span className="font-normal text-warm-gray">(optional)</span>
          </label>
          <input
            id="recorder_name"
            type="text"
            value={recorderName}
            onChange={(e) => setRecorderName(e.target.value)}
            placeholder="So they know who recorded it"
            className="w-full rounded-lg border border-cream-dark bg-white px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDurationSeconds={300}
        />

        {/* Submit */}
        {audioBlob && (
          <div className="mt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Recording"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
