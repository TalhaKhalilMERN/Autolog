/**
 * OpenRouter client helper — server-side only.
 *
 * This module is intentionally kept simple for the initial connection test.
 * It wraps the OpenRouter Chat Completions API using a plain fetch call so
 * no extra npm package is required. The OPENROUTER_API_KEY must NEVER be
 * exposed to the browser; this file should only ever be imported from
 * server components or API Route handlers.
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequestOptions {
  /** OpenRouter model identifier. Defaults to "openrouter/free" (free-tier router). */
  model?: string;
  messages: OpenRouterMessage[];
  /** Max tokens to generate. */
  maxTokens?: number;
  /** Temperature (0–2). */
  temperature?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a chat completion request to OpenRouter.
 *
 * @throws {Error} if the API key is missing or the upstream request fails.
 */
export async function openRouterChat(
  options: OpenRouterRequestOptions
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("OPENROUTER_API_KEY is not configured in environment variables.");
  }

  const payload = {
    model: options.model ?? "openrouter/free",
    messages: options.messages,
    max_tokens: options.maxTokens ?? 256,
    temperature: options.temperature ?? 0.2,
  };

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter recommends identifying your app in the request headers.
      "HTTP-Referer": "https://autolog.app",
      "X-Title": "AutoLog",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `OpenRouter API error (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  return data;
}
