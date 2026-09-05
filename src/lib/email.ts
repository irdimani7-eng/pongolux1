import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderId: string;
  totalCents: number;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping order confirmation email for",
      params.orderId
    );
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <orders@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} is confirmed`,
    html: `<p>Thank you for your order! We're preparing your authenticated piece for shipment.</p>
           <p>Order total: $${(params.totalCents / 100).toFixed(2)}</p>
           <p>Order ID: ${params.orderId}</p>`,
  });
}
