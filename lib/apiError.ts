import { NextResponse } from "next/server";
import { MissingOpenAIKeyError } from "./openai";

/** Turns a route handler error into a friendly JSON response. Missing API key
 * (or missing Supabase config) becomes a 503 the UI can show inline instead
 * of a blank crash; anything else becomes a generic 500. */
export function aiErrorResponse(err: unknown) {
  if (err instanceof MissingOpenAIKeyError) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
  const message = err instanceof Error ? err.message : "Erro inesperado";
  console.error("[api/ai] erro:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}
