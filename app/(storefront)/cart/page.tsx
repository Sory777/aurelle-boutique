import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Bolsa",
  description:
    "Tu bolsa de compra AURÉLLE. Finaliza tu pedido por WhatsApp, PayPal o transferencia SPEI.",
};

/**
 * Bolsa / cart page.
 *
 * AURÉLLE uses a manual ordering model — there is no automated checkout
 * (design.md → "Payments & Ordering"). The bolsa therefore points shoppers to
 * the consolidated "Cómo comprar / Pago" page, where they complete the order
 * via WhatsApp, PayPal, or SPEI transfer (requirement 18.4).
 */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-editorial px-6 py-16">
      <header className="max-w-2xl">
        <p className="eyebrow text-champagne-deep">Tu bolsa</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-noir">
          Bolsa
        </h1>
        <p className="mt-6 text-base leading-relaxed text-taupe">
          En AURÉLLE confirmamos cada pedido de forma personal. Cuando tengas tus
          piezas seleccionadas, finaliza tu pedido y elige cómo pagar: WhatsApp,
          PayPal o transferencia SPEI.
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/pago" className="btn-primary">
          Cómo pagar / Finalizar pedido
        </Link>
        <Link href="/new" className="btn-ghost">
          Seguir explorando
        </Link>
      </div>
    </div>
  );
}
