import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { demoProducts } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Probador virtual",
  description:
    "El probador virtual de AURÉLLE: prueba nuestras piezas sobre tu propio cuerpo, en tu navegador y sin que tu foto salga de tu dispositivo.",
};

const STEPS: { title: string; body: string }[] = [
  {
    title: "Elige una pieza",
    body: "Selecciona cualquier prenda del atelier para abrir su probador dedicado.",
  },
  {
    title: "Sube o captura",
    body: "Usa una foto tuya o tu cámara en vivo. La imagen permanece siempre en tu dispositivo.",
  },
  {
    title: "Ajusta y compara",
    body: "Simula tallas, cambia de color, ajusta el tamaño y alterna entre el antes y el después.",
  },
];

export default function FittingRoomPage() {
  return (
    <div className="mx-auto max-w-editorial px-6 py-16">
      {/* Intro */}
      <header className="max-w-3xl">
        <p className="eyebrow text-champagne-deep">Experiencia AURÉLLE</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-noir sm:text-5xl">
          El probador virtual
        </h1>
        <p className="mt-5 text-base leading-relaxed text-taupe">
          Descubre cómo lucen nuestras piezas sobre ti antes de comprar. Nuestro
          probador detecta tu pose y superpone la prenda directamente en tu
          navegador, con tecnología que se ejecuta en tu propio dispositivo.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 border border-line bg-blush/40 px-4 py-2 text-xs text-taupe">
          <span aria-hidden>•</span>
          Tu foto se procesa en tu dispositivo y nunca se sube.
        </p>
      </header>

      {/* How it works */}
      <section className="mt-14 grid gap-8 border-y border-line py-10 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title}>
            <p className="font-display text-3xl text-champagne-deep">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-display text-xl text-noir">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-taupe">
              {step.body}
            </p>
          </div>
        ))}
      </section>

      {/* Choose a product */}
      <section className="mt-16">
        <div className="border-b border-line pb-6">
          <p className="eyebrow text-champagne-deep">Comienza ahora</p>
          <h2 className="mt-2 font-display text-3xl font-medium text-noir">
            Elige una pieza para probar
          </h2>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {demoProducts.map((product) => (
            <li key={product.slug}>
              <Link
                href={`/p/${product.slug}/try-on`}
                className="group block"
                aria-label={`Probar ${product.name} virtualmente`}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-blush">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover object-center transition-transform duration-700 ease-luxe group-hover:scale-105"
                  />
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ivory/90 px-4 py-1.5 text-[0.65rem] uppercase tracking-eyebrow text-noir opacity-0 transition-opacity duration-300 ease-luxe group-hover:opacity-100">
                    Probar virtualmente
                  </span>
                </div>
                <div className="mt-4">
                  <p className="eyebrow">{product.categoryLabel}</p>
                  <h3 className="mt-1 font-display text-lg leading-snug text-noir transition-colors duration-300 ease-luxe group-hover:text-champagne-deep">
                    {product.name}
                  </h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
