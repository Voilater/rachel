import { Link } from "@tanstack/react-router";

import type { BeadStrand } from "@/lib/site-data";
import { formatBeadPrice } from "@/lib/site-data";

export function BeadStrandCard({ bead }: { bead: BeadStrand }) {
  return (
    <Link
      to="/shop/$productId"
      params={{ productId: bead.id }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md shadow-burgundy/5 transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/5] shrink-0 overflow-hidden bg-image-tint p-3">
        <img
          src={bead.image}
          alt={bead.name}
          className="size-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy line-clamp-2">
          {bead.name}
        </p>
        <p className="mt-2 tabular-nums text-lg font-semibold text-burgundy">
          {formatBeadPrice(bead.price, bead.unit)}
        </p>
      </div>
    </Link>
  );
}
