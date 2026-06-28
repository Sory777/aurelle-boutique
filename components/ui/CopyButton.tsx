"use client";

import { useState } from "react";

type CopyButtonProps = {
  /** The exact text copied to the clipboard. */
  text: string;
  /** Idle button label (defaults to "Copiar"). */
  label?: string;
  /** Optional extra classes appended to the brand styling. */
  className?: string;
};

/**
 * Small brand-styled button that copies `text` to the clipboard and briefly
 * confirms with "¡Copiado!". Used for the SPEI CLABE on the `/pago` page
 * (requirement 18.3 — copy-CLABE action).
 */
export function CopyButton({ text, label = "Copiar", className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={`inline-flex items-center justify-center border border-noir px-4 py-2 text-[0.7rem] uppercase tracking-eyebrow text-noir transition-colors duration-300 ease-luxe hover:bg-noir hover:text-ivory ${className}`}
    >
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

export default CopyButton;
