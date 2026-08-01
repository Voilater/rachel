import { createFileRoute, Link } from "@tanstack/react-router";

import { CustomizeForm } from "@/components/CustomizeForm";
import { PageLayout } from "@/components/layout/PageLayout";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [{ title: `Customize — ${siteConfig.name}` }],
  }),
  component: CustomizePage,
});

function CustomizePage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-16">
        <header className="text-center">
          <h1 className="text-4xl leading-tight text-burgundy md:text-5xl">
            Design a Bead that Tells{" "}
            <span className="text-gold">Your Story</span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
            Start from scratch — choose your style, beads, charms, and personal details.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Or{" "}
            <Link to="/shop" className="font-medium text-burgundy hover:underline">
              pick a product from the shop
            </Link>
            {" "}and customize that piece.
          </p>
        </header>

        <CustomizeForm />
      </div>
    </PageLayout>
  );
}
