import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";

import { Price } from "@/components/Price";
import type { ShopProduct } from "@/lib/site-data";

export function ShopProductCard({ product }: { product: ShopProduct }) {
  return (
    <article className="group flex h-full flex-col">
      <Link to="/shop/$productId" params={{ productId: product.id }} className="block shrink-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-image-tint">
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <span
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-burgundy shadow-sm"
            aria-hidden
          >
            <Heart className="size-4" />
          </span>
          {product.badge && (
            <span className="absolute bottom-3 left-3 rounded-md bg-blush-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-burgundy">
              {product.badge}
            </span>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium shadow-sm">
            <Star className="size-3 fill-burgundy text-burgundy" />
            {product.rating.toFixed(1)}
          </div>
        </div>
      </Link>
      <div className="mt-4 flex flex-1 flex-col">
        <Link
          to="/shop/$productId"
          params={{ productId: product.id }}
          className="font-serif text-lg text-foreground line-clamp-2 hover:text-burgundy"
        >
          {product.name}
        </Link>
        <p className="mt-1">
          <Price amount={product.price} className="text-base font-semibold" />
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>
    </article>
  );
}
