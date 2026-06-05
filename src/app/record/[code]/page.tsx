"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import VoiceRecorder, { type MediaFormat } from "@/components/VoiceRecorder";
import { useUploadQueue } from "@/lib/use-upload-queue";

function ViralFooter() {
  return (
    <footer className="border-t border-cream-dark bg-cream/30 px-6 py-10 mt-12">
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">
          Powered by SealTheDay
        </p>
        <p className="mt-2 text-sm text-warm-gray">
          Got a wedding, birthday, or milestone coming up?
        </p>
        <Link
          href="/wedding"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-navy underline hover:text-navy/80"
        >
          Start your own vault &rarr;
        </Link>
      </div>
    </footer>
  );
}

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
  photo_slots_left: number;
}

export default function RecordMemoryPage() {
  const params = useParams();
  const code = params.code as string;

  const [request, setRequest] = useState<MemoryRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recorderName, setRecorderName] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaFormat, setMediaFormat] = useState<MediaFormat>("video");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"record" | "photo">("record");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Offline-tolerant upload queue. Persists every recording / photo to
  // IndexedDB the moment the user hits send. Auto-retries on online /
  // visibility / 15s timer until each item lands. See lib/use-upload-queue.
  const {
    queue,
    online,
    processing,
    enqueue,
    processOnce,
    discard,
  } = useUploadQueue(code);

  // Once the queue empties after a submit attempt, treat it as success.
  // We track whether the user has actually pressed submit on this visit so
  // queued items left over from a prior session don't trigger the thank-you
  // before the user has done anything.
  const [submitAttempted, setSubmitAttempted] = useState(false);
  useEffect(() => {
    if (submitAttempted && queue.length === 0 && !processing) {
      setSubmitted(true);
    }
  }, [submitAttempted, queue.length, processing]);

  // Scroll to top when showing the thank you screen
  useEffect(() => {
    if (submitted) window.scrollTo(0, 0);
  }, [submitted]);

  // Sync format and tab when request data loads
  useEffect(() => {
    if (request) {
      const audioAvail = request.audio_slots_left > 0;
      const videoAvail = request.video_slots_left > 0;
      const photoAvail = request.photo_slots_left > 0;
      // Set the correct default media format based on available slots
      if (videoAvail) {
        setMediaFormat("video");
      } else if (audioAvail) {
        setMediaFormat("audio");
      }
      // Auto-select photo tab when recording is not available
      if (!audioAvail && !videoAvail && photoAvail) {
        setActiveTab("photo");
      }
    }
  }, [request]);

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

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const maxPhotos = request?.photo_slots_left || 5;
    const limited = files.slice(0, maxPhotos);

    // Validate file sizes (max 10MB each)
    for (const file of limited) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" is too large. Max 10MB per photo.`);
        return;
      }
    }

    setSelectedPhotos(limited);
    setError(null);

    // Generate previews
    const previews: string[] = [];
    for (const file of limited) {
      previews.push(URL.createObjectURL(file));
    }
    // Clean up old previews
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setPhotoPreviews(previews);
  }

  async function handleSubmit() {
    if (activeTab === "photo") {
      await handlePhotoSubmit();
    } else {
      await handleRecordingSubmit();
    }
  }

  async function handleRecordingSubmit() {
    if (!mediaBlob) return;
    setSubmitting(true);
    setError(null);

    try {
      // Best-effort slot pre-check. If we're offline this fetch will fail —
      // we still queue the recording locally so it isn't lost. The server
      // re-checks slots on the metadata POST regardless.
      try {
        const checkRes = await fetch(`/api/memory-requests/${code}`);
        if (checkRes.ok) {
          const fresh = await checkRes.json();
          const slotsKey = mediaFormat === "video" ? "video_slots_left" : "audio_slots_left";
          if (fresh[slotsKey] <= 0) {
            setRequest(fresh);
            throw new Error(
              `All ${mediaFormat} slots are now filled. ${
                mediaFormat === "video" && fresh.audio_slots_left > 0
                  ? "You can still record an audio message."
                  : mediaFormat === "audio" && fresh.video_slots_left > 0
                    ? "You can still record a video message."
                    : ""
              }`
            );
          }
        }
      } catch (precheckErr) {
        // Re-throw fatal slot errors. Swallow network errors so we still queue.
        if (
          precheckErr instanceof Error &&
          precheckErr.message.startsWith("All ")
        ) {
          throw precheckErr;
        }
      }

      const contentType =
        mediaBlob.type || (mediaFormat === "video" ? "video/webm" : "audio/webm");

      await enqueue({
        blob: mediaBlob,
        contentType,
        metadata: {
          recorder_name: recorderName || null,
          message_format: mediaFormat,
        },
      });

      // Free local memory — IndexedDB now owns the blob.
      setMediaBlob(null);
      setSubmitAttempted(true);
      processOnce();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePhotoSubmit() {
    if (selectedPhotos.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      // Best-effort slot pre-check (see note in handleRecordingSubmit).
      try {
        const checkRes = await fetch(`/api/memory-requests/${code}`);
        if (checkRes.ok) {
          const fresh = await checkRes.json();
          if (fresh.photo_slots_left <= 0) {
            setRequest(fresh);
            throw new Error("All photo slots are now filled.");
          }
          if (fresh.photo_slots_left < selectedPhotos.length) {
            setRequest(fresh);
            throw new Error(
              `Only ${fresh.photo_slots_left} photo slot${fresh.photo_slots_left !== 1 ? "s" : ""} remaining. Please select fewer photos.`
            );
          }
        }
      } catch (precheckErr) {
        if (
          precheckErr instanceof Error &&
          (precheckErr.message.startsWith("All ") ||
            precheckErr.message.startsWith("Only "))
        ) {
          throw precheckErr;
        }
      }

      for (const photo of selectedPhotos) {
        const contentType = photo.type || "image/jpeg";
        await enqueue({
          blob: photo,
          contentType,
          metadata: {
            recorder_name: recorderName || null,
            message_format: "photo",
          },
        });
      }

      // Free preview URLs and clear selection — queue owns the photos now.
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setPhotoPreviews([]);
      setSelectedPhotos([]);
      setSubmitAttempted(true);
      processOnce();
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
        <ViralFooter />
      </main>
    );
  }

  // Check if vault is full for all formats
  const audioFull = request ? request.audio_slots_left <= 0 : true;
  const videoFull = request ? request.video_slots_left <= 0 : true;
  const photoFull = request ? request.photo_slots_left <= 0 : true;
  const vaultFull = audioFull && videoFull && photoFull;

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
        <ViralFooter />
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
              Your {activeTab === "photo" ? "photo" : mediaFormat === "video" ? "video" : "voice"} {activeTab === "photo" ? (selectedPhotos.length > 1 ? "uploads have" : "upload has") : "message has"} been {activeTab === "photo" ? "uploaded" : "recorded"} and saved.
              {request?.is_sealed && request?.sealed_until
                ? ` It will be stored safely and delivered to ${request.requester_first_name} when their vault opens.`
                : ` It will be delivered to ${request?.requester_first_name} on their chosen date.`}
            </p>
          </div>
        </div>
        <ViralFooter />
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
  const canUploadPhoto = !photoFull;
  const defaultFormat = canRecordVideo ? "video" : "audio";
  const hasRecordingOptions = canRecordAudio || canRecordVideo;

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        {/* Request info */}
        <div className="mb-8 rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
          <p className="text-sm font-medium text-gold">
            {request?.requester_first_name} is collecting memories:
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
              &#x1F512; This will be sealed until {sealedDate}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Your submission will be stored safely and delivered to{" "}
              {request.requester_first_name} when their vault opens on{" "}
              {sealedDate}.
            </p>
          </div>
        )}

        {/* Upload queue status — only render when there's something to say. */}
        {queue.length > 0 && (
          <div
            className={`mb-6 rounded-lg border p-4 ${
              !online
                ? "border-amber-300 bg-amber-50"
                : queue.some((q) => q.status === "fatal")
                  ? "border-red-300 bg-red-50"
                  : "border-navy/20 bg-navy/5"
            }`}
          >
            {!online ? (
              <>
                <p className="text-sm font-semibold text-amber-900">
                  &#x1F4F6; No service right now
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Your {queue.length === 1 ? "message is" : `${queue.length} messages are`} saved on
                  your phone. We&apos;ll send {queue.length === 1 ? "it" : "them"} as soon as you
                  have signal again. Please don&apos;t close this tab.
                </p>
              </>
            ) : queue.some((q) => q.status === "fatal") ? (
              <>
                <p className="text-sm font-semibold text-red-800">
                  Couldn&apos;t deliver your {queue.length === 1 ? "message" : "messages"}
                </p>
                <ul className="mt-2 space-y-2">
                  {queue
                    .filter((q) => q.status === "fatal")
                    .map((q) => (
                      <li
                        key={q.id}
                        className="flex items-start justify-between gap-3 text-xs text-red-700"
                      >
                        <span>
                          {q.metadata.message_format === "photo"
                            ? "Photo"
                            : q.metadata.message_format === "video"
                              ? "Video"
                              : "Audio"}{" "}
                          &mdash; {q.lastError || "Failed"}
                        </span>
                        <button
                          onClick={() => discard(q.id)}
                          className="shrink-0 rounded border border-red-300 bg-white px-2 py-0.5 text-red-700 hover:bg-red-100"
                        >
                          Discard
                        </button>
                      </li>
                    ))}
                </ul>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-navy">
                  {processing ? (
                    <>
                      <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-navy border-t-transparent align-[-1px]" />
                      Sending {queue.length === 1 ? "your message" : `${queue.length} messages`}&hellip;
                    </>
                  ) : (
                    <>Waiting to send {queue.length === 1 ? "1 message" : `${queue.length} messages`}</>
                  )}
                </p>
                <p className="mt-1 text-xs text-warm-gray">
                  Hang tight &mdash; please keep this tab open until it finishes.
                </p>
                {queue.some((q) => q.status === "failed" && q.attempts > 0) && (
                  <p className="mt-1 text-xs text-warm-gray">
                    Connection seems slow. We&apos;ll keep retrying automatically.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Format tabs — only show if both recording and photo options exist */}
        {hasRecordingOptions && canUploadPhoto && (
          <div className="mb-6 flex rounded-lg border border-cream-dark bg-white p-1">
            <button
              onClick={() => setActiveTab("record")}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "record"
                  ? "bg-navy text-cream shadow"
                  : "text-warm-gray hover:text-navy"
              }`}
            >
              {"\uD83C\uDFA4"} Record
            </button>
            <button
              onClick={() => setActiveTab("photo")}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "photo"
                  ? "bg-navy text-cream shadow"
                  : "text-warm-gray hover:text-navy"
              }`}
            >
              {"\uD83D\uDCF7"} Photo
            </button>
          </div>
        )}


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
            placeholder={activeTab === "photo" ? "So they know who uploaded it" : "So they know who recorded it"}
            className="w-full rounded-lg border border-cream-dark bg-white px-4 py-2.5 text-navy placeholder:text-warm-gray-light transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {/* Recording tab */}
        {activeTab === "record" && hasRecordingOptions && (
          <>
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

            {/* Voice/Video Recorder */}
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onFormatChange={(f) => setMediaFormat(f)}
              maxDurationSeconds={120}
              defaultFormat={defaultFormat as MediaFormat}
              disableAudio={!canRecordAudio}
              disableVideo={!canRecordVideo}
            />

            {/* Submit recording */}
            {mediaBlob && (
              <div className="mt-6">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || queue.length > 0}
                  className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : queue.length > 0
                      ? "Sending..."
                      : online
                        ? "Submit Recording"
                        : "Save & Send When Online"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Photo tab */}
        {activeTab === "photo" && canUploadPhoto && (
          <div>
            <div className="rounded-2xl border border-cream-dark bg-white p-6 shadow-md">
              <p className="mb-4 text-sm text-warm-gray">
                Upload a photo for the vault. {request ? `${request.photo_slots_left} slot${request.photo_slots_left !== 1 ? "s" : ""} remaining.` : ""}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-cream-dark bg-cream/50 p-6 transition hover:border-gold hover:bg-gold/5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-navy">
                    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM12 17.25a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Z" clipRule="evenodd" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-navy">Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-cream-dark bg-cream/50 p-6 transition hover:border-gold hover:bg-gold/5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-navy">
                    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
                  </svg>
                  <span className="mt-2 text-sm font-medium text-navy">Choose from Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-center text-xs text-warm-gray">
                JPG, PNG, HEIC &mdash; max 10MB
              </p>

              {/* Photo previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {photoPreviews.map((url, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={i}
                      src={url}
                      alt={`Preview ${i + 1}`}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit photos */}
            {selectedPhotos.length > 0 && (
              <div className="mt-6">
                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || queue.length > 0}
                  className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : queue.length > 0
                      ? "Sending..."
                      : online
                        ? `Upload ${selectedPhotos.length > 1 ? `${selectedPhotos.length} Photos` : "Photo"}`
                        : `Save & Send When Online`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <ViralFooter />
    </main>
  );
}
