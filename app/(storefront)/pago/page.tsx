import type { Metadata } from "next";
import { CopyButton } from "@/components/ui/CopyButton";
import {
  ORDERING_CONFIG,
  buildPayPalLink,
  buildWhatsAppLink,
} from "@/lib/payments/config";

export const metadata: Metadata = {
  title: "Cómo comprar",
  description:
    "Realiza tu pedido AURÉLLE por WhatsApp, paga con PayPal o por transferencia SPEI. Te confirmamos cada pedido de forma personal.",
};

const { paypal, bankTransfer } = ORDERING_CONFIG;

export default function PagoPage() {
  return (
    <div className="mx-auto max-w-editorial px-6 py-16">
      {/* Intro */}
      <header className="max-w-2xl">
        <p className="eyebrow text-champagne-deep">Cómo comprar</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-noir">
          Pago y pedidos
        </h1>
        <p className="mt-6 text-base leading-relaxed text-taupe">
          En AURÉLLE atendemos cada pedido de forma personal. Elige el método que
          prefieras: escríbenos por WhatsApp, paga con PayPal o realiza una
          transferencia SPEI. Confirmamos disponibilidad y total contigo antes de
          preparar tu envío.
        </p>
      </header>

      {/* Channels */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {/* WhatsApp */}
        <section className="flex flex-col border border-line bg-white/40 p-8">
          <p className="eyebrow text-champagne-deep">Opción 1</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-noir">
            Pedido por WhatsApp
          </h2>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-taupe">
            La forma más rápida. Escríbenos por chat, cuéntanos qué prenda te
            gusta y te confirmamos disponibilidad, total y envío al instante.
          </p>
          <a
            href={buildWhatsAppLink("Hola AURÉLLE 👋, quiero hacer un pedido.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center px-9 py-4 text-xs uppercase tracking-eyebrow text-white transition-transform duration-300 ease-luxe hover:scale-[1.02]"
            style={{ backgroundColor: "#25D366" }}
          >
            Escribir por WhatsApp
          </a>
        </section>

        {/* PayPal */}
        <section className="flex flex-col border border-line bg-white/40 p-8">
          <p className="eyebrow text-champagne-deep">Opción 2</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-noir">
            Pagar con PayPal
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-taupe">
            Paga de forma segura a nuestra cuenta de PayPal:
          </p>
          <p className="mt-3 break-all font-medium text-noir">
            {paypal.businessEmail}
          </p>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-taupe">
            Al abrir PayPal, indica el monto de tu pedido para completar el pago.
          </p>
          <a
            href={buildPayPalLink({ itemName: "Pedido AURÉLLE" })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6"
          >
            Pagar con PayPal
          </a>
        </section>

        {/* Bank transfer — SPEI */}
        <section className="flex flex-col border border-line bg-white/40 p-8">
          <p className="eyebrow text-champagne-deep">Opción 3</p>
          <h2 className="mt-2 font-display text-2xl font-medium text-noir">
            Transferencia ({bankTransfer.method})
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="eyebrow">Banco</dt>
              <dd className="text-right font-medium text-noir">
                {bankTransfer.bank}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="eyebrow">Titular</dt>
              <dd className="text-right font-medium text-noir">
                {bankTransfer.accountHolder}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">CLABE</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-3">
                <span className="font-medium tabular-nums tracking-wide text-noir">
                  {bankTransfer.clabe}
                </span>
                <CopyButton text={bankTransfer.clabe} label="Copiar CLABE" />
              </dd>
            </div>
          </dl>
          <p className="mt-6 flex-1 text-sm leading-relaxed text-taupe">
            Envía tu comprobante por WhatsApp para confirmar tu pedido.
          </p>
          <a
            href={buildWhatsAppLink(
              "Hola AURÉLLE 👋, adjunto mi comprobante de transferencia.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost mt-6"
          >
            Enviar comprobante
          </a>
        </section>
      </div>

      <p className="mt-12 max-w-2xl text-sm leading-relaxed text-taupe">
        Cada pedido se confirma de forma manual por WhatsApp o correo una vez
        verificado el pago. No procesamos datos de tarjeta en nuestros servidores.
      </p>
    </div>
  );
}
