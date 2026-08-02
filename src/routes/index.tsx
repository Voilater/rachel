import { createFileRoute, Link } from "@tanstack/react-router";

import { BeadStrandCard } from "@/components/BeadStrandCard";
import { InstagramReelStrip } from "@/components/InstagramReelStrip";
import { TestimonialCard } from "@/components/TestimonialCard";
import { VkProductCard } from "@/components/VkProductCard";
import { PageLayout } from "@/components/layout/PageLayout";
import { getStaticReelViews } from "@/lib/static-reel-views";
import { isStaticSite } from "@/lib/static-site";
import {
  premiumBeads,
  siteConfig,
  testimonials,
  trendingProducts,
} from "@/lib/site-data";
import { fetchInstagramReelViews } from "@/server/instagram";

const HERO_IMAGE = "/images/hero.jpg";
const PHILOSOPHY_IMAGE = "/images/philosophy.jpg";
const JOURNAL_IMAGE = "/images/journal.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${siteConfig.name} — Wear Your Story with Elegance` },
      { name: "description", content: siteConfig.description },
    ],
  }),
  loader: () =>
    isStaticSite ? getStaticReelViews() : fetchInstagramReelViews(),
  component: HomePage,
});

function HomePage() {
  const reelViews = Route.useLoaderData();
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[85vh] overflow-hidden bg-blush-section">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/45 to-white/10" />
        <div className="relative mx-auto flex min-h-[85vh] max-w-7xl items-center px-4 py-16 md:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-burgundy/80">
              Exquisite Craftsmanship
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] text-burgundy md:text-5xl lg:text-6xl">
              Wear Your Story with Elegance
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/80 md:text-base">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/shop"
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
        </div>
      </section>

      {/* Trending Now */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl lg:text-5xl">
            Trending Now
          </h2>
          <div className="mt-12 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <div key={product.id} className="h-full">
                <VkProductCard product={product} />
              </div>
            ))}
          </div>
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
          <div className="mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {premiumBeads.map((bead) => (
              <BeadStrandCard key={bead.id} bead={bead} />
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              to="/shop"
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
          <div className="mt-12 grid auto-rows-fr items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingProducts.map((product) => (
              <div key={`rec-${product.id}`} className="h-full">
                <VkProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <InstagramReelStrip reelViews={reelViews} />

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
