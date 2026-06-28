/**
 * Single source of truth for AURÉLLE's manual ordering model.
 *
 * AURÉLLE is a small boutique: there is NO automated payment processor, no
 * payment intents, and no webhooks (see design.md → "Payments & Ordering
 * (Manual / Free Model)"). A shopper completes an order through one of three
 * free, no-integration channels — WhatsApp chat, a PayPal email payment link,
 * or a SPEI bank transfer. Every UI surface (the floating WhatsApp button, the
 * product-page action, and the `/pago` page) reads its settings from here so
 * nothing is hard-coded across components.
 */
export const ORDERING_CONFIG = {
  whatsapp: { phoneE164: "+524451963616", number: "524451963616" },
  paypal: { businessEmail: "elsory271288@gmail.com" },
  bankTransfer: {
    method: "SPEI",
    bank: "Spin by Oxxo",
    clabe: "728969000062242711",
    accountHolder: "Edgar De Rueda Martínez",
  },
} as const;

/**
 * Build a WhatsApp deep link to the boutique. When a `message` is supplied it
 * is URL-encoded and appended as the chat's pre-filled text.
 */
export function buildWhatsAppLink(message?: string): string {
  const base = `https://wa.me/${ORDERING_CONFIG.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Build a PayPal email-payment link to the boutique's business account. This
 * uses PayPal's hosted `_xclick` flow only — no PayPal API, keys, or webhooks.
 * The optional `itemName` and `amount` pre-fill the payment page; when omitted,
 * the shopper enters the amount of their order manually.
 */
export function buildPayPalLink(opts?: { amount?: number; itemName?: string }): string {
  const email = ORDERING_CONFIG.paypal.businessEmail;
  let link = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(
    email,
  )}&currency_code=USD`;

  if (opts?.itemName) {
    link += `&item_name=${encodeURIComponent(opts.itemName)}`;
  }
  if (opts?.amount !== undefined) {
    link += `&amount=${encodeURIComponent(String(opts.amount))}`;
  }

  return link;
}
