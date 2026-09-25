import { siteConfig } from "@/lib/site-data";

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  const fromEnv =
    (typeof process !== "undefined" && process.env.APP_BASE_URL?.trim()) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env
        ?.VITE_APP_BASE_URL) ||
    "";
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return getSiteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteUrl()}${path}`;
}

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "product" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageHead({
  title,
  description,
  path,
  image = siteConfig.logo,
  type = "website",
  noIndex = false,
  keywords = [],
}: PageSeoInput) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const fullTitle = title.includes(siteConfig.name)
    ? title
    : `${title} — ${siteConfig.name}`;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      ...(keywords.length
        ? [{ name: "keywords", content: keywords.join(", ") }]
        : []),
      {
        name: "robots",
        content: noIndex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { name: "author", content: siteConfig.brandName },
      { name: "theme-color", content: "#7a1f3d" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:type", content: type === "product" ? "product" : "website" },
      { property: "og:site_name", content: siteConfig.brandName },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:alt", content: fullTitle },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: siteConfig.brandName,
    url: getSiteUrl(),
    logo: absoluteUrl(siteConfig.logo),
    image: absoluteUrl(siteConfig.logo),
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "2/1013, Ezhil Nagar, Lilly Malar Street, Iyer Bungalow",
      addressLocality: "Madurai",
      addressRegion: "Tamil Nadu",
      postalCode: "625014",
      addressCountry: "IN",
    },
    sameAs: [siteConfig.instagram.profileUrl],
    priceRange: "₹₹",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.brandName,
    url: getSiteUrl(),
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  sku?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
}) {
  const availability =
    typeof product.stock === "number" && product.stock <= 0
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [absoluteUrl(product.image)],
    sku: product.sku ?? product.id,
    brand: {
      "@type": "Brand",
      name: siteConfig.brandName,
    },
    category: product.category,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.id}`),
      priceCurrency: "INR",
      price: product.price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: siteConfig.brandName,
      },
    },
    ...(product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount ?? 1,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Short answer-style copy for AEO / featured snippets. */
export const aeoAnswers = {
  whatWeSell:
    "Rachel Paradise sells handcrafted jewelry including bracelets, chains, beads, earrings, and custom pieces made for everyday and occasion wear.",
  customization:
    "Yes — you can customize jewelry on Rachel Paradise by choosing beads, colors, and personal details through the Customize page or product customize option.",
  shipping:
    "Rachel Paradise ships handmade jewelry from its studio. Delivery timelines and return options are listed on the Contact and Care pages.",
};
