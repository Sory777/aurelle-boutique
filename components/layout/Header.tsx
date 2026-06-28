import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

type NavLink = { label: string; href: string };

/**
 * Primary storefront navigation. Hrefs point at the routes defined in the
 * design's Storefront Page Map; only the home route is implemented in this
 * increment, the rest are placeholders for upcoming work.
 */
const navLinks: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Nueva colección", href: "/new" },
  { label: "Vestidos", href: "/c/dresses" },
  { label: "Blusas", href: "/c/blouses" },
  { label: "Pantalones", href: "/c/pants" },
  { label: "Faldas", href: "/c/skirts" },
  { label: "Chamarras", href: "/c/jackets" },
  { label: "Conjuntos", href: "/c/sets" },
  { label: "Accesorios", href: "/c/accessories" },
  { label: "Ofertas", href: "/sale" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-editorial items-center justify-between px-6 py-5">
        <Logo className="text-2xl" />

        <nav aria-label="Navegación principal" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="relative text-xs uppercase tracking-eyebrow text-taupe transition-colors duration-300 ease-luxe hover:text-noir after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-champagne after:transition-all after:duration-300 after:ease-luxe hover:after:w-full"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5 text-xs uppercase tracking-eyebrow text-noir">
          <Link
            href="/search"
            className="hidden transition-colors duration-300 ease-luxe hover:text-champagne-deep sm:inline"
          >
            Buscar
          </Link>
          <Link
            href="/favorites"
            className="hidden transition-colors duration-300 ease-luxe hover:text-champagne-deep sm:inline"
          >
            Favoritos
          </Link>
          <Link
            href="/cart"
            className="transition-colors duration-300 ease-luxe hover:text-champagne-deep"
          >
            Bolsa (0)
          </Link>
        </div>
      </div>

      {/* Condensed nav for small screens */}
      <nav
        aria-label="Navegación de categorías"
        className="block border-t border-line lg:hidden"
      >
        <ul className="flex gap-5 overflow-x-auto px-6 py-3">
          {navLinks.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className="text-[0.7rem] uppercase tracking-eyebrow text-taupe transition-colors duration-300 ease-luxe hover:text-noir"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
