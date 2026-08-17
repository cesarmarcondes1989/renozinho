import OpenAI from "openai";

/**
 * Server-only OpenAI helper. Never import this from a "use client" component —
 * it reads OPENAI_API_KEY (no NEXT_PUBLIC_ prefix), which must never reach the
 * browser bundle.
 */

export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY não configurada");
    this.name = "MissingOpenAIKeyError";
  }
}

let client: OpenAI | null = null;

/** Lazily constructs (and caches) the OpenAI client. Throws MissingOpenAIKeyError
 * if OPENAI_API_KEY isn't set, so callers can catch it and return a friendly
 * error response instead of crashing the route. */
export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new MissingOpenAIKeyError();
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
