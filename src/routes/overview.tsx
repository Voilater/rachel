import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { VkProductCard } from "@/components/VkProductCard";
import { PageLayout } from "@/components/layout/PageLayout";
import { useInventory } from "@/lib/inventory-store";
import { siteConfig, type Product } from "@/lib/site-data";

export const Route = createFileRoute("/overview")({
  head: () => ({ meta: [{ title: `Overview — ${siteConfig.name}` }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const { products, loading, ready } = useInventory();

  const collection = useMemo((): Product[] => {
    return products.slice(0, 12).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      image: p.image,
      featured: p.featured,
      limitedEdition: p.badge?.toLowerCase().includes("limited") ?? false,
    }));
  }, [products]);

  return (
    <PageLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <h1 className="text-center font-serif text-4xl text-burgundy md:text-5xl">
          Collection Overview
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-muted-foreground">
          Explore our signature necklaces, bracelets, and bead collections — each designed to
          elevate everyday elegance.
        </p>
        {!ready || (loading && collection.length === 0) ? (
          <p className="mt-14 text-center text-sm text-muted-foreground">Loading collection…</p>
        ) : collection.length === 0 ? (
          <p className="mt-14 text-center text-sm text-muted-foreground">
            No products yet — add pieces in Admin Inventory.
          </p>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collection.map((product) => (
              <VkProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
