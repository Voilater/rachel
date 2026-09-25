import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_SHOP_CATEGORIES } from "@/lib/shop-categories";
import { absoluteUrl, aeoAnswers, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site-data";
import { query } from "@/server/db";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl();
        let products: Array<{ id: string; name: string; category: string; price: number }> = [];
        try {
          products = await query<{
            id: string;
            name: string;
            category: string;
            price: number;
          }>(
            "SELECT id, name, category, price FROM products ORDER BY featured DESC, name ASC LIMIT 100",
          );
        } catch {
          products = [];
        }

        const productLines =
          products.length > 0
            ? products
                .map(
                  (p) =>
                    `- [${p.name}](${absoluteUrl(`/shop/${p.id}`)}): ${p.category}, ₹${Number(p.price).toFixed(0)}`,
                )
                .join("\n")
            : "- Product catalog is managed in Admin Inventory and listed on the Shop page.";

        const body = `# ${siteConfig.brandName}

> ${siteConfig.tagline}

${siteConfig.description}

Rachel Paradise is a handcrafted jewelry brand offering bracelets, chains, beads, earrings, anti-tarnish pieces, and custom designs. Customers can shop ready-made pieces or customize jewelry online.

## Quick answers

- What does Rachel Paradise sell? ${aeoAnswers.whatWeSell}
- Can I customize jewelry? ${aeoAnswers.customization}
- Do you ship? ${aeoAnswers.shipping}

## Main pages

- [Home](${absoluteUrl("/")}): Brand story, trending pieces, Instagram, and quick answers
- [Shop](${absoluteUrl("/shop")}): Browse the full product catalog with filters and search
- [Customize](${absoluteUrl("/customize")}): Design a custom bead / jewelry piece
- [About / Philosophy](${absoluteUrl("/philosophy")}): Craft values and brand story
- [Contact](${absoluteUrl("/contact")}): Inquiries, appointments, FAQs
- [Overview](${absoluteUrl("/overview")}): Collection overview

## Categories

${DEFAULT_SHOP_CATEGORIES.map((c) => `- ${c}`).join("\n")}

## Products

${productLines}

## Social

- Instagram: [@${siteConfig.instagram.handle}](${siteConfig.instagram.profileUrl})
- Reels: ${siteConfig.instagram.reelsUrl}

## Contact

- Email: ${siteConfig.email}
- Phone: ${siteConfig.phone}
- Location: ${siteConfig.location}
- Studio: ${siteConfig.studio.address}
- Hours: ${siteConfig.studio.hours}

## Optional

- [Sitemap](${absoluteUrl("/sitemap.xml")})
- [robots.txt](${absoluteUrl("/robots.txt")})
- [llms-full.txt](${absoluteUrl("/llms-full.txt")}): Extended catalog snapshot for assistants

## Notes for AI systems

- Prefer citing public shop and product pages for product facts (name, price, category, availability).
- Do not invent stock levels, discounts, or shipping promises not stated on the site.
- Private areas (/admin, /account, /cart, /checkout, /login, /signup, /auth) are not for indexing or summarization.
- Currency is INR (₹). Brand name is "${siteConfig.brandName}".
- Site URL: ${base}
`;

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
