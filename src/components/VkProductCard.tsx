import { Link } from "@tanstack/react-router";

import type { Product, ShopProduct } from "@/lib/site-data";
import { Price } from "@/components/Price";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface VkProductCardProps {
  product: Product;
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

export function VkProductCard({ product }: VkProductCardProps) {
  const { addItem, openCart } = useCart();
  const isFeatured = product.featured;

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
        className="relative block aspect-[4/5] shrink-0 overflow-hidden bg-image-tint"
      >
        <img
          src={product.image}
          alt={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {product.limitedEdition && (
          <span
            className="absolute left-3 top-3 rounded-full bg-plum px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Limited Edition
          </span>
        )}
      </Link>
      <div className="flex min-h-[11rem] flex-1 flex-col bg-blush-card px-4 py-5 md:min-h-[12rem] md:px-5 md:py-6">
        <div className="flex flex-1 flex-col">
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="flex flex-1 flex-col hover:opacity-90"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-lg leading-tight text-burgundy line-clamp-2 md:text-xl">
                {product.name}
              </h3>
              <Price amount={product.price} emphasis className="shrink-0 text-lg md:text-xl" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          </Link>
        </div>
        <button
          type="button"
          onClick={handleAddToBag}
          className={cn(
            "mt-4 flex h-11 shrink-0 w-full items-center justify-center rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-opacity hover:opacity-90",
            isFeatured
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
