"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercel captures this in function logs.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">
        Something went wrong
      </p>
      <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-4">
        We hit an unexpected snag
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        Sorry about that. Try again, or head back home and try a different
        path. If this keeps happening, let us know.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6 font-mono">
          Reference: {error.digest}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="rounded-md border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
