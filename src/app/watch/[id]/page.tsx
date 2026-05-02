// Public watch page for voice/video messages sent via SendForGood. Linked
// to from recipient emails. Validates an HMAC token bound to the message
// id, then renders a player wrapper that applies the webm Infinity-
// duration workaround (browser-recorded webm files don't have duration in
// the EBML header) and exposes a real Download button via a signed URL
// with Content-Disposition: attachment.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyWatchToken } from "@/lib/watch-token";
import MessagePlayer from "@/components/MessagePlayer";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

function ErrorScreen({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl border border-cream-dark bg-white p-10 shadow-md">
          <span className="text-5xl">{emoji}</span>
          <h1 className="mt-4 text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-3 text-warm-gray">{message}</p>
        </div>
      </div>
    </main>
  );
}

export default async function WatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { t } = await searchParams;

  if (!verifyWatchToken(id, t)) {
    return (
      <ErrorScreen
        emoji="\u{1F512}"
        title="Link expired or invalid"
        message="This link is no longer valid. Ask the sender to resend the message."
      />
    );
  }

  const { data: message } = await supabaseAdmin
    .from("voice_messages")
    .select(
      "id, title, message_format, duration_seconds, milestone_label, recipient_name, audio_url, user_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (!message || !message.audio_url) {
    return (
      <ErrorScreen
        emoji="\u{1F614}"
        title="Message not found"
        message="This message may have been removed."
      />
    );
  }

  const { data: sender } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", message.user_id)
    .maybeSingle();
  const senderName =
    sender?.full_name || sender?.email || "Someone who cares";

  const path = message.audio_url.startsWith("voice-messages/")
    ? message.audio_url.replace("voice-messages/", "")
    : message.audio_url;

  // Use the file's actual extension for the download filename so the
  // recipient's OS opens it in the right app.
  const pathExt = (path.split(".").pop() || "webm").toLowerCase();
  const safeTitle = (message.title || "message").replace(
    /[^a-z0-9_-]+/gi,
    "-"
  );
  const filename = `${safeTitle}.${pathExt}`;

  const [streamRes, downloadRes] = await Promise.all([
    supabaseAdmin.storage
      .from("voice-messages")
      .createSignedUrl(path, 60 * 60 * 24 * 30),
    supabaseAdmin.storage
      .from("voice-messages")
      .createSignedUrl(path, 60 * 60 * 24 * 30, { download: filename }),
  ]);

  if (!streamRes.data?.signedUrl || !downloadRes.data?.signedUrl) {
    return (
      <ErrorScreen
        emoji="\u{1F61E}"
        title="Could not load message"
        message="There was a problem loading this recording."
      />
    );
  }

  const isVideo = message.message_format === "video";

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-cream-dark bg-white p-6 text-center shadow-md sm:p-10">
          <span className="text-5xl">{isVideo ? "\u{1F3AC}" : "\u{1F3A4}"}</span>
          <p className="mt-5 text-sm text-warm-gray">
            A {isVideo ? "video" : "voice"} message
            {message.recipient_name ? ` for ${message.recipient_name}` : ""}
          </p>
          {message.title && (
            <h1 className="mt-2 text-2xl font-bold text-navy">
              {message.title}
            </h1>
          )}
          <p className="mt-1 text-sm text-warm-gray">
            From <span className="font-medium text-navy">{senderName}</span>
            {message.milestone_label ? (
              <>
                {" "}
                &middot; held until{" "}
                <span className="font-medium text-navy">
                  {message.milestone_label}
                </span>
              </>
            ) : null}
          </p>

          <div className="mt-8 text-left">
            <MessagePlayer
              streamUrl={streamRes.data.signedUrl}
              downloadUrl={downloadRes.data.signedUrl}
              format={(message.message_format as "audio" | "video") ?? "audio"}
            />
          </div>

          {message.duration_seconds ? (
            <p className="mt-4 text-xs text-warm-gray-light">
              {Math.floor(message.duration_seconds / 60)}:
              {(message.duration_seconds % 60).toString().padStart(2, "0")} long
            </p>
          ) : null}

          <p className="mt-10 text-sm text-warm-gray">
            Delivered with care by{" "}
            <span className="font-semibold text-navy">SendForGood</span>
          </p>
        </div>
      </div>
    </main>
  );
}
