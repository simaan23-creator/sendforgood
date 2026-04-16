"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function WeddingKitPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const code = searchParams.get("code") || "";
  const vaultLink = `https://sendforgood.com/record/${code}`;
  const qrUrl = `https://api.qrserver.com/create-qr-code/?size=300x300&data=${encodeURIComponent(vaultLink)}`;

  const [coupleNames, setCoupleNames] = useState("");
  const [anniversaryYears, setAnniversaryYears] = useState("");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const tableCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?redirect=/vault/wedding-kit" + (code ? `?code=${code}` : ""));
        return;
      }
      // Load saved values from localStorage
      const saved = localStorage.getItem("sfg_wedding_kit");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.coupleNames) setCoupleNames(parsed.coupleNames);
          if (parsed.anniversaryYears) setAnniversaryYears(parsed.anniversaryYears);
        } catch {}
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router, code]);

  // Save to localStorage when values change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(
        "sfg_wedding_kit",
        JSON.stringify({ coupleNames, anniversaryYears })
      );
    }
  }, [coupleNames, anniversaryYears, loading]);

  const names = coupleNames || "[Couple Names]";
  const years = anniversaryYears || "[X]";
  const anniversaryLabel = `${years}${anniversaryYears ? getSuffix(Number(anniversaryYears)) : "th"} anniversary`;

  function getSuffix(n: number): string {
    if (n % 100 >= 11 && n % 100 <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  function copyToClipboard(text: string, sectionId: string) {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  function copyLink() {
    navigator.clipboard.writeText(vaultLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function downloadQr() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "wedding-vault-qr.png";
    a.target = "_blank";
    a.click();
  }

  function printTableCard() {
    const printContents = tableCardRef.current;
    if (!printContents) return;
    const w = window.open("", "", "width=800,height=600");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Wedding Table Card</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
            .card { width: 5in; padding: 1.5in 0.75in; border: 3px solid #C8A962; border-radius: 12px; text-align: center; font-family: Georgia, serif; }
            .card .emoji { font-size: 48px; }
            .card h2 { font-size: 22px; color: #1B2A4A; margin: 16px 0 8px; }
            .card p { font-size: 14px; color: #555; margin: 8px 0; line-height: 1.5; }
            .card .qr { margin: 20px auto; }
            .card .qr img { width: 200px; height: 200px; }
            .card .small { font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="emoji">\uD83C\uDFAC</div>
            <h2>Record a Video Message for ${names.replace(/'/g, "\\'")}</h2>
            <p>We are sealing these messages until our ${anniversaryLabel}.</p>
            <p>Scan the QR code to record &mdash; takes less than 2 minutes.</p>
            <div class="qr"><img src="${qrUrl}" alt="QR Code" /></div>
            <p class="small">No app or account needed.</p>
          </div>
        </body>
      </html>
    `);
    w.document.close();
    // Wait for QR image to load before printing
    const img = w.document.querySelector("img");
    if (img) {
      img.onload = () => { w.print(); w.close(); };
      img.onerror = () => { w.print(); w.close(); };
    } else {
      w.print();
      w.close();
    }
  }

  // Template texts
  const invitationText = `We are creating a Memory Vault to celebrate our wedding day.

We would love for you to record a short video message for us — share a memory, a wish, a piece of advice, or just say hello.

We are sealing the vault until our ${anniversaryLabel}. We will watch all your messages together on that special day.

Record your message here: ${vaultLink}

(Takes less than 2 minutes — no account needed!)`;

  const mcScript = `Good evening everyone! Before we get to the dancing, I have a special request from ${names}.

They have created something really unique — a Memory Vault. Every message recorded tonight will be sealed until their ${anniversaryLabel}, when they will watch them all together.

Please take out your phone, scan the QR code on your table, and record a short video message for the couple. It takes less than 2 minutes and no account is needed.

${names} — this one is for you. Thank you all!`;

  const guestText = `Hi [Name]!

We are so excited to celebrate with you at our wedding. We wanted to share something special — we have created a Memory Vault where guests can leave us a video message.

We are sealing all the messages until our ${anniversaryLabel} and watching them together on that day. It would mean the world to us to have a message from you.

Record yours here (takes under 2 minutes, no account needed): ${vaultLink}

See you soon! \u2764\uFE0F
${names}`;

  const websiteCopy = `Leave Us a Video Message \uD83C\uDFAC

We are creating a Memory Vault of video messages from our guests. Record a short message — a wish, a memory, a piece of advice — and we will seal it until our ${anniversaryLabel}.

No account needed. Takes less than 2 minutes.

\uD83D\uDC49 ${vaultLink}`;

  const tips = [
    "Place QR codes on every table (not just some)",
    "Ask your MC to announce it before dancing starts (people leave early)",
    "Send the guest link 1 week before AND day-of",
    "Put the link on your wedding website",
    "Remind guests at the rehearsal dinner too",
    "Make it fun — tell people it is a time capsule!",
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Back link */}
        <Link
          href="/vault/my"
          className="mb-6 inline-flex items-center gap-1 text-sm text-warm-gray transition hover:text-navy"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to My Vaults
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy">Your Wedding Kit</h1>
          <p className="mt-2 text-warm-gray">
            Everything you need to collect video messages from your guests.
          </p>
        </div>

        {/* Editable fields */}
        <div className="mb-8 rounded-xl border border-cream-dark bg-white p-5">
          <p className="mb-3 text-sm font-medium text-navy">Personalize Your Kit</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-gray">
                Couple Names
              </label>
              <input
                type="text"
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                placeholder="e.g. Simaan & Lauren"
                className="w-full rounded-lg border border-cream-dark bg-cream/30 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-warm-gray">
                Sealed for how many years?
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={anniversaryYears}
                onChange={(e) => setAnniversaryYears(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-lg border border-cream-dark bg-cream/30 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-warm-gray">
            These values auto-fill into all the templates below.
          </p>
        </div>

        {/* Vault Link & QR */}
        <div className="mb-8 rounded-xl border border-cream-dark bg-white p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-navy">Your Vault Link</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border border-cream-dark bg-cream/30 px-3 py-2 text-sm text-navy">
                  {vaultLink}
                </code>
                <button
                  onClick={copyLink}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    linkCopied
                      ? "bg-forest/10 text-forest"
                      : "bg-navy text-cream hover:bg-navy-light"
                  }`}
                >
                  {linkCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <img
                src={qrUrl}
                alt="QR Code for vault link"
                className="h-[150px] w-[150px] rounded-lg border border-cream-dark"
              />
              <button
                onClick={downloadQr}
                className="rounded-lg border border-cream-dark px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-cream-dark"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Table Card */}
        <Section title="Printable Table Card">
          <div
            ref={tableCardRef}
            className="mx-auto max-w-sm rounded-xl border-[3px] border-gold bg-white px-8 py-10 text-center"
          >
            <p className="text-5xl">{"\uD83C\uDFAC"}</p>
            <h3 className="mt-4 text-xl font-bold text-navy">
              Record a Video Message for {names}
            </h3>
            <p className="mt-3 text-sm text-warm-gray">
              We are sealing these messages until our {anniversaryLabel}.
            </p>
            <p className="mt-2 text-sm text-warm-gray">
              Scan the QR code to record &mdash; takes less than 2 minutes.
            </p>
            <div className="mt-5 flex justify-center">
              <img
                src={qrUrl}
                alt="QR Code"
                className="h-[160px] w-[160px]"
              />
            </div>
            <p className="mt-3 text-xs text-warm-gray/70">
              No app or account needed.
            </p>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={printTableCard}
              className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-navy-light"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.06.734.168 1.063.323a3.203 3.203 0 0 1 1.77 2.153 49.182 49.182 0 0 1 0 7.444A3.185 3.185 0 0 1 14.268 19H5.732a3.185 3.185 0 0 1-3.028-2.777 49.147 49.147 0 0 1 0-7.444 3.203 3.203 0 0 1 1.77-2.153c.329-.155.686-.263 1.063-.323V2.75ZM6.5 6.19V2.75a.25.25 0 0 1 .25-.25h6.5a.25.25 0 0 1 .25.25V6.19a50.824 50.824 0 0 0-7 0Zm6.22 5.06a.75.75 0 1 0-1.44-.42l-1.03 3.572-1.03-3.572a.75.75 0 0 0-1.44.42l1.75 6a.75.75 0 0 0 1.44 0l1.75-6Z" clipRule="evenodd" />
              </svg>
              Print This Card
            </button>
          </div>
        </Section>

        {/* Section 2: Invitation Insert */}
        <Section
          title="Invitation Insert Text"
          copyText={invitationText}
          sectionId="invitation"
          copiedSection={copiedSection}
          onCopy={copyToClipboard}
        >
          <TextBlock text={invitationText} />
        </Section>

        {/* Section 3: MC Announcement Script */}
        <Section
          title="DJ / MC Announcement Script"
          copyText={mcScript}
          sectionId="mc"
          copiedSection={copiedSection}
          onCopy={copyToClipboard}
        >
          <TextBlock text={mcScript} />
        </Section>

        {/* Section 4: Text/Email to Guests */}
        <Section
          title="Send to Your Guest List"
          copyText={guestText}
          sectionId="guest"
          copiedSection={copiedSection}
          onCopy={copyToClipboard}
        >
          <TextBlock text={guestText} />
        </Section>

        {/* Section 5: Wedding Website Copy */}
        <Section
          title="Add to Your Wedding Website"
          copyText={websiteCopy}
          sectionId="website"
          copiedSection={copiedSection}
          onCopy={copyToClipboard}
        >
          <TextBlock text={websiteCopy} />
        </Section>

        {/* Section 6: Tips */}
        <Section title="Tips for Maximum Participation">
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-navy">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-forest" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}

/* ── Helper Components ── */

function Section({
  title,
  copyText,
  sectionId,
  copiedSection,
  onCopy,
  children,
}: {
  title: string;
  copyText?: string;
  sectionId?: string;
  copiedSection?: string | null;
  onCopy?: (text: string, id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 rounded-xl border border-cream-dark bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        {copyText && sectionId && onCopy && (
          <button
            onClick={() => onCopy(copyText, sectionId)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              copiedSection === sectionId
                ? "bg-forest/10 text-forest"
                : "bg-cream text-navy hover:bg-cream-dark"
            }`}
          >
            {copiedSection === sectionId ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  return (
    <pre className="whitespace-pre-wrap rounded-lg border border-cream-dark bg-cream/30 p-4 text-sm leading-relaxed text-navy font-sans">
      {text}
    </pre>
  );
}
