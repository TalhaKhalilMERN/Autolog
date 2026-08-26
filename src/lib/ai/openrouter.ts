/**
 * OpenRouter client helper — server-side only.
 *
 * Wraps the OpenRouter Chat Completions API using a plain fetch call so
 * no extra npm package is required. Supports both simple message exchanges
 * and multi-turn tool-calling (function calling) flows.
 *
 * The OPENROUTER_API_KEY must NEVER be exposed to the browser; this file
 * should only ever be imported from server components or API Route handlers.
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/* ─── Message types ─── */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  /** Present when role === "assistant" and the model wants to call tools. */
  tool_calls?: OpenRouterToolCall[];
  /** Present when role === "tool" — identifies which call this result is for. */
  tool_call_id?: string;
  name?: string;
}

/* ─── Tool call / result types ─── */

export interface OpenRouterToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    /** JSON-encoded string of the arguments object. */
    arguments: string;
  };
}

export interface ToolDefinitionSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/* ─── Request / Response types ─── */

export interface OpenRouterRequestOptions {
  /** OpenRouter model identifier. Defaults to "openrouter/free". */
  model?: string;
  messages: OpenRouterMessage[];
  /** Tool definitions to register with the model. */
  tools?: ToolDefinitionSchema[];
  /** "auto" lets the model decide; "none" disables tool calls. */
  tool_choice?: "auto" | "none";
  /** Max tokens to generate. */
  maxTokens?: number;
  /** Temperature (0–2). */
  temperature?: number;
}

export interface OpenRouterChoice {
  index: number;
  message: OpenRouterMessage;
  finish_reason: "stop" | "tool_calls" | "length" | string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
  };
}

/**
 * Send a chat completion request to OpenRouter.
 * Supports plain messages and tool-calling payloads.
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

  const payload: Record<string, unknown> = {
    model: options.model ?? "openrouter/free",
    messages: options.messages,
    max_tokens: options.maxTokens ?? 512,
    temperature: options.temperature ?? 0.3,
  };

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
    payload.tool_choice = options.tool_choice ?? "auto";
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
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
