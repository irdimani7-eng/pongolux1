import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pongolux.com";

/** Shared branded shell for every transactional email — table-based layout
 * with inline styles, since email clients don't reliably support external
 * CSS or modern layout (flexbox/grid). Keeps every email (order
 * confirmation, shipping notice, contact form) visually consistent and
 * recognizably PongoLux instead of looking like a bare system notice. */
function emailShell(bodyHtml: string) {
  return `
  <div style="background:#faf8f5;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#1c1917;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e7e2da;border-radius:8px;overflow:hidden;">
      <div style="background:#1c1917;padding:24px 32px;">
        <a href="${SITE_URL}" style="color:#faf8f5;font-size:20px;letter-spacing:0.5px;text-decoration:none;">
          PongoLux
        </a>
      </div>
      <div style="padding:32px;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;border-top:1px solid #e7e2da;font-size:12px;color:#78716c;">
        <p style="margin:0;">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@pongolux.com" style="color:#a3814f;">support@pongolux.com</a>
          or <a href="tel:+13127740792" style="color:#a3814f;">(312) 774-0792</a>.
        </p>
        <p style="margin:8px 0 0;">PONGOLUX LLC · Chicago, IL</p>
      </div>
    </div>
  </div>`;
}

function moneyRow(label: string, cents: number, opts?: { bold?: boolean }) {
  const weight = opts?.bold ? "600" : "400";
  return `
    <tr>
      <td style="padding:4px 0;color:${opts?.bold ? "#1c1917" : "#57534e"};font-weight:${weight};">${label}</td>
      <td style="padding:4px 0;text-align:right;font-weight:${weight};">$${(cents / 100).toFixed(2)}</td>
    </tr>`;
}

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
  items: { title: string; priceCents: number; imageUrl: string | null }[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  taxCents?: number;
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping order confirmation email for",
      params.orderId
    );
    return;
  }

  const itemsHtml = params.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #efe9e0;" width="64">
          ${
            item.imageUrl
              ? `<img src="${item.imageUrl}" width="56" height="56" style="border-radius:6px;object-fit:cover;display:block;" alt="${item.title}" />`
              : ""
          }
        </td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #efe9e0;font-size:13px;">${item.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid #efe9e0;text-align:right;font-size:13px;white-space:nowrap;">
          $${(item.priceCents / 100).toFixed(2)}
        </td>
      </tr>`
    )
    .join("");

  const addressHtml = params.shippingAddress
    ? `<p style="margin:16px 0 0;color:#57534e;">
         Shipping to:<br />
         ${params.shippingAddress.fullName}<br />
         ${params.shippingAddress.line1}${params.shippingAddress.line2 ? `, ${params.shippingAddress.line2}` : ""}<br />
         ${params.shippingAddress.city}, ${params.shippingAddress.state} ${params.shippingAddress.postalCode}<br />
         ${params.shippingAddress.country}
       </p>`
    : "";

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;">Thank you for your order</h1>
    <p style="margin:0 0 20px;color:#57534e;">
      We're preparing your authenticated piece for shipment — you'll get
      another email as soon as it ships. Order #${params.orderId.slice(0, 8)}.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      ${moneyRow("Subtotal", params.subtotalCents)}
      ${moneyRow("Shipping", params.shippingCents)}
      ${params.taxCents && params.taxCents > 0 ? moneyRow("Tax", params.taxCents) : ""}
      ${moneyRow("Total", params.totalCents, { bold: true })}
    </table>
    ${addressHtml}
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} is confirmed`,
    html: emailShell(body),
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  orderId: string;
  trackingNumber?: string | null;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping order shipped email for",
      params.orderId
    );
    return;
  }

  const trackingHtml = params.trackingNumber
    ? `<p style="margin:16px 0 0;">
         Tracking number: <strong>${params.trackingNumber}</strong>
       </p>`
    : "";

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;">Your order has shipped</h1>
    <p style="margin:0;color:#57534e;">
      Order #${params.orderId.slice(0, 8)} is on its way to you.
    </p>
    ${trackingHtml}
  `;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} has shipped`,
    html: emailShell(body),
  });
}
