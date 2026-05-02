"use client";

import { fixWebmDuration } from "@/lib/fix-webm-duration";

interface Props {
  streamUrl: string;
  downloadUrl: string;
  format: "audio" | "video";
}

export default function MessagePlayer({
  streamUrl,
  downloadUrl,
  format,
}: Props) {
  return (
    <div className="space-y-4">
      {format === "video" ? (
        <video
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={fixWebmDuration}
          src={streamUrl}
          className="w-full rounded-lg bg-black"
        />
      ) : (
        <audio
          controls
          preload="metadata"
          onLoadedMetadata={fixWebmDuration}
          src={streamUrl}
          className="w-full"
        />
      )}
      <div>
        <a
          href={downloadUrl}
          className="inline-flex items-center gap-2 rounded-lg border border-cream-dark bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-cream"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
              clipRule="evenodd"
            />
          </svg>
          Download {format === "video" ? "video" : "audio"}
        </a>
      </div>
    </div>
  );
}
