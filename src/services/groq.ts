import { log } from '../utils/logger';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 60_000;

export interface ChatJSONOptions {
  model?: string;
  temperature?: number;
}

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Groq sends retry-after in seconds on 429; otherwise back off 1s, 2s, 4s.
function retryDelayMs(res: Response, attempt: number): number {
  const retryAfter = Number(res.headers.get('retry-after'));
  if (retryAfter > 0) return Math.min(retryAfter * 1000, 30_000);
  return 1000 * 2 ** attempt;
}

/**
 * Sends a chat request to Groq in JSON mode and returns the parsed object.
 * Retries on rate limits (429) and temporary server errors (5xx).
 * Note: JSON mode requires the word "JSON" to appear in the prompt.
 */
export async function chatJSON<T = unknown>(
  system: string,
  user: string,
  { model = DEFAULT_MODEL, temperature = 0.3 }: ChatJSONOptions = {},
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_RETRIES) {
      const delay = retryDelayMs(res, attempt);
      log(`[groq] ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await res.body?.cancel();
      await sleep(delay);
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq API error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as GroqChatResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned an empty response');

    try {
      return JSON.parse(content) as T;
    } catch {
      throw new Error(`Groq returned invalid JSON: ${content}`);
    }
  }
}
