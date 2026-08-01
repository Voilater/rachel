import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Clock, Mail, MessageCircle, Plus } from "lucide-react";
import { useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import {
  contactFaqs,
  contactGallery,
  contactSubjects,
  siteConfig,
} from "@/lib/site-data";

const JOURNAL_IMAGE =
  "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=1600&h=700&fit=crop";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: `Contact Us — ${siteConfig.name}` }] }),
  component: ContactPage,
});

function ContactPage() {
  const [openFaq, setOpenFaq] = useState<string>(contactFaqs[0].id);
  const [subject, setSubject] = useState<string>(contactSubjects[0]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-blush-section px-4 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-burgundy/80">
            Get in Touch
          </p>
          <h1 className="mt-4 font-serif text-4xl text-burgundy md:text-5xl">
            Connect with Intention
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">
            Whether you are seeking a bespoke creation or have a question about our artisanal
            process, our concierge is here to guide your journey.
          </p>
        </div>
      </section>

      {/* Contact cards + form */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-12">
          <div className="space-y-4">
            <div className="rounded-2xl bg-blush-card/80 p-6">
              <Mail className="size-5 text-burgundy/70" strokeWidth={1.5} />
              <h2 className="mt-4 font-serif text-lg text-foreground">Email Support</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Our intentional response time is within 24 hours.
              </p>
              <a
                href={`mailto:${siteConfig.email}`}
                className="mt-3 text-sm font-medium text-burgundy hover:underline"
              >
                {siteConfig.email}
              </a>
            </div>

            <div className="rounded-2xl bg-blush-card/80 p-6">
              <MessageCircle className="size-5 text-burgundy/70" strokeWidth={1.5} />
              <h2 className="mt-4 font-serif text-lg text-foreground">WhatsApp Concierge</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                For immediate styling advice and order updates.
              </p>
              <a
                href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-sm font-medium text-burgundy hover:underline"
              >
                {siteConfig.phone}
              </a>
            </div>

            <div className="rounded-2xl bg-blush-card/80 p-6">
              <Clock className="size-5 text-burgundy/70" strokeWidth={1.5} />
              <h2 className="mt-4 font-serif text-lg text-foreground">Atelier Hours</h2>
              <p className="mt-2 text-sm text-muted-foreground">{siteConfig.atelierHours.weekdays}</p>
              <p className="text-sm text-muted-foreground">{siteConfig.atelierHours.saturday}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-blush-card/50 p-6 md:p-8">
            <form
              className="rounded-2xl bg-white p-6 shadow-sm md:p-8"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Full Name</span>
                  <input
                    type="text"
                    placeholder="Evelyn Grace"
                    className="mt-2 w-full rounded-xl border border-border bg-blush-section/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground">Email Address</span>
                  <input
                    type="email"
                    placeholder="evelyn@example.com"
                    className="mt-2 w-full rounded-xl border border-border bg-blush-section/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  />
                </label>
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-medium text-foreground">Subject</span>
                <div className="relative mt-2">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-border bg-blush-section/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                  >
                    {contactSubjects.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-medium text-foreground">Your Message</span>
                <textarea
                  rows={5}
                  placeholder="Share your intentions with us..."
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-blush-section/50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                />
              </label>

              <button
                type="submit"
                className="mt-8 w-full rounded-full bg-burgundy py-4 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-blush-section px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-serif text-3xl text-burgundy md:text-4xl">
            Common Intentions
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Simple answers to frequent wanderings.
          </p>
          <div className="mt-10 space-y-3">
            {contactFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="rounded-xl border border-border bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? "" : faq.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{faq.question}</span>
                    {isOpen ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Plus className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <h2 className="font-serif text-3xl text-burgundy md:text-4xl">Follow Our Journey</h2>
        <p className="mt-3 text-muted-foreground">
          A curated exploration of artisanal light and ethereal textures.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {contactGallery.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl bg-blush-section">
              <img
                src={item.image}
                alt={item.alt}
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Connect Us */}
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
            <label htmlFor="contact-email" className="sr-only">Email</label>
            <input
              id="contact-email"
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
