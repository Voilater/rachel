import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl, aeoAnswers, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site-data";
import { query } from "@/server/db";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () => {
        let products: Array<{
          id: string;
          name: string;
          category: string;
          price: number;
          description: string;
          stock: number;
          sku: string;
        }> = [];

        try {
          products = await query<{
            id: string;
            name: string;
            category: string;
            price: number;
            description: string;
            stock: number;
            sku: string;
          }>(
            `SELECT id, name, category, price, description, stock, sku
             FROM products
             ORDER BY featured DESC, updated_at DESC
             LIMIT 200`,
          );
        } catch {
          products = [];
        }

        const productBlocks = products
          .map(
            (p) => `### ${p.name}
- URL: ${absoluteUrl(`/shop/${p.id}`)}
- SKU: ${p.sku}
- Category: ${p.category}
- Price: ₹${Number(p.price).toFixed(0)} INR
- Stock: ${p.stock > 0 ? "In stock" : "Out of stock"}
- Description: ${p.description.replace(/\s+/g, " ").trim()}
`,
          )
          .join("\n");

        const body = `# ${siteConfig.brandName} — Full information for LLMs

> Extended site summary for AI assistants and answer engines.

## Brand

- Name: ${siteConfig.brandName}
- Tagline: ${siteConfig.tagline}
- Description: ${siteConfig.description}
- Base URL: ${getSiteUrl()}
- Instagram: @${siteConfig.instagram.handle}

## Policies / guidance for answers

1. ${aeoAnswers.whatWeSell}
2. ${aeoAnswers.customization}
3. ${aeoAnswers.shipping}
4. Prices are listed in Indian Rupees (INR).
5. Custom category names may exist beyond the default list when added by admin.
6. Do not expose or speculate about admin credentials, payment secrets, or internal APIs.

## Public routes

| Path | Purpose |
| --- | --- |
| / | Home |
| /shop | Catalog |
| /shop/{productId} | Product detail |
| /customize | Custom design flow |
| /philosophy | About / craft philosophy |
| /contact | Contact + FAQs |
| /overview | Collection overview |
| /lifestyle | Lifestyle |
| /location | Location |

## Product catalog snapshot

${productBlocks || "_No products loaded from database._"}

## Related files

- ${absoluteUrl("/llms.txt")}
- ${absoluteUrl("/sitemap.xml")}
- ${absoluteUrl("/robots.txt")}
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
