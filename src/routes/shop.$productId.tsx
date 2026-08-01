import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronDown, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { RecommendationCard } from "@/components/RecommendationCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { PageLayout } from "@/components/layout/PageLayout";
import { useCart } from "@/lib/cart";
import { useInventory } from "@/lib/inventory-store";
import {
  formatPrice,
  siteConfig,
  testimonials,
  trendingProducts,
} from "@/lib/site-data";
import { cn } from "@/lib/utils";

const JOURNAL_IMAGE =
  "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=1600&h=700&fit=crop";

export const Route = createFileRoute("/shop/$productId")({
  head: ({ params }) => ({
    meta: [{ title: `Product — ${siteConfig.name}` }],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();
  const { getProduct, ready, loading, error } = useInventory();
  const product = getProduct(productId);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("default");
  const [selectedSize, setSelectedSize] = useState("Medium (7.0\")");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(product.colors?.[0]?.id ?? "default");
    setSelectedSize(product.sizes?.[1] ?? product.sizes?.[0] ?? "Medium (7.0\")");
    setActiveImage(0);
  }, [product]);

  const waitingForProduct = (loading || !ready) && !product;

  if (waitingForProduct) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground md:px-8">
          Loading piece…
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-8">
          <p className="text-burgundy">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    throw notFound();
  }

  const images = product.images ?? [product.image];

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <p className="text-sm text-muted-foreground">
          <Link to="/shop" className="hover:text-burgundy">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl bg-image-tint">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 bg-image-tint transition-colors",
                    activeImage === index ? "border-burgundy" : "border-transparent",
                  )}
                >
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div>
            <h1 className="font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
              {product.name}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-burgundy text-burgundy" />
                ))}
              </div>
              <span className="font-medium text-foreground">{product.rating}/5</span>
              {product.reviewCount && (
                <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
              )}
            </div>
            <p className="mt-5 font-serif text-3xl font-semibold text-burgundy">
              {formatPrice(product.price)}
              {product.cartSubtitle?.startsWith("per ") && (
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  / {product.cartSubtitle.replace(/^per /, "")}
                </span>
              )}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.longDescription ?? product.description}
            </p>

            {product.colors && product.colors.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Bead Color
                </p>
                <div className="mt-3 flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={color.label}
                      onClick={() => setSelectedColor(color.id)}
                      className={cn(
                        "size-9 rounded-full border-2 transition-transform hover:scale-105",
                        selectedColor === color.id ? "border-foreground" : "border-transparent",
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-6">
                <label className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Size
                </label>
                <div className="relative mt-2">
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  >
                    {product.sizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Quantity
              </p>
              <div className="mt-2 flex w-fit items-center rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 text-muted-foreground hover:text-burgundy"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-3 text-muted-foreground hover:text-burgundy"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                addItem(product, {
                  size: selectedSize,
                  colorId: selectedColor,
                  quantity,
                })
              }
              className="w-full rounded-xl bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
            >
              Add to Cart
            </button>
            <Link
              to="/shop/$productId/customize"
              params={{ productId: product.id }}
              className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-burgundy py-4 text-xs font-bold uppercase tracking-[0.2em] text-burgundy transition-colors hover:bg-burgundy/5"
            >
              Customize This Piece
            </Link>
          </div>
        </div>
      </div>

      {/* You May Also Love */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">You May Also Love</h2>
          <p className="mt-2 text-muted-foreground">
            Complete your look with matching handcrafted pieces.
          </p>
          <div className="mt-10 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((p, i) => (
              <div key={p.id} className="h-full">
                <RecommendationCard product={p} featured={i === 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blush-section py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl">
            What Our Clients Say
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Connect Us / Journal */}
      <section className="relative overflow-hidden">
        <img src={JOURNAL_IMAGE} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-2xl px-4 py-20 text-center md:px-8 md:py-28">
          <h2 className="font-serif text-3xl text-burgundy md:text-4xl">Connect Us</h2>
          <p className="mt-5 font-serif text-lg leading-relaxed text-burgundy/80">
            Receive curated inspirations, early access to new collections, and stories from our
            studio.
          </p>
          <form className="mt-10" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="pdp-email" className="sr-only">Email</label>
            <input
              id="pdp-email"
              type="email"
              placeholder="Your Email Address"
              className="w-full border-0 border-b-2 border-burgundy/30 bg-transparent py-3 text-center font-serif text-burgundy placeholder:text-burgundy/50 outline-none focus:border-burgundy"
            />
            <button
              type="submit"
              className="mt-8 w-full max-w-xs bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
