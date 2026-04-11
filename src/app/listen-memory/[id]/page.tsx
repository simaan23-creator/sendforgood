"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface MemoryRecording {
  id: string;
  recorder_name: string | null;
  audio_url: string;
  created_at: string;
  memory_requests: {
    title: string;
    occasion: string;
  };
}

export default function ListenMemoryPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [recording, setRecording] = useState<MemoryRecording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecording() {
      try {
        // Use the client directly since this is a public page
        // The audio_url is already a public URL stored during upload
        const { data, error: fetchError } = await supabase
          .from("memory_recordings")
          .select("id, recorder_name, audio_url, created_at, memory_requests(title, occasion)")
          .eq("id", id)
          .single();

        if (fetchError || !data) {
          throw new Error("Recording not found");
        }

        setRecording(data as unknown as MemoryRecording);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchRecording();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (error || !recording) {
    return (
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
            <span className="text-5xl">😔</span>
            <h1 className="mt-4 text-2xl font-bold text-navy">
              Recording not found
            </h1>
            <p className="mt-3 text-warm-gray">
              {error || "This recording may have been removed."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const recorderName = recording.recorder_name || "Someone special";
  const requestTitle =
    (recording.memory_requests as unknown as { title: string })?.title || "A memory for you";
  const recordedDate = new Date(recording.created_at).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-cream-dark bg-white p-8 text-center shadow-md">
          <span className="text-5xl">🎙️</span>

          <h1 className="mt-5 text-2xl font-bold text-navy">{requestTitle}</h1>

          <p className="mt-2 text-warm-gray">
            Recorded by <span className="font-medium text-navy">{recorderName}</span>
          </p>
          <p className="mt-1 text-xs text-warm-gray-light">
            {recordedDate}
          </p>

          {/* Audio player */}
          <div className="mt-8 rounded-xl bg-cream p-6">
            <audio
              controls
              src={recording.audio_url}
              className="w-full"
            />
          </div>

          <p className="mt-6 text-sm text-warm-gray">
            Delivered with care by{" "}
            <span className="font-semibold text-navy">SendForGood</span>
          </p>
        </div>
      </div>
    </main>
  );
}
