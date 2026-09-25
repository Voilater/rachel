import {
  additionalShopProducts,
  tagCoreProducts,
} from "@/lib/shop-filters";
import type { ShopCategory } from "@/lib/shop-categories";

export type { ShopCategory } from "@/lib/shop-categories";
export {
  LEGACY_CATEGORY_MAP,
  SHOP_CATEGORIES,
  normalizeShopCategory,
} from "@/lib/shop-categories";

export const siteConfig = {
  name: "Rachel Paradise",
  brandName: "Rachel Paradise",
  logo: "/images/rachel-paradise-logo.png",
  logoIcon: "/images/rachel-paradise-logo-icon.png",
  title: "Handmade Jewelry with Love",
  description:
    "Crafted with care, passion, and a little sparkle to make every moment special. Because you deserve jewellery as unique as you are.",
  email: "rachelparadise15@gmail.com",
  phone: "+91 90428 45836",
  location: "Madurai, India",
  studio: {
    address: "2/1013, Ezhil Nagar, Lilly Malar Street, Iyer Bungalow, Madurai 625014",
    hours: "Mon – Sat: 10am – 6pm",
  },
  atelierHours: {
    weekdays: "Monday – Friday: 10am – 6pm",
    saturday: "Saturday: 11am – 4pm",
  },
  whatsapp: "+919042845836",
  tagline: "Where every jewel is handmade with love.",
  welcomeLine: "Welcome to Rachel Paradise",
  instagram: {
    handle: "rachel_paradise_",
    profileUrl:
      "https://www.instagram.com/rachel_paradise_?igsh=NDZ0MmV1YXE0d2p2",
    reelsUrl: "https://www.instagram.com/rachel_paradise_/reels/",
    embedProfileUrl: "https://www.instagram.com/rachel_paradise_/embed",
  },
};

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/customize", label: "Customize" },
  { to: "/philosophy", label: "About" },
  { to: "/contact", label: "Contact Us" },
] as const;

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  images?: string[];
  longDescription?: string;
  reviewCount?: number;
  category: ShopCategory;
  badge?: string;
  featured?: boolean;
  sizes?: string[];
  colors?: { id: string; hex: string; label: string }[];
  cartPrice?: number;
  cartSubtitle?: string;
  stock?: number;
  sku?: string;
}

export const coreShopProducts: ShopProduct[] = [
  {
    id: "name-bracelet",
    name: "Name Bracelet",
    price: 599,
    cartPrice: 599,
    rating: 4.9,
    reviewCount: 48,
    description:
      "Personalized letter beads with purple crackle beads, heart accents, and a unicorn charm — handcrafted to your name.",
    longDescription:
      "Our signature Name Bracelet is handmade with purple crackle beads, iridescent heart accents, and a dangling unicorn charm. Customize the letter beads with any name. Soft stretch fit for everyday wear.",
    image: "/images/name-bracelet.png",
    images: ["/images/name-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "purple", hex: "#7b4aa8", label: "Purple" },
      { id: "clear", hex: "#e8e4f0", label: "Clear" },
    ],
  },
  {
    id: "magnetic-bracelet",
    name: "Magnetic Bracelet",
    price: 799,
    cartPrice: 799,
    rating: 4.9,
    reviewCount: 36,
    description:
      "Matching pink couple bracelets with a magnetic butterfly clasp — they snap together as one.",
    longDescription:
      "A pair of frosted pink beaded bracelets connected by a magnetic butterfly charm. Wear them separately or bring them together — the halves snap into a full butterfly. Silver star chain accents on each wrist. Perfect for couples or best friends.",
    image: "/images/magnetic-bracelet.png",
    images: ["/images/magnetic-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "pink", hex: "#f3b6c4", label: "Pink" },
      { id: "silver", hex: "#c0c0c0", label: "Silver" },
    ],
  },
  {
    id: "chip-bead-bracelet",
    name: "Chip Bead Bracelet",
    price: 549,
    cartPrice: 549,
    rating: 4.8,
    reviewCount: 28,
    description:
      "Turquoise chip stones with sky-blue faceted beads and silver spacers — natural texture, handmade finish.",
    longDescription:
      "Hand-strung Chip Bead Bracelet with natural turquoise chip stones, bright cyan faceted beads, and polished silver spacers. Finished with a silver lobster clasp. Lightweight and easy for everyday wear.",
    image: "/images/chip-bead-bracelet.png",
    images: ["/images/chip-bead-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "turquoise", hex: "#7ec8c3", label: "Turquoise" },
      { id: "sky", hex: "#5ec8e8", label: "Sky Blue" },
    ],
  },
  {
    id: "watch-bracelet",
    name: "Watch Bracelet",
    price: 899,
    cartPrice: 899,
    rating: 4.9,
    reviewCount: 31,
    description:
      "Teal and smoky-grey beaded bracelet watch with a crystal rose-gold face and moon charm.",
    longDescription:
      "A handmade Watch Bracelet with alternating teal cat-eye and smoky-grey beads. The rose-gold quartz watch face has a crystal flower bezel, plus a sparkling crescent moon charm. Stretch fit for comfortable everyday wear.",
    image: "/images/watch-bracelet.png",
    images: ["/images/watch-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "teal", hex: "#2bb5b0", label: "Teal" },
      { id: "smoke", hex: "#8a8a8a", label: "Smoky Grey" },
    ],
  },
  {
    id: "tulip-bracelet",
    name: "Tulip Bracelet",
    price: 649,
    cartPrice: 649,
    rating: 4.9,
    reviewCount: 22,
    description:
      "Lilac tulip charms with purple crackle beads and clear spacers — a floral handmade stretch bracelet.",
    longDescription:
      "Handcrafted Tulip Bracelet with four lilac tulip charms, green leaf beads, vibrant purple crackle glass, and faceted clear spacers. Soft stretch fit with a whimsical spring floral look.",
    image: "/images/tulip-bracelet.png",
    images: ["/images/tulip-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "lilac", hex: "#c4a4d8", label: "Lilac" },
      { id: "purple", hex: "#8b3a9b", label: "Purple" },
    ],
  },
  {
    id: "flower-bracelet",
    name: "Flower Bracelet",
    price: 599,
    cartPrice: 599,
    rating: 4.9,
    reviewCount: 27,
    description:
      "Alternating red and white daisy flowers with yellow centers — clasp and extender chain for a perfect fit.",
    longDescription:
      "Handmade Flower Bracelet in a daisy-chain style: white opaque petals and faceted red crystal petals, each with a golden-yellow center. Linked with clear seed beads, finished with a silver lobster clasp and adjustable extender chain.",
    image: "/images/flower-bracelet.png",
    images: ["/images/flower-bracelet.png"],
    category: "Bracelets",
    badge: "Original",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "red", hex: "#d43b3b", label: "Red" },
      { id: "white", hex: "#f5f5f5", label: "White" },
    ],
  },
  {
    id: "pink-ad-stone-pendant-chain",
    name: "Pink AD Stone Pendant Chain",
    price: 999,
    cartPrice: 999,
    rating: 4.9,
    reviewCount: 19,
    description:
      "Hot-pink bead chain with a gold AD floral pendant — sparkling teardrop stones and S-hook clasp.",
    longDescription:
      "Elegant Pink AD Stone Pendant Chain with translucent magenta beads, gold spacer accents, and a V-shaped crystal connector. The centerpiece is a five-petal pink AD flower pendant. Finished with a gold S-hook clasp for easy wear.",
    image: "/images/pink-ad-stone-pendant-chain.png",
    images: ["/images/pink-ad-stone-pendant-chain.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["16\"", "18\"", "20\""],
    colors: [
      { id: "pink", hex: "#e91e8c", label: "Pink" },
      { id: "gold", hex: "#d4af37", label: "Gold" },
    ],
  },
  {
    id: "red-ad-stone-invisible-chain",
    name: "Red AD Stone Invisible Chain",
    price: 899,
    cartPrice: 899,
    rating: 4.9,
    reviewCount: 16,
    description:
      "Delicate gold invisible wire with faceted red beads and a crystal AD floral drop pendant.",
    longDescription:
      "Minimal Red AD Stone Invisible Chain on a fine gold-toned wire. Six faceted red beads sit between textured gold caps, with a central clear AD floral pendant and a red teardrop drop. Lobster clasp with extender for an adjustable fit.",
    image: "/images/red-ad-stone-invisible-chain.png",
    images: ["/images/red-ad-stone-invisible-chain.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["16\"", "18\"", "20\""],
    colors: [
      { id: "red", hex: "#c62828", label: "Red" },
      { id: "gold", hex: "#d4af37", label: "Gold" },
    ],
  },
  {
    id: "pearl-chain",
    name: "Pearl Chain",
    price: 749,
    cartPrice: 749,
    rating: 4.9,
    reviewCount: 33,
    description:
      "Classic white pearl strand with a teardrop pearl pendant, gold clasp, and heart extender charm.",
    longDescription:
      "Timeless Pearl Chain of closely strung lustrous white pearls with a larger teardrop pearl drop at the center. Finished with a gold lobster clasp, curb-link extender, and a small gold heart charm.",
    image: "/images/pearl-chain.png",
    images: ["/images/pearl-chain.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["16\"", "18\"", "20\""],
    colors: [
      { id: "pearl", hex: "#f5f0e8", label: "Pearl" },
      { id: "gold", hex: "#d4af37", label: "Gold" },
    ],
  },
  {
    id: "invisible-chain",
    name: "Invisible Chain",
    price: 1299,
    cartPrice: 1299,
    rating: 4.9,
    reviewCount: 14,
    description:
      "Red AD invisible-chain necklace with matching leaf drop earrings — gold tone set.",
    longDescription:
      "Complete Invisible Chain set: a fine gold wire necklace with a rectangular red AD center stone, crystal border, and red teardrop frame, plus matching gold leaf earrings with red stones and dangling beads. Lobster clasp with extender included.",
    image: "/images/invisible-chain.png",
    images: ["/images/invisible-chain.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["16\"", "18\"", "20\""],
    colors: [
      { id: "red", hex: "#b71c1c", label: "Red" },
      { id: "gold", hex: "#d4af37", label: "Gold" },
    ],
  },
  {
    id: "butterfly-invisible-chain-earrings",
    name: "Butterfly Invisible Chain with Earring",
    price: 1199,
    cartPrice: 1199,
    rating: 4.9,
    reviewCount: 12,
    description:
      "Gold invisible-chain necklace with AD butterfly charms and matching butterfly drop earrings.",
    longDescription:
      "Delicate Butterfly Invisible Chain set: a fine gold wire necklace with three clear AD butterfly charms and textured gold beads, plus matching butterfly drop earrings. Lobster clasp with extender for an adjustable fit.",
    image: "/images/butterfly-invisible-chain-earrings.png",
    images: ["/images/butterfly-invisible-chain-earrings.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["16\"", "18\"", "20\""],
    colors: [
      { id: "clear", hex: "#f8f8f8", label: "Clear AD" },
      { id: "gold", hex: "#d4af37", label: "Gold" },
    ],
  },
  {
    id: "kids-beads-malai-chain",
    name: "Kids Beads Malai / Chain",
    price: 699,
    cartPrice: 699,
    rating: 4.8,
    reviewCount: 21,
    description:
      "Colorful kids malai set — yellow, pink, black-gold, pearl, and rainbow bead chains with screw clasps.",
    longDescription:
      "Fun Kids Beads Malai / Chain pack with multiple playful strands: yellow faceted beads, pink hearts, black-and-gold beads, white pearl-style malais, and clear rainbow-center beads. Each chain has a gold screw clasp — perfect for little ones and festive styling.",
    image: "/images/kids-beads-malai-chain.png",
    images: ["/images/kids-beads-malai-chain.png"],
    category: "Chain",
    badge: "Original",
    featured: true,
    sizes: ["Kids"],
    colors: [
      { id: "multi", hex: "#f5a623", label: "Multicolor" },
      { id: "pink", hex: "#f48fb1", label: "Pink" },
    ],
  },
];

export const baseShopProducts: ShopProduct[] = [
  ...tagCoreProducts(coreShopProducts),
  ...additionalShopProducts,
];

export const footerDiscover = [
  { label: "The Craftsmanship", to: "/philosophy" },
  { label: "Sustainability", to: "/philosophy" },
  { label: "Private Appointments", to: "/contact" },
] as const;

export const footerCare = [
  { label: "Care Guide", to: "/overview" },
  { label: "Shipping & Returns", to: "/contact" },
  { label: "Contact Us", to: "/contact" },
] as const;

export const footerShopping = [
  { label: "New Arrivals", to: "/shop" },
  { label: "Custom Orders", to: "/customize" },
  { label: "Beads & Materials", to: "/shop" },
  { label: "Care Guide", to: "/overview" },
] as const;

export const footerInformation = [
  { label: "Sustainability", to: "/philosophy" },
  { label: "Shipping & Returns", to: "/contact" },
  { label: "Journal", to: "/" },
  { label: "Privacy Policy", to: "/philosophy" },
] as const;

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  limitedEdition?: boolean;
  featured?: boolean;
}

export interface BeadStrand {
  id: string;
  name: string;
  price: number;
  unit: "strand" | "pc";
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

/** Static-site only — live home uses Admin/MySQL inventory. */
export const trendingProducts: Product[] = [];

/** Products shown on the shop listing. */
export const shopProducts: ShopProduct[] = baseShopProducts;

export const premiumBeads: BeadStrand[] = [];

/** Static prerender catalog only. Live shop loads from Admin/MySQL. */
export const allCatalogProducts: ShopProduct[] = [...baseShopProducts];

export const testimonials: Testimonial[] = [
  {
    id: "elena",
    name: "Elena R.",
    role: "Verified Collector",
    quote:
      "The customization process was so intuitive. I designed a bracelet set for my wedding that felt entirely my own.",
    avatar: "/images/name-bracelet.png",
  },
  {
    id: "sophia",
    name: "Sophia W.",
    role: "Jewelry Artisan",
    quote:
      "Rachel Paradise beads are unmatched in clarity and color saturation. They elevate every piece I create.",
    avatar: "/images/name-bracelet.png",
  },
  {
    id: "margot",
    name: "Margot D.",
    role: "Bespoke Client",
    quote:
      "A bespoke high jewelry set for our anniversary — every detail was considered, and the result was breathtaking.",
    avatar: "/images/name-bracelet.png",
  },
];

export const contactFaqs = [
  {
    id: "care",
    question: "How do I care for my handmade beads?",
    answer:
      "To maintain the luster of your Lumina pieces, avoid direct contact with perfumes and oils. Gently wipe with a soft, dry cloth after each wear and store in the provided velvet pouch to prevent oxidation.",
  },
  {
    id: "bespoke",
    question: "Do you accept bespoke orders?",
    answer:
      "Yes. Our artisans collaborate on custom bracelets, necklaces, and ceremonial sets. Share your intentions via the form above or book a private appointment — we respond within 48 hours with a timeline and quote.",
  },
  {
    id: "shipping",
    question: "What is your shipping & return policy?",
    answer:
      "Standard delivery is complimentary on most orders. Express fulfillment is available at checkout. Unworn pieces may be returned within 14 days in original packaging; bespoke items are final sale unless agreed in writing.",
  },
] as const;

export const contactGalleryImages = [
  {
    id: "name-bracelet",
    image: "/images/name-bracelet.png",
    alt: "Personalized name bracelet",
  },
  {
    id: "magnetic-bracelet",
    image: "/images/magnetic-bracelet.png",
    alt: "Magnetic couple bracelet",
  },
  {
    id: "watch-bracelet",
    image: "/images/watch-bracelet.png",
    alt: "Beaded watch bracelet",
  },
  {
    id: "tulip-bracelet",
    image: "/images/tulip-bracelet.png",
    alt: "Tulip charm bracelet",
  },
  {
    id: "flower-bracelet",
    image: "/images/flower-bracelet.png",
    alt: "Flower bead bracelet",
  },
  {
    id: "pearl-chain",
    image: "/images/pearl-chain.png",
    alt: "Pearl chain necklace",
  },
  {
    id: "pink-ad-stone-pendant-chain",
    image: "/images/pink-ad-stone-pendant-chain.png",
    alt: "Pink AD stone pendant chain",
  },
  {
    id: "invisible-chain",
    image: "/images/invisible-chain.png",
    alt: "Invisible chain jewelry set",
  },
  {
    id: "chip-bead-bracelet",
    image: "/images/chip-bead-bracelet.png",
    alt: "Chip bead bracelet",
  },
  {
    id: "butterfly-invisible-chain-earrings",
    image: "/images/butterfly-invisible-chain-earrings.png",
    alt: "Butterfly invisible chain earrings",
  },
  {
    id: "hero-feature-1",
    image: "/images/hero-feature-1.png",
    alt: "Handmade jewelry collection flatlay",
  },
  {
    id: "hero-feature-2",
    image: "/images/hero-feature-2.png",
    alt: "Custom bracelets and watches",
  },
] as const;

/** @deprecated Prefer pickContactGallery() for varied images */
export const contactGallery = contactGalleryImages.slice(0, 4);

export function pickContactGallery(count = 4) {
  const pool = [...contactGalleryImages];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

/** Instagram reels — permalinks from Instagram app → Share → Copy link */
export type InstagramReel = {
  id: string;
  title: string;
  permalink: string;
  /** Optional manual view count; omit to auto-fetch from Instagram on the home page */
  views?: number;
};

export const instagramReels: readonly InstagramReel[] = [
  {
    id: "reel-DZmDw5Bxjb0",
    title: "Studio reel",
    permalink: "https://www.instagram.com/reel/DZmDw5Bxjb0/",
  },
  {
    id: "reel-DZR3BeHRSzz",
    title: "Behind the craft",
    permalink: "https://www.instagram.com/reel/DZR3BeHRSzz/",
  },
  {
    id: "reel-DZJ07YxRrkN",
    title: "From the atelier",
    permalink: "https://www.instagram.com/reel/DZJ07YxRrkN/",
  },
  {
    id: "reel-DZEmzTMR2lw",
    title: "Pearl details",
    permalink: "https://www.instagram.com/reel/DZEmzTMR2lw/",
  },
  {
    id: "reel-DYlpY3FR9iG",
    title: "Handcrafted moments",
    permalink: "https://www.instagram.com/reel/DYlpY3FR9iG/",
  },
  {
    id: "reel-DYqsn0qRBT3",
    title: "Jewelry in motion",
    permalink: "https://www.instagram.com/reel/DYqsn0qRBT3/",
  },
  {
    id: "reel-DYKIbKrRJMy",
    title: "Studio glow",
    permalink: "https://www.instagram.com/reel/DYKIbKrRJMy/",
  },
  {
    id: "reel-DWdRwhkkYi-",
    title: "Craft & care",
    permalink: "https://www.instagram.com/reel/DWdRwhkkYi-/",
  },
  {
    id: "reel-DWA3FtrkS72",
    title: "Rose & gilded",
    permalink: "https://www.instagram.com/reel/DWA3FtrkS72/",
  },
  {
    id: "reel-DZrTSPzxB2n",
    title: "Latest from Rachel",
    permalink: "https://www.instagram.com/reel/DZrTSPzxB2n/",
  },
];

export const contactSubjects = [
  "General Inquiry",
  "Custom Order",
  "Private Appointment",
  "Shipping & Returns",
  "Wholesale",
] as const;

export function formatPrice(amount: number) {
  const number = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₹${number}`;
}

export function getShopProduct(id: string) {
  return allCatalogProducts.find((p) => p.id === id);
}

export function getRelatedProducts(excludeId: string, limit = 4) {
  return allCatalogProducts.filter((p) => p.id !== excludeId).slice(0, limit);
}

export function formatBeadPrice(amount: number, unit: BeadStrand["unit"]) {
  return `${formatPrice(amount)} / ${unit}`;
}
