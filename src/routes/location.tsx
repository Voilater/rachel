import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import { PageLayout } from "@/components/layout/PageLayout";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/location")({
  head: () => ({ meta: [{ title: `Location — ${siteConfig.name}` }] }),
  component: LocationPage,
});

function LocationPage() {
  return (
    <PageLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 md:px-8 md:py-28">
        <h1 className="font-serif text-4xl text-burgundy md:text-5xl">Visit Our Atelier</h1>
        <div className="mt-8 flex items-start gap-4">
          <MapPin className="mt-1 size-5 shrink-0 text-burgundy" />
          <div>
            <p className="font-medium text-foreground">{siteConfig.location}</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Experience our collections in person at our Mumbai atelier. Private appointments
              are available for custom consultations and bespoke jewelry design.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Open Tuesday – Saturday, 10:00 AM – 7:00 PM
            </p>
          </div>
        </div>
        <div className="mt-12 aspect-[16/9] overflow-hidden rounded-2xl bg-blush-section">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
            alt="VK atelier interior"
            className="size-full object-cover"
          />
        </div>
      </section>
    </PageLayout>
  );
}
