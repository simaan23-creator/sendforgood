"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  maxDurationSeconds?: number;
}

export default function VoiceRecorder({
  onRecordingComplete,
  maxDurationSeconds = 300,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }, [maxDurationSeconds]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob, elapsed);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setElapsed(0);
      setAudioUrl(null);
      startTimer();
    } catch {
      setError(
        "Microphone access is required to record a voice message. Please allow microphone access and try again."
      );
    }
  }, [onRecordingComplete, elapsed, startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimer();
      setIsPaused(false);
    }
  }, [startTimer]);

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsed(0);
    chunksRef.current = [];
  }, [audioUrl]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-2xl border border-cream-dark bg-white p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
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
        {!isRecording && !audioUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
              <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
            </svg>
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

        {isRecording && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            {isPaused ? "Paused" : "Recording"}
          </span>
        )}
      </div>

      {/* Playback */}
      {audioUrl && !isRecording && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-cream p-4">
            <p className="mb-2 text-xs font-medium text-warm-gray">Preview your recording:</p>
            <audio controls src={audioUrl} className="w-full" />
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
