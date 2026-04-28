/**
 * Structured logging helper.
 *
 * Emits one JSON object per log line so any log drain (Axiom, Logflare,
 * BetterStack, Datadog) can parse it without regex. In dev we print plain
 * lines for readability.
 *
 * Usage:
 *   import { log } from "@/lib/log";
 *   log.info("webhook.received", { event_id, type });
 *   log.error("webhook.failed", { event_id }, err);
 *
 * Don't put PII (emails, names, addresses) in `context`. Use opaque IDs.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function emit(
  level: LogLevel,
  event: string,
  context?: Record<string, unknown>,
  err?: unknown
) {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(context || {}),
  };

  if (err !== undefined) {
    if (err instanceof Error) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    } else {
      payload.error = { message: String(err) };
    }
  }

  const line = isProd ? JSON.stringify(payload) : `[${level}] ${event} ${JSON.stringify({ ...context, ...(err ? { error: payload.error } : {}) })}`;

  // Route through standard streams so Vercel captures them.
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  debug: (event: string, context?: Record<string, unknown>) =>
    emit("debug", event, context),
  info: (event: string, context?: Record<string, unknown>) =>
    emit("info", event, context),
  warn: (event: string, context?: Record<string, unknown>, err?: unknown) =>
    emit("warn", event, context, err),
  error: (event: string, context?: Record<string, unknown>, err?: unknown) =>
    emit("error", event, context, err),
};
