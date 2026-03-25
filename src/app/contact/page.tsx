"use client";

import { useState } from "react";
import { Metadata } from "next";

// Metadata must be exported from a server component, so we use a separate
// generateMetadata approach or set it via the layout.  For client pages, we set
// it through a head tag workaround or a parallel file. Here we keep it simple.

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Get in Touch</h1>
          <p className="mt-3 text-lg text-warm-gray leading-relaxed">
            Have a question, suggestion, or just want to say hello? We&rsquo;d
            love to hear from you.
          </p>
        </div>

        {/* Direct email */}
        <div className="mt-10 rounded-xl bg-cream-dark p-6 text-center">
          <p className="text-sm text-warm-gray">
            You can also email us directly at
          </p>
          <a
            href="mailto:support@sendforgood.com"
            className="mt-1 inline-block text-lg font-semibold text-navy underline decoration-gold underline-offset-4 hover:text-navy-light"
          >
            support@sendforgood.com
          </a>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-navy"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              placeholder="Your name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-navy"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-navy"
            >
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-cream-dark bg-white px-4 py-3 text-navy placeholder:text-warm-gray-light focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
              placeholder="How can we help?"
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-lg bg-navy px-6 py-3.5 text-base font-semibold text-cream shadow-sm transition hover:bg-navy-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-50 disabled:pointer-events-none sm:w-auto"
          >
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>

          {status === "sent" && (
            <p className="rounded-lg bg-forest/10 px-4 py-3 text-sm font-medium text-forest">
              Thank you! Your message has been sent. We&rsquo;ll get back to you
              soon.
            </p>
          )}

          {status === "error" && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Something went wrong. Please try again or email us directly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
