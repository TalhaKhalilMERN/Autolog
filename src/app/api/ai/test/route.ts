import { NextResponse } from "next/server";
import { openRouterChat } from "@/lib/ai/openrouter";

/**
 * GET /api/ai/test
 *
 * Server-side connection test for the OpenRouter integration.
 * Sends a minimal prompt to the free-tier OpenRouter router and
 * returns the model's response as JSON.
 *
 * This route does NOT require authentication intentionally — it is
 * a development/health-check endpoint only.
 *
 * The OPENROUTER_API_KEY is read exclusively on the server; it is
 * never included in any client bundle or response body.
 */
export async function GET() {
  // Guard: ensure the key is present before hitting OpenRouter.
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "OPENROUTER_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  try {
    const result = await openRouterChat({
      model: "openrouter/free", // Free-tier router — OpenRouter picks the best available free model.
      messages: [
        {
          role: "user",
          content: 'Respond with exactly: "AutoLog AI connection successful."',
        },
      ],
      maxTokens: 32,
      temperature: 0,
    });

    const reply = result.choices?.[0]?.message?.content ?? "(no content returned)";
    const modelUsed = result.model ?? "unknown";

    return NextResponse.json({
      success: true,
      message: "OpenRouter connection test passed.",
      modelUsed,
      reply,
      usage: result.usage ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
