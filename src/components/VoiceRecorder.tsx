"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type MediaFormat = "audio" | "video";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  onFormatChange?: (format: MediaFormat) => void;
  maxDurationSeconds?: number;
  defaultFormat?: MediaFormat;
  showFormatToggle?: boolean;
  disableAudio?: boolean;
  disableVideo?: boolean;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onFormatChange,
  maxDurationSeconds = 120,
  defaultFormat = "audio",
  showFormatToggle = true,
  disableAudio = false,
  disableVideo = false,
}: VoiceRecorderProps) {
  const [format, setFormat] = useState<MediaFormat>(defaultFormat);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const elapsedRef = useRef(0);
  const onCompleteRef = useRef(onRecordingComplete);

  // Keep the callback ref up to date without causing re-renders
  useEffect(() => {
    onCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Attach camera stream to video preview after the element renders
  useEffect(() => {
    if (isRecording && format === "video" && videoPreviewRef.current && streamRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [isRecording, format]);

  function handleFormatChange(newFormat: MediaFormat) {
    if (isRecording) return;
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
      setElapsed(0);
      elapsedRef.current = 0;
      chunksRef.current = [];
    }
    setFormat(newFormat);
    onFormatChange?.(newFormat);
  }

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    setIsRecording(false);
    setIsPaused(false);
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= maxDurationSeconds) {
        // Auto-stop: directly stop recorder and clear timer
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
        clearTimer();
        setIsRecording(false);
        setIsPaused(false);
      }
    }, 1000);
  }, [maxDurationSeconds, clearTimer]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const constraints: MediaStreamConstraints =
        format === "video"
          ? { audio: true, video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } } }
          : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType =
        format === "video"
          ? MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : "video/webm"
          : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm";

      const recorderOptions: MediaRecorderOptions = { mimeType };
      if (format === "video") {
        recorderOptions.videoBitsPerSecond = 4_000_000; // 4 Mbps — 1080p HD, ~60 MB for 2 min
      }
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        onCompleteRef.current(blob, elapsedRef.current);
        stream.getTracks().forEach((t) => t.stop());
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      recorder.start(1000);
      elapsedRef.current = 0;
      setElapsed(0);
      setIsRecording(true);
      setIsPaused(false);
      setMediaUrl(null);
      startTimer();
    } catch {
      setError(
        format === "video"
          ? "Camera and microphone access are required for video messages. Please allow access and try again."
          : "Microphone access is required to record a voice message. Please allow microphone access and try again."
      );
    }
  }, [startTimer, format]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      clearTimer();
      setIsPaused(true);
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setIsPaused(false);
    }
  }, [startTimer]);

  const discardRecording = useCallback(() => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    setMediaUrl(null);
    setElapsed(0);
    elapsedRef.current = 0;
    chunksRef.current = [];
  }, [mediaUrl]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-2xl border border-cream-dark bg-white p-6">
      {/* Format toggle */}
      {showFormatToggle && !isRecording && !mediaUrl && !disableAudio && !disableVideo && (
        <div className="mb-5 flex items-center justify-center gap-1 rounded-lg bg-cream p-1">
          <button
            type="button"
            onClick={() => handleFormatChange("audio")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
              format === "audio"
                ? "bg-white text-navy shadow-sm"
                : "text-warm-gray hover:text-navy"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5 inline h-4 w-4">
              <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
              <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
            </svg>
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => handleFormatChange("video")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition ${
              format === "video"
                ? "bg-white text-navy shadow-sm"
                : "text-warm-gray hover:text-navy"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mr-1.5 inline h-4 w-4">
              <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
            </svg>
            Video Message
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Video live preview */}
      {format === "video" && isRecording && (
        <div className="relative mb-5 overflow-hidden rounded-xl bg-black">
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            className="mx-auto aspect-video w-full max-w-md object-cover"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            Video
          </span>
          <button
            type="button"
            onClick={() => setMirrored((m) => !m)}
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-black/70"
            title={mirrored ? "Un-mirror preview" : "Mirror preview"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0 .04 1.06l2.1 1.95H6.75a.75.75 0 0 0 0 1.5h8.59l-2.1 1.95a.75.75 0 1 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 0 0-1.06.04Zm-6.4 8a.75.75 0 0 0-1.06-.04l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h8.59a.75.75 0 0 0 0-1.5H4.66l2.1-1.95a.75.75 0 0 0 .04-1.06Z" clipRule="evenodd" />
            </svg>
            {mirrored ? "Mirrored" : "Normal"}
          </button>
        </div>
      )}

      {/* Timer display */}
      <div className="mb-6 text-center">
        <p className="text-4xl font-bold tabular-nums text-navy">
          {formatTime(elapsed)}
        </p>
        <p className="mt-1 text-xs text-warm-gray">
          {formatTime(maxDurationSeconds)} max
        </p>
        {/* Progress bar */}
        <div className="mx-auto mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-cream-dark">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              elapsed / maxDurationSeconds > 0.8 ? "bg-red-400" : "bg-gold"
            }`}
            style={{ width: `${Math.min((elapsed / maxDurationSeconds) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isRecording && !mediaUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            {format === "video" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            )}
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <button
                type="button"
                onClick={resumeRecording}
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-navy-light"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseRecording}
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-navy-light"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                </svg>
                Pause
              </button>
            )}
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          </>
        )}

        {isRecording && !isPaused && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Recording
          </span>
        )}
        {isRecording && isPaused && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
            Paused
          </span>
        )}
      </div>

      {/* Playback */}
      {mediaUrl && !isRecording && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-cream p-4">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-medium text-warm-gray">Preview your recording:</p>
              {format === "video" && (
                <span className="rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
                  Video
                </span>
              )}
            </div>
            {format === "video" ? (
              <video controls src={mediaUrl} className="w-full rounded-lg" />
            ) : (
              <audio controls src={mediaUrl} className="w-full" />
            )}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={discardRecording}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cream-dark px-4 py-2 text-sm font-medium text-warm-gray transition hover:bg-cream-dark"
            >
              Re-record
            </button>
            <span className="text-xs text-forest font-medium">
              Recording saved ({formatTime(elapsed)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
