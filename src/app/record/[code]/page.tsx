"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
  const [mediaFormat, setMediaFormat] = useState<MediaFormat>("audio");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"record" | "photo">("record");
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Auto-select photo tab when recording is not available
  useEffect(() => {
    if (request) {
      const audioAvail = request.audio_slots_left > 0;
      const videoAvail = request.video_slots_left > 0;
      const photoAvail = request.photo_slots_left > 0;
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
      // Re-check slot availability before uploading
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

      const contentType = mediaBlob.type || (mediaFormat === "video" ? "video/webm" : "audio/webm");

      // Step 1: Get a signed upload URL from the server
      const urlRes = await fetch(`/api/memory-requests/${code}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        throw new Error(urlData.error || "Failed to prepare upload");
      }

      // Step 2: Upload directly to Supabase storage via signed URL
      const sizeMB = (mediaBlob.size / (1024 * 1024)).toFixed(1);
      console.log(`Uploading ${sizeMB}MB ${urlData.contentType} to storage...`);

      const uploadRes = await fetch(urlData.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": urlData.contentType },
        body: mediaBlob,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text().catch(() => "");
        console.error(`Upload failed: ${uploadRes.status} ${errText}`);
        throw new Error(`Upload failed (${sizeMB}MB, status ${uploadRes.status}). Please try again.`);
      }

      // Step 3: Submit metadata to the API
      const res = await fetch(`/api/memory-requests/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recorder_name: recorderName || null,
          audio_url: urlData.publicUrl,
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

  async function handlePhotoSubmit() {
    if (selectedPhotos.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      // Re-check slot availability before uploading
      const checkRes = await fetch(`/api/memory-requests/${code}`);
      if (checkRes.ok) {
        const fresh = await checkRes.json();
        if (fresh.photo_slots_left <= 0) {
          setRequest(fresh);
          throw new Error("All photo slots are now filled.");
        }
        if (fresh.photo_slots_left < selectedPhotos.length) {
          setRequest(fresh);
          throw new Error(`Only ${fresh.photo_slots_left} photo slot${fresh.photo_slots_left !== 1 ? "s" : ""} remaining. Please select fewer photos.`);
        }
      }

      for (const photo of selectedPhotos) {
        const contentType = photo.type || "image/jpeg";

        // Step 1: Get a signed upload URL from the server
        const urlRes = await fetch(`/api/memory-requests/${code}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) {
          throw new Error(urlData.error || "Failed to prepare upload");
        }

        // Step 2: Upload directly to Supabase storage via signed URL
        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: photo,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${photo.name}. Please try again.`);
        }

        // Step 3: Submit metadata to the API
        const res = await fetch(`/api/memory-requests/${code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recorder_name: recorderName || null,
            audio_url: urlData.publicUrl,
            message_format: "photo",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to submit photo");
        }
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
                  disabled={submitting}
                  className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Uploading... please wait" : "Submit Recording"}
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
                  disabled={submitting}
                  className="w-full rounded-lg bg-navy px-6 py-3 text-base font-semibold text-cream shadow-md transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? `Uploading${selectedPhotos.length > 1 ? ` (${selectedPhotos.length} photos)` : ""}...`
                    : `Upload ${selectedPhotos.length > 1 ? `${selectedPhotos.length} Photos` : "Photo"}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
