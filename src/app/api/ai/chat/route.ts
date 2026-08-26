import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openRouterChat, type OpenRouterMessage } from "@/lib/ai/openrouter";
import { AI_TOOL_DEFINITIONS, AI_TOOL_EXECUTORS } from "@/lib/ai/tools";

/**
 * POST /api/ai/chat
 *
 * Authenticated AI chat endpoint with tool-calling support.
 *
 * Flow:
 *   1. Verify the caller's session via Supabase server-side auth.
 *   2. Send the user's message + tool definitions to OpenRouter.
 *   3. If the model requests tool calls, execute each one server-side
 *      (userId always comes from the verified session, never from the model).
 *   4. Feed tool results back to the model for a final natural-language answer.
 *   5. Return the final answer as JSON.
 *
 * The model can call tools at most MAX_TOOL_ROUNDS times per request to
 * prevent runaway loops.
 */

const SYSTEM_PROMPT = `You are AutoLog AI, an intelligent assistant for the AutoLog vehicle management application.

You help users understand their vehicle data by calling the available tools to retrieve real data from their garage.

Guidelines:
- Always call the relevant tool(s) before answering data-related questions.
- If the user asks about a specific vehicle by name/model, call getVehicles first to look up its ID, then use that ID in subsequent tool calls.
- Summarise retrieved data clearly and concisely in natural language.
- Format currency as USD with 2 decimal places. Format dates as human-readable (e.g. "August 15, 2026").
- If no data is found for a query, say so politely and suggest what the user can add.
- Do not invent data. Only describe what the tools actually return.
- Keep your responses focused and helpful.
- Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

const MAX_TOOL_ROUNDS = 4; // prevent infinite loops

export async function POST(request: Request) {
  /* ── 1. Verify authentication ── */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* ── 2. Parse request body ── */
  let body: { message?: string; conversationHistory?: OpenRouterMessage[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  /* ── 3. Build message history ── */
  const messages: OpenRouterMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(body.conversationHistory ?? []),
    { role: "user", content: body.message.trim() },
  ];

  /* ── 4. Tool-calling loop ── */
  const toolCallLog: Array<{ tool: string; args: Record<string, unknown>; resultSummary: string }> = [];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    let response;
    try {
      response = await openRouterChat({
        model: "openrouter/free",
        messages,
        tools: AI_TOOL_DEFINITIONS,
        tool_choice: "auto",
        maxTokens: 1024,
        temperature: 0.3,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
    }

    const choice = response.choices?.[0];
    if (!choice) {
      return NextResponse.json({ error: "No response from AI model" }, { status: 500 });
    }

    const assistantMessage = choice.message;

    /* ── 4a. Model wants to call tools ── */
    if (choice.finish_reason === "tool_calls" && assistantMessage.tool_calls?.length) {
      // Append the assistant's tool-call request to the conversation
      messages.push(assistantMessage);

      // Execute each requested tool in parallel
      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const toolName = toolCall.function.name;
          const executor = AI_TOOL_EXECUTORS[toolName];

          let resultData: unknown;
          if (!executor) {
            resultData = { error: `Unknown tool: ${toolName}` };
          } else {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              args = {};
            }

            // SECURITY: userId is always from the verified session
            resultData = await executor(supabase, user.id, args);

            toolCallLog.push({
              tool: toolName,
              args,
              resultSummary: JSON.stringify(resultData).slice(0, 200) + "...",
            });
          }

          // Return the tool result message
          return {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(resultData),
          };
        })
      );

      // Append all tool results to the conversation
      messages.push(...toolResults);

      // Continue the loop — model will generate a response using the tool data
      continue;
    }

    /* ── 4b. Model returned a final text response ── */
    const finalReply = assistantMessage.content ?? "(no response)";

    return NextResponse.json({
      reply: finalReply,
      model: response.model,
      toolsUsed: toolCallLog.map((t) => t.tool),
      toolCallLog,
      usage: response.usage ?? null,
    });
  }

  // Exceeded tool rounds — return whatever the last message was
  return NextResponse.json({
    error: "Tool call limit exceeded. The model required too many tool calls to answer this question.",
    toolCallLog,
  }, { status: 500 });
}
