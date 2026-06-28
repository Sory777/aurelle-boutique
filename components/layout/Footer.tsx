import Link from "next/link";

type FooterColumn = { heading: string; links: { label: string; href: string }[] };

const columns: FooterColumn[] = [
  {
    heading: "Tienda",
    links: [
      { label: "Nueva colección", href: "/new" },
      { label: "Vestidos", href: "/c/dresses" },
      { label: "Conjuntos", href: "/c/sets" },
      { label: "Ofertas", href: "/sale" },
    ],
  },
  {
    heading: "Casa AURÉLLE",
    links: [
      { label: "Journal", href: "/journal" },
      { label: "Probador virtual", href: "/fitting-room" },
      { label: "Contacto", href: "/contact" },
      { label: "Preguntas frecuentes", href: "/faq" },
    ],
  },
  {
    heading: "Cuenta",
    links: [
      { label: "Mi cuenta", href: "/account" },
      { label: "Favoritos", href: "/favorites" },
      { label: "Bolsa", href: "/cart" },
      { label: "Buscar", href: "/search" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-noir text-ivory">
      <div className="mx-auto max-w-editorial px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <span className="font-display text-2xl uppercase tracking-wordmark text-ivory">
              AUR<span className="text-champagne">É</span>LLE
            </span>
            <p className="max-w-xs text-sm leading-relaxed text-taupe">
              Moda femenina de lujo, vestida de luz. Piezas atemporales
              confeccionadas con materiales nobles.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-4 text-xs uppercase tracking-eyebrow text-champagne">
                {column.heading}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/75 transition-colors duration-300 ease-luxe hover:text-champagne"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-taupe sm:flex-row">
          <p>&copy; {year} AURÉLLE. Dressed in light.</p>
          <p className="uppercase tracking-eyebrow">Hecho con esmero · Edición de lujo</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
