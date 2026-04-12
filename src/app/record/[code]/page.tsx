"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder, { type MediaFormat } from "@/components/VoiceRecorder";

interface MemoryRequest {
  title: string;
  occasion: string;
  delivery_date: string;
  note_to_recorder: string | null;
  requester_first_name: string;
  sealed_until: string | null;
  is_sealed: boolean;
  audio_slots_left: number;
  video_slots_left: number;
}

export default function RecordMemoryPage() {
  const params = useParams();
  const code = params.code as string;
  const supabase = createClient();

  const [request, setRequest] = useState<MemoryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recorderName, setRecorderName] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaFormat, setMediaFormat] = useState<MediaFormat>("audio");
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
      setMediaBlob(blob);
    },
    []
  );

  async function handleSubmit() {
    if (!mediaBlob) return;
    setSubmitting(true);
    setError(null);

    try {
      const ext = mediaFormat === "video" ? "webm" : "webm";
      const contentType = mediaFormat === "video" ? "video/webm" : "audio/webm";
      const fileName = `${code}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("memory-recordings")
        .upload(fileName, mediaBlob, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Failed to upload recording. Please try again.");
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("memory-recordings").getPublicUrl(fileName);

      const res = await fetch(`/api/memory-requests/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recorder_name: recorderName || null,
          audio_url: publicUrl,
          message_format: mediaFormat,
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
            <span className="text-5xl">{"\uD83D\uDE14"}</span>
            <h1 className="mt-4 text-2xl font-bold text-navy">
              Request not found
            </h1>
            <p className="mt-3 text-warm-gray">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  // Check if vault is full for both formats
  const audioFull = request ? request.audio_slots_left <= 0 : true;
  const videoFull = request ? request.video_slots_left <= 0 : true;
  const vaultFull = audioFull && videoFull;

  if (vaultFull) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <span className="text-5xl">{"\uD83D\uDD12"}</span>
            <h1 className="mt-4 text-2xl font-bold text-navy">
              This vault is full
            </h1>
            <p className="mt-3 text-warm-gray">
              No more recordings can be added to this vault. All available
              credits have been used.
            </p>
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
              Your {mediaFormat === "video" ? "video" : "voice"} message has been recorded and saved.
              {request?.is_sealed && request?.sealed_until
                ? ` It will be stored safely and delivered to ${request.requester_first_name} when their vault opens.`
                : ` It will be delivered to ${request?.requester_first_name} on their chosen date.`}
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

  const sealedDate = request?.sealed_until
    ? new Date(request.sealed_until + "T00:00:00").toLocaleDateString(
        "en-US",
        { month: "long", day: "numeric", year: "numeric" }
      )
    : null;

  // Determine which formats are available
  const canRecordAudio = !audioFull;
  const canRecordVideo = !videoFull;
  const defaultFormat = canRecordVideo ? "video" : "audio";

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

        {/* Sealed vault notice */}
        {request?.is_sealed && sealedDate && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              &#x1F512; This message will be sealed until {sealedDate}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Your message will be stored safely and delivered to{" "}
              {request.requester_first_name} when their vault opens on{" "}
              {sealedDate}.
            </p>
          </div>
        )}

        {/* Video recommendation */}
        <div className="mb-6 rounded-lg border border-gold/30 bg-gold/5 p-4 text-center">
          <p className="text-sm text-navy">
            Video messages are more personal &mdash; we recommend it!
          </p>
          {!canRecordAudio && canRecordVideo && (
            <p className="mt-1 text-xs text-warm-gray">
              Only video recording is available for this vault.
            </p>
          )}
          {canRecordAudio && !canRecordVideo && (
            <p className="mt-1 text-xs text-warm-gray">
              Only audio recording is available for this vault.
            </p>
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

        {/* Voice/Video Recorder */}
        <VoiceRecorder
          onRecordingComplete={handleRecordingComplete}
          onFormatChange={(f) => setMediaFormat(f)}
          maxDurationSeconds={300}
          defaultFormat={defaultFormat as MediaFormat}
          disableAudio={!canRecordAudio}
          disableVideo={!canRecordVideo}
        />

        {/* Submit */}
        {mediaBlob && (
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
