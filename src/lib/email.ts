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

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: "support@pongolux.com",
    replyTo: params.email,
    subject: `[Contact — ${params.attention}] ${params.firstName} ${params.lastName}`,
    html: `<p><strong>Attention:</strong> ${params.attention}</p>
           <p><strong>From:</strong> ${params.firstName} ${params.lastName} (${params.email})</p>
           <p><strong>Message:</strong></p>
           <p>${params.message.replace(/\n/g, "<br />")}</p>`,
  });

  // The Resend SDK does NOT throw on a rejected send — it returns
  // { data, error } either way. Without this check, a rejected email
  // (bad key permissions, unverified domain, etc.) would silently look
  // like a success to both the caller and anyone reading the logs.
  if (error) {
    console.error("Resend rejected contact form email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("Contact form email sent, Resend id:", data?.id);
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

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} is confirmed`,
    html: emailShell(body),
  });

  if (error) {
    console.error("Resend rejected order confirmation email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("Order confirmation email sent, Resend id:", data?.id);
}

/** Internal "you made a sale" notice — sent to the business inbox
 * (not the customer) every time an order is marked paid, so Irdi finds
 * out immediately instead of having to check /admin/orders herself.
 * Deliberately separate from sendOrderConfirmationEmail (customer-facing)
 * even though the content overlaps, since the audience and the "reply
 * to" behavior differ and they may want to look different later. */
export async function sendNewOrderNotificationEmail(params: {
  orderId: string;
  buyerEmail: string;
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
      "RESEND_API_KEY not set — skipping new order notification for",
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
         Ship to:<br />
         ${params.shippingAddress.fullName}<br />
         ${params.shippingAddress.line1}${params.shippingAddress.line2 ? `, ${params.shippingAddress.line2}` : ""}<br />
         ${params.shippingAddress.city}, ${params.shippingAddress.state} ${params.shippingAddress.postalCode}<br />
         ${params.shippingAddress.country}
       </p>`
    : `<p style="margin:16px 0 0;color:#b45309;">No shipping address on file for this order.</p>`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;">New order — #${params.orderId.slice(0, 8)}</h1>
    <p style="margin:0 0 20px;color:#57534e;">
      From: ${params.buyerEmail}
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
    <p style="margin:20px 0 0;">
      <a href="${SITE_URL}/admin/orders/${params.orderId}" style="color:#a3814f;">View this order in the admin dashboard →</a>
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: "support@pongolux.com",
    subject: `New order #${params.orderId.slice(0, 8)} — $${(params.totalCents / 100).toFixed(2)}`,
    html: emailShell(body),
  });

  if (error) {
    console.error("Resend rejected new order notification email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("New order notification email sent, Resend id:", data?.id);
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

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: params.to,
    subject: `Your PongoLux order #${params.orderId.slice(0, 8)} has shipped`,
    html: emailShell(body),
  });

  if (error) {
    console.error("Resend rejected order shipped email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("Order shipped email sent, Resend id:", data?.id);
}

/** Notifies Irdi of a new "Sell to us" submission. There's no dedicated
 * admin queue for these yet (see migration-008-sell-submissions.sql) —
 * this email IS the review workflow for now, so it includes every field
 * she'd need to make a call on the item, plus thumbnails of the photos. */
export async function sendSellSubmissionEmail(params: {
  submissionId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  address: string;
  productName: string;
  brand: string;
  yearOfPurchase: string | null;
  condition: string;
  size: string | null;
  proofOfAuthenticityUrl: string | null;
  notes: string | null;
  photoUrls: string[];
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping sell submission email for",
      params.submissionId
    );
    return;
  }

  const photosHtml = params.photoUrls.length
    ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">
        ${params.photoUrls
          .map(
            (url) =>
              `<a href="${url}"><img src="${url}" width="90" height="90" style="border-radius:6px;object-fit:cover;display:block;" /></a>`
          )
          .join("")}
      </div>`
    : `<p style="color:#b3261e;">No photos were attached — this shouldn't happen, follow up with the seller.</p>`;

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#78716c;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:4px 0;">${value}</td>
    </tr>`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;">New "Sell to us" submission</h1>
    <p style="margin:0 0 20px;color:#57534e;">
      From ${params.sellerName} (${params.sellerEmail})
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      ${detailRow("Product", `${params.brand} — ${params.productName}`)}
      ${detailRow("Condition", params.condition)}
      ${params.size ? detailRow("Size", params.size) : ""}
      ${params.yearOfPurchase ? detailRow("Year purchased", params.yearOfPurchase) : ""}
      ${
        params.proofOfAuthenticityUrl
          ? detailRow(
              "Proof of authenticity",
              `<a href="${params.proofOfAuthenticityUrl}">${params.proofOfAuthenticityUrl}</a>`
            )
          : ""
      }
      ${params.notes ? detailRow("Seller's notes", params.notes) : ""}
      ${detailRow("Phone", params.sellerPhone)}
      ${detailRow("Address", params.address)}
    </table>
    <h2 style="margin:20px 0 0;font-size:14px;">Photos</h2>
    ${photosHtml}
    <p style="margin:20px 0 0;color:#78716c;font-size:12px;">
      Submission ID: ${params.submissionId}. To respond, update this row in
      the database (status, quote_type, quote_amount_cents, quote_notes) —
      see the comment at the top of migration-008-sell-submissions.sql.
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: "support@pongolux.com",
    replyTo: params.sellerEmail,
    subject: `[Sell to us] ${params.brand} ${params.productName} — from ${params.sellerName}`,
    html: emailShell(body),
  });

  if (error) {
    console.error("Resend rejected sell submission email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("Sell submission email sent, Resend id:", data?.id);
}

/** Notifies Irdi of a new "Bag of Dreams" inquiry, so she can check it
 * against her vendor network and reach out to the customer directly (by
 * phone or email, per their stated preference). */
export async function sendDreamInquiryEmail(params: {
  inquiryId: string;
  customerName: string;
  customerEmail: string;
  brand: string;
  modelOrStyle: string;
  colorPreference: string | null;
  sizePreference: string | null;
  budgetRange: string | null;
  occasion: string | null;
  details: string | null;
  contactPreference: string;
}) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not set — skipping dream inquiry email for",
      params.inquiryId
    );
    return;
  }

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 12px 4px 0;color:#78716c;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:4px 0;">${value}</td>
    </tr>`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;">A new bag of dreams ✨</h1>
    <p style="margin:0 0 20px;color:#57534e;">
      From ${params.customerName} (${params.customerEmail})
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
      ${detailRow("Looking for", `${params.brand} — ${params.modelOrStyle}`)}
      ${params.colorPreference ? detailRow("Color", params.colorPreference) : ""}
      ${params.sizePreference ? detailRow("Size", params.sizePreference) : ""}
      ${params.budgetRange ? detailRow("Budget", params.budgetRange) : ""}
      ${params.occasion ? detailRow("Occasion", params.occasion) : ""}
      ${params.details ? detailRow("Their story", params.details) : ""}
      ${detailRow(
        "Prefers to be contacted by",
        params.contactPreference === "call"
          ? "Phone call"
          : params.contactPreference === "email"
            ? "Email"
            : "Either"
      )}
    </table>
    <p style="margin:20px 0 0;color:#78716c;font-size:12px;">
      Inquiry ID: ${params.inquiryId}. Update its status directly in the
      database as you work it — see the comment at the top of
      migration-009-dream-inquiries.sql.
    </p>
  `;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "PongoLux <info@pongolux.com>",
    to: "support@pongolux.com",
    replyTo: params.customerEmail,
    subject: `[Bag of Dreams] ${params.brand} ${params.modelOrStyle} — from ${params.customerName}`,
    html: emailShell(body),
  });

  if (error) {
    console.error("Resend rejected dream inquiry email:", error);
    throw new Error(`Resend error (${error.name}): ${error.message}`);
  }
  console.log("Dream inquiry email sent, Resend id:", data?.id);
}
