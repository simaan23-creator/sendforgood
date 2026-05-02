// Workaround for the long-standing MediaRecorder webm bug:
// browser-recorded webm files don't include duration in their EBML header
// (the recorder writes the header before knowing the recording's length).
// Browsers then report `duration === Infinity`, the seek bar jumps to the
// end on play, and currentTime/seek behavior is broken — even though the
// underlying audio/video data is fine.
//
// Standard fix: on `loadedmetadata`, force the element to seek to the
// far end (Number.MAX_SAFE_INTEGER). The browser then has to scan the
// whole stream to find the actual end, which rebuilds the correct
// duration. Once timeupdate fires, snap back to 0.
//
// Usage:  <video onLoadedMetadata={fixWebmDuration} ... />

import type { SyntheticEvent } from "react";

export function fixWebmDuration(e: SyntheticEvent<HTMLMediaElement>) {
  const el = e.currentTarget;
  if (
    el.duration === Infinity ||
    isNaN(el.duration) ||
    el.duration === 0
  ) {
    const onUpdate = () => {
      el.removeEventListener("timeupdate", onUpdate);
      el.currentTime = 0;
    };
    el.addEventListener("timeupdate", onUpdate);
    el.currentTime = Number.MAX_SAFE_INTEGER;
  }
}
