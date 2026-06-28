import Image from "next/image";
import Link from "next/link";
import {
  demoProducts,
  heroImage,
  editorialImage,
  type DemoProduct,
} from "@/lib/demo-data";

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Hero() {
  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden">
      <Image
        src={heroImage}
        alt="Modelo con una pieza de la colección AURÉLLE"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Tonal overlay for legibility */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-noir/70 via-noir/35 to-transparent" />

      <div className="relative mx-auto w-full max-w-editorial px-6">
        <div className="max-w-xl text-ivory">
          <p className="eyebrow text-champagne">Nueva colección · Otoño</p>
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.02] text-ivory sm:text-[4.5rem]">
            Dressed in light.
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/85">
            Piezas atemporales confeccionadas con materiales nobles para la
            mujer que viste de luz. Descubre la silueta de la temporada.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/new" className="btn-primary bg-champagne text-noir hover:bg-champagne-deep hover:text-ivory">
              Ver la colección
            </Link>
            <Link
              href="/fitting-room"
              className="inline-flex items-center justify-center border border-ivory/70 px-9 py-4 text-xs uppercase tracking-eyebrow text-ivory transition-all duration-300 ease-luxe hover:border-ivory hover:bg-ivory hover:text-noir"
            >
              Probador virtual
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: DemoProduct }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group block"
      aria-label={product.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-blush">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-700 ease-luxe group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[0.65rem] uppercase tracking-eyebrow text-noir opacity-0 transition-opacity duration-300 ease-luxe group-hover:opacity-100">
          Ver pieza
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{product.categoryLabel}</p>
          <h3 className="mt-1 font-display text-lg leading-snug text-noir transition-colors duration-300 ease-luxe group-hover:text-champagne-deep">
            {product.name}
          </h3>
        </div>
        <p className="shrink-0 pt-1 text-sm tabular-nums text-noir">
          {priceFormatter.format(product.price)}
        </p>
      </div>
    </Link>
  );
}

function NewCollection() {
  return (
    <section className="mx-auto max-w-editorial px-6 py-24">
      <div className="flex flex-col items-end justify-between gap-4 border-b border-line pb-8 sm:flex-row">
        <div>
          <p className="eyebrow text-champagne-deep">Lo más reciente</p>
          <h2 className="mt-3 font-display text-3xl font-medium text-noir">
            Nueva colección
          </h2>
        </div>
        <Link
          href="/new"
          className="text-xs uppercase tracking-eyebrow text-noir transition-colors duration-300 ease-luxe hover:text-champagne-deep"
        >
          Ver todo &rarr;
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
        {demoProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function EditorialBanner() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative mx-auto grid max-w-editorial items-stretch gap-0 px-6 md:grid-cols-2">
        <div className="relative min-h-[26rem] overflow-hidden">
          <Image
            src={editorialImage}
            alt="Editorial de la temporada AURÉLLE"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex flex-col justify-center bg-noir px-8 py-16 text-ivory md:px-14">
          <p className="eyebrow text-champagne">El atelier</p>
          <h2 className="mt-4 font-display text-3xl font-medium leading-tight text-ivory sm:text-4xl">
            La luz hecha materia
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/80">
            Cada pieza nace de un estudio del movimiento y la caída de la tela.
            Sedas que respiran, sastrería precisa y un acabado champaña que
            define la firma AURÉLLE.
          </p>
          <Link
            href="/journal"
            className="mt-10 inline-flex w-fit items-center border border-ivory/60 px-9 py-4 text-xs uppercase tracking-eyebrow text-ivory transition-all duration-300 ease-luxe hover:bg-ivory hover:text-noir"
          >
            Leer el journal
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <NewCollection />
      <EditorialBanner />
    </>
  );
}
