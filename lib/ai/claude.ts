/**
 * Shared Anthropic client + model config for Valor AI Tools.
 *
 * All AI routes import `anthropic` and `AI_MODEL` from here so the model id is
 * controlled centrally via the ANTHROPIC_MODEL env var (never hardcoded).
 */

import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
  // The API intermittently returns 5xx api_error; the SDK retries these with
  // backoff. Raise the default (2) so transient blips don't surface to users.
  maxRetries: 5,
});

/** Central model id. Bump via the ANTHROPIC_MODEL env var, not in code. */
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Extract the first JSON object or array from a model text response.
 * Claude often wraps JSON in prose or ```json fences; this digs it out.
 * Returns null when nothing parseable is found.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // Prefer fenced blocks first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates: string[] = [];
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const obj = text.match(/\{[\s\S]*\}/);
  const arr = text.match(/\[[\s\S]*\]/);
  if (obj) candidates.push(obj[0]);
  if (arr) candidates.push(arr[0]);
  for (const c of candidates) {
    try {
      return JSON.parse(c) as T;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

/** Pull the concatenated text out of a non-streaming Messages response. */
export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}
