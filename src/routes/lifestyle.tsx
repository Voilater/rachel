import { createFileRoute } from "@tanstack/react-router";

import { PageLayout } from "@/components/layout/PageLayout";
import { siteConfig } from "@/lib/site-data";

export const Route = createFileRoute("/lifestyle")({
  head: () => ({ meta: [{ title: `Lifestyle — ${siteConfig.name}` }] }),
  component: LifestylePage,
});

function LifestylePage() {
  const stories = [
    {
      title: "Morning Rituals",
      text: "Layer delicate pearls with gold accents for an effortless day-to-evening transition.",
      image:
        "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=500&fit=crop",
    },
    {
      title: "Evening Elegance",
      text: "Statement pieces that complement evening wear without overpowering your look.",
      image:
        "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?w=600&h=500&fit=crop",
    },
    {
      title: "Gift of Craft",
      text: "Handmade pieces that make meaningful gifts for life's most cherished moments.",
      image:
        "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=500&fit=crop",
    },
  ];

  return (
    <PageLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <h1 className="text-center font-serif text-4xl text-burgundy md:text-5xl">Lifestyle</h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-muted-foreground">
          Inspiration for wearing, gifting, and living with handcrafted jewelry.
        </p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="aspect-[6/5] overflow-hidden">
                <img src={story.image} alt={story.title} className="size-full object-cover" />
              </div>
              <div className="p-6">
                <h2 className="font-serif text-xl text-burgundy">{story.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{story.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
