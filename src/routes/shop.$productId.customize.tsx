import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { CustomizeForm } from "@/components/CustomizeForm";
import { PageLayout } from "@/components/layout/PageLayout";
import { useInventory } from "@/lib/inventory-store";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/shop/$productId/customize")({
  head: () => ({
    meta: [{ title: `Customize Product — ${siteConfig.name}` }],
  }),
  component: ProductCustomizePage,
});

function ProductCustomizePage() {
  const { productId } = Route.useParams();
  const { getProduct, ready, loading, error } = useInventory();
  const product = getProduct(productId);

  if (!ready || loading) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground md:px-8">
          Loading…
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-8">
          <p className="text-burgundy">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    throw notFound();
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <p className="text-sm text-muted-foreground">
          <Link to="/shop" className="hover:text-burgundy">Shop</Link>
          <span className="mx-2">/</span>
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="hover:text-burgundy"
          >
            {product.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Customize</span>
        </p>

        <header className="mt-6 text-center md:mt-8">
          <h1 className="text-4xl leading-tight text-burgundy md:text-5xl">
            Customize Your {product.name}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
            Personalize this piece with bead colors, charms, initials, and sizing.
          </p>
        </header>

        <CustomizeForm product={product} />
      </div>
    </PageLayout>
  );
}
