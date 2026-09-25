import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { BeadStrandCard } from "@/components/BeadStrandCard";
import { InstagramReelStrip } from "@/components/InstagramReelStrip";
import { TestimonialCard } from "@/components/TestimonialCard";
import { VkProductCard } from "@/components/VkProductCard";
import { PageLayout } from "@/components/layout/PageLayout";
import { useInventory } from "@/lib/inventory-store";
import { getStaticReelViews } from "@/lib/static-reel-views";
import { isStaticSite } from "@/lib/static-site";
import {
  siteConfig,
  testimonials,
  type BeadStrand,
  type Product,
} from "@/lib/site-data";
import { fetchInstagramReelViews } from "@/server/instagram";
import { aeoAnswers, buildPageHead, faqJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

const HERO_IMAGE = "/images/hero.png";
const PHILOSOPHY_IMAGE = "/images/hero.png";
const JOURNAL_IMAGE = "/images/hero.png";

const HERO_FEATURED = [
  {
    id: "hero-feature-1",
    name: "Handmade jewelry collection",
    image: "/images/hero-feature-1.png",
    href: "/shop" as const,
  },
  {
    id: "hero-feature-2",
    name: "Custom bracelets and watches",
    image: "/images/hero-feature-2.png",
    href: "/shop" as const,
  },
  {
    id: "hero-feature-3",
    name: "Floral sets and beaded watches",
    image: "/images/hero-feature-3.png",
    href: "/shop" as const,
  },
] as const;

const BEAD_CATEGORIES = new Set(["Beads", "Fancy beads", "Raw materials"]);

const homeFaqs = [
  {
    question: "What does Rachel Paradise sell?",
    answer: aeoAnswers.whatWeSell,
  },
  {
    question: "Can I customize jewelry at Rachel Paradise?",
    answer: aeoAnswers.customization,
  },
  {
    question: "Does Rachel Paradise ship handmade jewelry?",
    answer: aeoAnswers.shipping,
  },
];

export const Route = createFileRoute("/")({
  head: () =>
    buildPageHead({
      title: `${siteConfig.name} — Where every jewel is handmade with love`,
      description: siteConfig.description,
      path: "/",
      image: HERO_IMAGE,
      keywords: [
        "Rachel Paradise jewelry",
        "handcrafted bracelets",
        "custom bead jewelry",
        "premium jewelry India",
      ],
    }),
  loader: async () => {
    if (isStaticSite) return getStaticReelViews();
    // Don't block first paint — views hydrate after mount.
    return {} as Record<string, number>;
  },
  component: HomePage,
});

function toCardProduct(item: {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  featured?: boolean;
  badge?: string;
}): Product {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    description: item.description,
    image: item.image,
    featured: item.featured,
    limitedEdition: item.badge?.toLowerCase().includes("limited") ?? false,
  };
}

function HomePage() {
  const initialViews = Route.useLoaderData();
  const [reelViews, setReelViews] = useState(initialViews);
  const { products, loading, ready } = useInventory();

  const trending = useMemo(() => {
    const featured = products.filter((p) => p.featured);
    const source = featured.length > 0 ? featured : products;
    return source.slice(0, 4).map(toCardProduct);
  }, [products]);

  const recommended = useMemo(() => {
    const rest = products.filter((p) => !trending.some((t) => t.id === p.id));
    const source = rest.length > 0 ? rest : products;
    return source.slice(0, 4).map(toCardProduct);
  }, [products, trending]);

  const beadPalette = useMemo((): BeadStrand[] => {
    return products
      .filter((p) => BEAD_CATEGORIES.has(p.category))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: (p.cartSubtitle?.includes("pc") ? "pc" : "strand") as BeadStrand["unit"],
        image: p.image,
      }));
  }, [products]);

  const paletteCards = useMemo(() => {
    if (beadPalette.length > 0) return null;
    const used = new Set(trending.map((p) => p.id));
    return products
      .filter((p) => !used.has(p.id))
      .slice(0, 4)
      .map(toCardProduct);
  }, [beadPalette, products, trending]);

  useEffect(() => {
    if (isStaticSite) return;
    let cancelled = false;
    void fetchInstagramReelViews()
      .then((views) => {
        if (!cancelled) setReelViews(views);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const showProductLoading = !ready || (loading && products.length === 0);

  return (
    <PageLayout>
      <JsonLd data={faqJsonLd(homeFaqs)} />
      {/* Hero */}
      <section className="relative min-h-[85vh] overflow-hidden bg-blush-section">
        <img
          src={HERO_IMAGE}
          alt="Handcrafted jewelry worn with elegance"
          className="absolute inset-0 size-full object-cover object-[center_20%] md:object-[70%_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/25 md:via-white/60 md:to-transparent" />
        <div className="relative mx-auto grid min-h-[85vh] max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-8 md:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-burgundy/80">
              {siteConfig.welcomeLine}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-burgundy md:text-5xl lg:text-6xl">
              {siteConfig.tagline.replace(/\.$/, "")}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/80 md:text-base">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/shop"
                search={{ q: "" }}
                className="inline-flex items-center justify-center bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              >
                Shop Now
              </Link>
              <Link
                to="/customize"
                className="inline-flex items-center justify-center border-2 border-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-burgundy transition-colors hover:bg-burgundy/5"
              >
                Customize Your Jewelry
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden h-[28rem] w-full max-w-md md:block lg:h-[32rem] lg:max-w-lg">
            {HERO_FEATURED.map((item, index) => {
              const placements = [
                "left-0 top-6 z-10 w-[58%] rotate-[-6deg] animate-in fade-in slide-in-from-bottom-4 duration-700",
                "right-0 top-0 z-20 w-[62%] rotate-[4deg] animate-in fade-in slide-in-from-bottom-4 duration-700",
                "bottom-2 left-[18%] z-30 w-[64%] rotate-[-2deg] animate-in fade-in slide-in-from-bottom-4 duration-700",
              ] as const;
              return (
                <Link
                  key={item.id}
                  to="/shop"
                  search={{ q: "" }}
                  className={`absolute overflow-hidden rounded-sm bg-white/50 shadow-[0_18px_40px_rgba(90,20,50,0.16)] ring-1 ring-white/80 transition-transform duration-500 hover:-translate-y-1 hover:rotate-0 ${placements[index]}`}
                  style={{ animationDelay: `${150 + index * 140}ms` }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-[4/5] size-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            Trending Now
          </h2>
          {showProductLoading ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">Loading pieces…</p>
          ) : trending.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              New pieces will appear here once added in Admin Inventory.
            </p>
          ) : (
            <div className="mt-12 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map((product) => (
                <div key={product.id} className="h-full">
                  <VkProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* The Artist's Palette */}
      <section className="bg-blush-section py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            The Artist&apos;s Palette: Premium Beads
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground md:text-base">
            Sourced from around the world, our beads are the foundation of your unique creation.
            Choose by stone, color, or energy.
          </p>
          {beadPalette.length > 0 ? (
            <div className="mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {beadPalette.map((bead) => (
                <BeadStrandCard key={bead.id} bead={bead} />
              ))}
            </div>
          ) : paletteCards && paletteCards.length > 0 ? (
            <div className="mt-12 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paletteCards.map((product) => (
                <div key={product.id} className="h-full">
                  <VkProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              Inventory will show here when products are added in Admin.
            </p>
          )}
          <div className="mt-12 flex justify-center">
            <Link
              to="/shop"
              search={{ q: "" }}
              className="inline-flex min-w-[280px] items-center justify-center bg-burgundy px-10 py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 md:min-w-[360px]"
            >
              Explore Full Bead Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended For You */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            Recommended For You
          </h2>
          {recommended.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              Recommendations will appear once products are in Admin Inventory.
            </p>
          ) : (
            <div className="mt-12 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.map((product) => (
                <div key={`rec-${product.id}`} className="h-full">
                  <VkProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <InstagramReelStrip reelViews={reelViews} />

      {/* Quick answers — AEO */}
      <section className="bg-blush-section py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl">
            Quick Answers
          </h2>
          <div className="mt-10 space-y-6">
            {homeFaqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-serif text-xl text-burgundy">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={PHILOSOPHY_IMAGE}
              alt="Artisan crafting pearl jewelry"
              className="aspect-[4/5] w-full object-cover lg:aspect-auto lg:h-[560px]"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-burgundy/70">
              Our Philosophy
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-burgundy md:text-4xl lg:text-[2.5rem]">
              Beyond Jewelry: A Celebration of Your Story
            </h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              At {siteConfig.brandName}, we believe that the most precious jewelry is the one you
              helped create. Every bead is a choice, every knot is a promise. Our artisans combine
              traditional techniques with your unique vision to create heirlooms that are as
              meaningful as they are beautiful.
            </p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-serif text-xl text-burgundy">Ethically Sourced</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Every stone and metal is traced from mine to market with integrity.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-burgundy">Handcrafted</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  No mass production. Each piece is assembled by hand in our studio.
                </p>
              </div>
            </div>
            <Link
              to="/philosophy"
              className="mt-10 inline-flex bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
            >
              Read Our Full Story
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-blush-section py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            What Our Clients Say
          </h2>
          <div className="mt-12 grid auto-rows-fr gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Join the Journal */}
      <section className="relative overflow-hidden">
        <img
          src={JOURNAL_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        <div className="relative mx-auto max-w-2xl px-4 py-20 text-center md:px-8 md:py-28">
          <h2 className="font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            Join the Journal
          </h2>
          <p className="mt-5 font-serif text-lg leading-relaxed text-burgundy/80">
            Receive curated inspirations, early access to new collections, and stories from our
            studio.
          </p>
          <form
            className="mt-10"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="journal-email" className="sr-only">Email address</label>
            <input
              id="journal-email"
              type="email"
              placeholder="Your Email Address"
              className="w-full border-0 border-b-2 border-burgundy/30 bg-transparent py-3 text-center font-serif text-burgundy placeholder:text-burgundy/50 outline-none focus:border-burgundy"
            />
            <button
              type="submit"
              className="mt-8 w-full max-w-xs bg-burgundy px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </PageLayout>
  );
}
