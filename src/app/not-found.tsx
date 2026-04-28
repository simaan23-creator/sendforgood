import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found — SendForGood",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-16 text-center">
      <p className="text-sm uppercase tracking-widest text-gray-500 mb-4">
        404
      </p>
      <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-4">
        We couldn&rsquo;t find that page
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        The page you were looking for may have moved, or it never existed.
        Let&rsquo;s get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="rounded-md bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition"
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
