import Link from "next/link";

type LogoProps = {
  /** Tailwind text-size class for the wordmark. */
  className?: string;
  /** Render champagne accent on the accented É (default) or full noir. */
  tone?: "duotone" | "noir";
};

/**
 * AURÉLLE wordmark — letter-spaced serif caps.
 *
 * The accented É is rendered in champagne to echo the "aura + aurum (gold)"
 * brand concept from the design's Brand Identity section.
 */
export function Logo({ className = "text-2xl", tone = "duotone" }: LogoProps) {
  const accent = tone === "duotone" ? "text-champagne" : "text-noir";

  return (
    <Link
      href="/"
      aria-label="AURÉLLE — Inicio"
      className="group inline-flex select-none items-baseline font-display font-medium uppercase text-noir"
    >
      <span className={`${className} tracking-wordmark leading-none`}>
        AUR<span className={accent}>É</span>LLE
      </span>
    </Link>
  );
}

export default Logo;
