import { Link } from "@tanstack/react-router";

import type { Product, ShopProduct } from "@/lib/site-data";
import { Price } from "@/components/Price";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  product: Product;
  featured?: boolean;
}

function toShopProduct(product: Product): ShopProduct {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    rating: 4.5,
    description: product.description,
    image: product.image,
    category: "Bracelets",
    featured: product.featured,
  };
}

export function RecommendationCard({ product, featured }: RecommendationCardProps) {
  const { addItem, openCart } = useCart();

  const handleAddToBag = () => {
    addItem(toShopProduct(product), {
      size: "default",
      colorId: "default",
      subtitle: product.description,
      linePrice: product.price,
    });
    openCart();
  };

  return (
    <article className="group flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <Link
        to="/shop/$productId"
        params={{ productId: product.id }}
        className="block aspect-[4/5] shrink-0 overflow-hidden bg-image-tint"
      >
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </Link>
      <div className="flex min-h-[10.5rem] flex-1 flex-col bg-blush-card px-4 py-5">
        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/shop/$productId"
              params={{ productId: product.id }}
              className="line-clamp-2 font-serif text-base text-burgundy hover:opacity-80"
            >
              {product.name}
            </Link>
            <Price amount={product.price} emphasis className="shrink-0 text-base" />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        </div>
        <button
          type="button"
          onClick={handleAddToBag}
          className={cn(
            "mt-4 flex h-11 shrink-0 w-full items-center justify-center rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-90",
            featured
              ? "bg-plum text-white"
              : "border-2 border-burgundy bg-transparent text-burgundy box-border",
          )}
        >
          Add to Bag
        </button>
      </div>
    </article>
  );
}
