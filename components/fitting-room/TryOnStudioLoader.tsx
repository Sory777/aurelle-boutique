"use client";

import dynamic from "next/dynamic";
import type { DemoProduct } from "@/lib/demo-data";

/**
 * Client-only loader for {@link TryOnStudio}.
 *
 * The studio pulls in heavy on-device ML libraries (TensorFlow.js + MoveNet)
 * and touches browser-only APIs (`getUserMedia`, `<canvas>`, WebGL), so it must
 * never run during SSR. `next/dynamic` with `{ ssr: false }` is only permitted
 * inside a Client Component — hence this thin wrapper, which the server page
 * renders in place of importing the studio directly.
 */
const TryOnStudio = dynamic(
  () => import("@/components/fitting-room/TryOnStudio").then((mod) => mod.TryOnStudio),
  {
    ssr: false,
    loading: () => (
      <div className="border border-line bg-white/40 p-8 text-sm text-taupe">
        Preparando el probador virtual…
      </div>
    ),
  },
);

export function TryOnStudioLoader({ product }: { product: DemoProduct }) {
  return <TryOnStudio product={product} />;
}

export default TryOnStudioLoader;
