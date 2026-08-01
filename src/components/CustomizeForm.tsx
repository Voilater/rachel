import {
  Flower2,
  Footprints,
  Gem,
  Heart,
  Moon,
  Star,
  Watch,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Price } from "@/components/Price";
import { useCart } from "@/lib/cart";
import {
  beadOptions,
  buildCustomizeSubtitle,
  charmOptions,
  computeCustomizeTotal,
  computeCustomizeTotalForProduct,
  inferProductTypeFromCategory,
  productTypes,
  sizeOptions,
  type ProductType,
} from "@/lib/customize-data";
import type { InventoryItem } from "@/lib/inventory-store";
import { cn } from "@/lib/utils";

const productTypeIcons: Record<ProductType, typeof Watch> = {
  bracelet: Watch,
  necklace: Gem,
  anklet: Footprints,
};

const charmIcons: Record<string, typeof Star> = {
  star: Star,
  heart: Heart,
  moon: Moon,
  lotus: Flower2,
};

export function CustomizeForm({ product }: { product?: InventoryItem }) {
  const { addItem, openCart } = useCart();
  const isProductMode = Boolean(product);

  const initialType = product
    ? inferProductTypeFromCategory(product.category)
    : "bracelet";

  const [productType, setProductType] = useState<ProductType>(initialType);
  const [beadId, setBeadId] = useState(beadOptions[0].id);
  const [charmId, setCharmId] = useState(charmOptions[0].id);
  const [sizeId, setSizeId] = useState(sizeOptions[1].id);
  const [initials, setInitials] = useState("");
  const [giftNote, setGiftNote] = useState("");

  const selectedBead = beadOptions.find((b) => b.id === beadId) ?? beadOptions[0];
  const selectedSize = sizeOptions.find((s) => s.id === sizeId) ?? sizeOptions[1];

  const total = useMemo(() => {
    if (product) {
      return computeCustomizeTotalForProduct(product.price, beadId, charmId);
    }
    return computeCustomizeTotal(productType, beadId, charmId);
  }, [product, productType, beadId, charmId]);

  const handleAddToCollection = () => {
    const subtitle = buildCustomizeSubtitle(
      productType,
      beadId,
      charmId,
      initials,
      giftNote,
      product?.name,
    );

    if (product) {
      const colorId = product.colors?.[0]?.id ?? "default";
      addItem(product, {
        size: selectedSize.value,
        colorId: `${colorId}-${beadId}-${charmId}`,
        quantity: 1,
        subtitle,
        linePrice: total,
      });
    } else {
      const typeLabel = productTypes.find((t) => t.id === productType)?.label ?? "Piece";
      addItem(
        {
          id: `custom-${productType}-${beadId}-${charmId}-${Date.now()}`,
          name: `Custom ${typeLabel}`,
          price: total,
          rating: 4.5,
          description: subtitle,
          image: "/images/hero.jpg",
          category: "Bracelets",
        },
        {
          size: selectedSize.value,
          colorId: `${beadId}-${charmId}`,
          quantity: 1,
          subtitle,
          linePrice: total,
        },
      );
    }

    openCart();
  };

  return (
    <div className="mt-14 space-y-14">
      {product && (
        <section className="rounded-2xl border border-border bg-blush-card/50 p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
            Customizing
          </p>
          <div className="mt-4 flex gap-4">
            <img
              src={product.image}
              alt=""
              className="size-20 rounded-xl object-cover md:size-24"
            />
            <div>
              <h2 className="text-xl text-burgundy md:text-2xl">{product.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
              <p className="mt-2">
                <Price amount={product.price} emphasis />
                <span className="text-sm text-muted-foreground"> base price</span>
              </p>
              <Link
                to="/shop/$productId"
                params={{ productId: product.id }}
                className="mt-2 text-sm font-medium text-burgundy hover:underline"
              >
                View product details
              </Link>
            </div>
          </div>
        </section>
      )}

      {!isProductMode && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
            Step 1: Product Type
          </h2>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
            {productTypes.map((type) => {
              const Icon = productTypeIcons[type.id];
              const selected = productType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setProductType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl border-2 px-3 py-6 transition-colors sm:py-8",
                    selected
                      ? "border-burgundy bg-blush-section"
                      : "border-transparent bg-blush-card hover:bg-blush-card/80",
                  )}
                >
                  <Icon className="size-7 text-burgundy/70 sm:size-8" strokeWidth={1.25} />
                  <span className="text-sm font-medium text-foreground">{type.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
            {isProductMode ? "Step 1: Bead Style & Color" : "Step 2: Bead Style & Color"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedBead.label}{" "}
            <span className="text-foreground">
              (+ ₹{selectedBead.premium})
            </span>
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 sm:gap-5">
          {beadOptions.map((bead) => (
            <button
              key={bead.id}
              type="button"
              aria-label={bead.label}
              onClick={() => setBeadId(bead.id)}
              className={cn(
                "size-14 rounded-full border-2 transition-transform hover:scale-105 sm:size-16",
                beadId === bead.id ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: bead.hex }}
            />
          ))}
        </div>
        <blockquote className="mt-6 text-center text-sm italic leading-relaxed text-muted-foreground md:text-base">
          &ldquo;{selectedBead.description}&rdquo;
        </blockquote>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
          {isProductMode ? "Step 2: Personalization" : "Step 3: Personalization"}
        </h2>
        <input
          type="text"
          value={initials}
          onChange={(e) => setInitials(e.target.value.slice(0, 8))}
          placeholder="Enter initials (e.g. M.S.)"
          maxLength={8}
          className="mt-5 w-full rounded-xl border border-border bg-white px-5 py-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-burgundy/20"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Max 8 characters. Gold or Silver letter beads available.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
          {isProductMode ? "Step 3: Add a Charm" : "Step 4: Add a Charm"}
        </h2>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {charmOptions.map((charm) => {
            const Icon = charmIcons[charm.id];
            const selected = charmId === charm.id;
            return (
              <button
                key={charm.id}
                type="button"
                onClick={() => setCharmId(charm.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-5 transition-colors",
                  selected
                    ? "border-burgundy bg-blush-card"
                    : "border-transparent bg-blush-card/60 hover:bg-blush-card",
                )}
              >
                <Icon className="size-6 text-burgundy/70" strokeWidth={1.5} />
                <span className="text-xs font-medium text-foreground">{charm.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">
          {isProductMode ? "Step 4: Sizing" : "Step 5: Sizing"}
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {sizeOptions.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => setSizeId(size.id)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm transition-colors",
                sizeId === size.id
                  ? "border-burgundy bg-white text-foreground"
                  : "border-border bg-white text-muted-foreground hover:border-burgundy/40",
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-burgundy">Gift Note</h2>
        <textarea
          value={giftNote}
          onChange={(e) => setGiftNote(e.target.value)}
          placeholder="Write a message for the recipient..."
          rows={4}
          className="mt-5 w-full resize-none rounded-2xl border-0 bg-blush-card px-5 py-4 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-burgundy/20"
        />
      </section>

      <section className="border-t border-border pt-10">
        <div className="flex items-center justify-between">
          <span className="text-xl text-foreground">Total</span>
          <Price amount={total} emphasis className="text-2xl" />
        </div>
        <button
          type="button"
          onClick={handleAddToCollection}
          className="mt-8 w-full bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
        >
          Add to Collection
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ships within 3–5 business days. Hand-crafted in our studio.
        </p>
      </section>
    </div>
  );
}
