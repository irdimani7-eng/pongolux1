import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendContactFormEmail(params: {
  attention: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping contact form email from",
      params.email
    );
    return;
  }

  await resend.emails.send({
    // info@ and support@ are PongoLux's only real inboxes — no dedicated
    // orders@ mailbox exists, so transactional email sends from info@ by
    // default. Override with EMAIL_FROM if that changes.
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: "support@pongolux.com",
    replyTo: params.email,
    subject: `[Contact — ${params.attention}] ${params.firstName} ${params.lastName}`,
    html: `<p><strong>Attention:</strong> ${params.attention}</p>
           <p><strong>From:</strong> ${params.firstName} ${params.lastName} (${params.email})</p>
           <p><strong>Message:</strong></p>
           <p>${params.message.replace(/\n/g, "<br />")}</p>`,
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  totalCents: number;
  taxCents?: number;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping order confirmation email for",
      params.orderId
    );
    return;
  }

  const taxLine =
    params.taxCents && params.taxCents > 0
      ? `<p>Includes tax: $${(params.taxCents / 100).toFixed(2)}</p>`
      : "";

  await resend.emails.send({
    // info@ and support@ are PongoLux's only real inboxes — no dedicated
    // orders@ mailbox exists, so transactional email sends from info@ by
    // default. Override with EMAIL_FROM if that changes.
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} is confirmed`,
    html: `<p>Thank you for your order! We're preparing your authenticated piece for shipment.</p>
           <p>Order total: $${(params.totalCents / 100).toFixed(2)}</p>
           ${taxLine}
           <p>Order ID: ${params.orderId}</p>`,
  });
}
