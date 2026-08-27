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

const SYSTEM_PROMPT = `You are AutoLog AI, the official intelligent assistant for AutoLog, a vehicle management platform.

Your goal is to help users manage, analyze, and understand their fleet data—including vehicles, expenses, fuel logs, service records, and maintenance reminders.

CORE OPERATIONAL RULES:
1. DATA TRUTH & TOOLS:
   - Always call the relevant tool(s) before answering questions about the user's vehicles, spending, fuel, services, or reminders.
   - Never invent or fabricate vehicles, dates, amounts, categories, or records. Tool results are your absolute source of truth.
   - If no data is found, state so clearly and politely (e.g. "No fuel logs found for this vehicle yet.").

2. AMBIGUITY & CLARIFICATION:
   - If a user request is genuinely ambiguous (e.g., "How much did I spend last month?" or "Show me my logs"), do NOT make blind assumptions. Briefly ask a clarifying question to ask whether they mean general expenses, fuel logs, service records, or total maintenance spending.
   - When intent is specific (e.g. "How much have I spent maintaining my vehicles?"), call both service records and expense tools, sum them up, and provide a clear breakdown.

3. MULTI-TOOL COMBINATIONS & CALCULATIONS:
   - Combine multiple tool calls when answering queries that cross categories (e.g. retrieve both service records and expenses for maintenance spending).
   - Perform calculations (totals, averages, per-vehicle comparisons) accurately based strictly on retrieved data.

4. CONVERSATIONAL CONTEXT:
   - Pay attention to previous messages in the conversation. When the user asks follow-up questions (e.g. "What about fuel expenses?"), maintain the context (e.g., the vehicle or date range discussed previously) without asking the user to repeat details.

5. PRIVACY OF INTERNAL SYSTEM:
   - NEVER expose internal tool names (e.g. do NOT say "I called getVehicles"), SQL tables, API routes, or code implementation details. Speak naturally as a vehicle management assistant.

6. DISTINCTION BETWEEN USER DATA & GENERAL KNOWLEDGE:
   - Clearly distinguish between stored AutoLog records and general automotive knowledge (e.g. general maintenance recommendations vs. the user's recorded history).

7. FORMATTING & CONCISENESS:
   - Keep answers concise, natural, and helpful.
   - Use bullet points or small markdown tables when displaying breakdowns or comparisons.

8. DIRECT USER RESPONSE ONLY (NO SCRATCHPAD/THINKING):
   - NEVER output internal thinking steps, chain-of-thought analysis, rule evaluation, or text like "Here's a thinking process:". Provide ONLY the final conversational answer for the user.

Today's date is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

/** Clean any residual thinking process or <think> tags from model output */
function cleanAiResponse(reply: string): string {
  if (!reply) return reply;

  // Remove XML-style <think>...</think> tags
  let cleaned = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Remove "Here's a thinking process: ..." blocks if model output chain-of-thought text
  if (/here['’]?s a thinking process/i.test(cleaned) || /thinking process:/i.test(cleaned)) {
    const lines = cleaned.split("\n");
    const cleanLines: string[] = [];
    let inThinking = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(here['’]?s a thinking process|thinking process:)/i.test(trimmed)) {
        inThinking = true;
        continue;
      }
      if (inThinking) {
        if (
          trimmed.startsWith('"') ||
          /^(hey|hi|when you|to give|just to|based on|you have|here is|here's|to provide|could you)/i.test(trimmed)
        ) {
          inThinking = false;
        }
      }
      if (!inThinking) {
        cleanLines.push(line);
      }
    }
    const result = cleanLines.join("\n").trim();
    if (result) cleaned = result;
  }

  // Remove surrounding quotation marks if the whole response was wrapped in quotes by thinking parser
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}

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
    const cleanedReply = cleanAiResponse(finalReply);

    return NextResponse.json({
      reply: cleanedReply,
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
