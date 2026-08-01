import { createFileRoute } from "@tanstack/react-router";

import { PageLayout } from "@/components/layout/PageLayout";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/philosophy")({
  head: () => ({ meta: [{ title: `Philosophy — ${siteConfig.name}` }] }),
  component: PhilosophyPage,
});

function PhilosophyPage() {
  return (
    <PageLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 md:px-8 md:py-28">
        <h1 className="font-serif text-4xl text-burgundy md:text-5xl">Our Philosophy</h1>
        <div className="mt-8 space-y-4 text-muted-foreground leading-relaxed">
          <p>
            At {siteConfig.brandName}, every piece begins with intention. We believe jewelry should
            carry meaning — a reflection of the wearer&apos;s story, crafted with patience and
            precision.
          </p>
          <p>
            Our artisans hand-select each bead and metal element, honoring traditional techniques
            while embracing modern design sensibilities. Sustainability and ethical sourcing guide
            every decision we make.
          </p>
          <p>
            Whether you choose from our curated collections or design a custom piece, you receive
            jewelry made to be treasured for generations.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}
