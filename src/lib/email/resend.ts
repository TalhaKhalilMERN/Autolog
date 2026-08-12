import { Resend } from "resend";

export interface SendEmailPayload {
  /** Recipient email address or array of addresses */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** HTML email body content */
  html: string;
  /** Optional plaintext fallback content */
  text?: string;
  /** Optional custom sender address (defaults to onboarding@resend.dev) */
  from?: string;
}

export interface SendEmailResponse {
  success: boolean;
  data?: { id: string } | null;
  error?: string | null;
}

/** Default sender used for development and testing */
export const DEFAULT_SENDER = "AutoLog <onboarding@resend.dev>";

/**
 * Gets or initializes the server-side Resend client instance.
 * Throws a clear server error if RESEND_API_KEY is not defined.
 */
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Missing RESEND_API_KEY environment variable. Please add RESEND_API_KEY to your .env.local configuration."
    );
  }
  return new Resend(apiKey);
}

/**
 * Generic server-side email sending service for AutoLog using Resend.
 *
 * IMPORTANT SECURITY NOTE:
 * This function accesses process.env.RESEND_API_KEY server-side.
 * It must ONLY be imported and called from Server Components, API Route Handlers, or Server Actions.
 */
export async function sendEmail(
  payload: SendEmailPayload
): Promise<SendEmailResponse> {
  try {
    const resend = getResendClient();
    const { to, subject, html, text, from } = payload;

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return {
        success: false,
        data: null,
        error: "Recipient email address ('to') is required.",
      };
    }

    if (!subject || !subject.trim()) {
      return {
        success: false,
        data: null,
        error: "Email subject line is required.",
      };
    }

    if (!html || !html.trim()) {
      return {
        success: false,
        data: null,
        error: "Email HTML body content is required.",
      };
    }

    const sender = from || DEFAULT_SENDER;

    const { data, error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      return {
        success: false,
        data: null,
        error: error.message || "Resend API returned an error while sending email.",
      };
    }

    return {
      success: true,
      data: data ? { id: data.id } : null,
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: err.message || "An unexpected error occurred in sendEmail.",
    };
  }
}
