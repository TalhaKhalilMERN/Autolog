import { NextResponse } from "next/server";
import { sendEmail, DEFAULT_SENDER } from "@/lib/email/resend";

/**
 * [DEVELOPMENT TEST ENDPOINT]
 * GET / POST /api/admin/test-email
 *
 * Sends a single test email via Resend to verify API integration.
 * Example usage:
 *   GET /api/admin/test-email?to=your_resend_email@example.com
 *   POST /api/admin/test-email  Body: { "to": "your_resend_email@example.com" }
 *
 * SECURITY:
 *   - Only runs server-side.
 *   - Does NOT expose secrets or RESEND_API_KEY.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipient = searchParams.get("to");

  if (!recipient || !recipient.trim()) {
    return NextResponse.json(
      {
        error: "Missing required 'to' query parameter. Usage: /api/admin/test-email?to=your_email@domain.com",
        example: "/api/admin/test-email?to=user@example.com",
      },
      { status: 400 }
    );
  }

  return executeTestEmail(recipient.trim());
}

export async function POST(request: Request) {
  let body: { to?: string } = {};
  try {
    body = await request.json();
  } catch {
    // optional body
  }

  const recipient = body.to;

  if (!recipient || !recipient.trim()) {
    return NextResponse.json(
      {
        error: "Missing required 'to' field in request body. JSON body format: { \"to\": \"your_email@domain.com\" }",
      },
      { status: 400 }
    );
  }

  return executeTestEmail(recipient.trim());
}

async function executeTestEmail(recipient: string) {
  const result = await sendEmail({
    to: recipient,
    subject: "AutoLog — Resend Integration Test",
    from: DEFAULT_SENDER,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 12px; color: #1f2937;">
        <h2 style="color: #0d9488; font-size: 20px; font-weight: 600; margin-top: 0;">AutoLog — Resend Integration Test</h2>
        <p>Hello,</p>
        <p>This is a test email from AutoLog.</p>
        <p>If you received this message, the Resend integration is working correctly.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">Regards,<br /><strong style="color: #111827;">AutoLog Team</strong></p>
      </div>
    `,
    text: "Hello,\n\nThis is a test email from AutoLog.\n\nIf you received this message, the Resend integration is working correctly.\n\nRegards,\nAutoLog",
  });

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        recipient,
        note: "Ensure recipient email is verified on your Resend account if using onboarding@resend.dev.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Test email sent successfully via Resend.",
    messageId: result.data?.id,
    recipient,
    sender: DEFAULT_SENDER,
  });
}
