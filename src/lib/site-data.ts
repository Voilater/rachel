import {
  additionalShopProducts,
  tagCoreProducts,
} from "@/lib/shop-filters";

export const siteConfig = {
  name: "VK",
  brandName: "Rose & Gilded",
  title: "Handcrafted Premium Jewelry",
  description:
    "Discover handcrafted premium beads and timeless jewelry, or create your own unique masterpiece with our customization service.",
  email: "hello@vkstudio.com",
  phone: "+91 98765 43210",
  location: "Mumbai, India",
  studio: {
    address: "124 Artisan Row, Savile Quarter, London, W1S 3PR",
    hours: "Mon – Sat: 10am – 6pm",
  },
  atelierHours: {
    weekdays: "Monday – Friday: 10am – 6pm",
    saturday: "Saturday: 11am – 4pm (PST)",
  },
  whatsapp: "+919874561230",
  tagline: "Exquisite beads and handcrafted jewelry for the discerning soul.",
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

export type ShopCategory = "Necklaces" | "Bracelets" | "Earrings" | "DIY Kits";

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
    id: "ethereal-rose-bracelet",
    name: "Ethereal Rose Bracelet",
    price: 599,
    cartPrice: 125,
    rating: 4.9,
    reviewCount: 124,
    description:
      "Delicate rose-toned beads with a whimsical cat charm — a playful accent for everyday elegance.",
    longDescription:
      "Hand-strung Rose Quartz beads paired with a 14k gold-filled clasp and delicate charm accents. Each stone is selected for its soft blush hue and natural warmth — a piece that feels personal from the first wear.",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=800&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop",
    ],
    category: "Bracelets",
    badge: "New In",
    featured: true,
    sizes: ["Small (6.5\")", "Medium (7.0\")", "Large (7.5\")"],
    colors: [
      { id: "rose", hex: "#e8b4b8", label: "Rose" },
      { id: "sky", hex: "#b0e0e6", label: "Sky" },
    ],
  },
  {
    id: "celestial-pearl-drops",
    name: "Celestial Pearl Drops",
    price: 1800,
    cartPrice: 180,
    cartSubtitle: "Signature Collection",
    rating: 5.0,
    description:
      "Gold drop earrings crowned with luminous pearls — refined movement for evening occasions.",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
    category: "Earrings",
  },
  {
    id: "azure-horizon-layer",
    name: "Azure Horizon Layer",
    price: 2400,
    rating: 4.8,
    description:
      "A cascading strand of creamy pearls with subtle iridescence — layerable luxury.",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c2f?w=600&h=600&fit=crop",
    category: "Necklaces",
  },
  {
    id: "midnight-glow-band",
    name: "Midnight Glow Band",
    price: 950,
    rating: 4.7,
    description:
      "Deep onyx beads with a satin finish — understated drama for day-to-night wear.",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
    category: "Bracelets",
  },
  {
    id: "artisan-starter-kit",
    name: "Artisan Starter Kit",
    price: 650,
    rating: 5.0,
    description:
      "Curated beads, cord, and tools to begin your first handcrafted piece at home.",
    image:
      "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=600&h=600&fit=crop",
    category: "DIY Kits",
  },
  {
    id: "sun-kissed-choker",
    name: "Sun-Kissed Choker",
    price: 1100,
    rating: 4.9,
    description:
      "Warm golden beads in a close-fit choker — radiant minimalism for sunlit afternoons.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop",
    category: "Necklaces",
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
  { label: "DIY Kits", to: "/shop" },
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

export const trendingProducts: Product[] = [
  {
    id: "aura-layer-necklace",
    name: "The Aura Layer Set",
    price: 245,
    description: "Hand-knotted silk & 18k Gold",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=750&fit=crop&q=80",
    limitedEdition: true,
    featured: true,
  },
  {
    id: "aura-layer-bracelets",
    name: "The Aura Layer Set",
    price: 245,
    description: "Hand-knotted silk & 18k Gold",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop&q=80",
    limitedEdition: true,
  },
  {
    id: "emerald-cascade",
    name: "Emerald Cascade",
    price: 189,
    description: "Natural Emerald & Vermeil",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=750&fit=crop",
  },
  {
    id: "petite-pearl-choker",
    name: "Petite Pearl Choker",
    price: 120,
    description: "Freshwater Pearl & 14k Gold",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop",
  },
];

function homeProductToShopProduct(product: Product): ShopProduct {
  const category: ShopCategory = product.id.includes("bracelet")
    ? "Bracelets"
    : "Necklaces";

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    rating: 4.5,
    description: product.description,
    image: product.image,
    category,
    badge: product.limitedEdition ? "Limited Edition" : undefined,
    featured: product.featured,
    cartPrice: product.price,
    cartSubtitle: product.description,
  };
}

/** Products shown on the shop listing. */
export const shopProducts: ShopProduct[] = baseShopProducts;

export const premiumBeads: BeadStrand[] = [
  {
    id: "lapis-lazuli",
    name: "Lapis Lazuli",
    price: 45,
    unit: "strand",
    image: "/images/philosophy.jpg",
  },
  {
    id: "moonstone",
    name: "Moonstone",
    price: 62,
    unit: "strand",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop",
  },
  {
    id: "african-turquoise",
    name: "African Turquoise",
    price: 38,
    unit: "strand",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=500&h=500&fit=crop",
  },
  {
    id: "rose-gold-elements",
    name: "Rose Gold Elements",
    price: 12,
    unit: "pc",
    image: "/images/journal.jpg",
  },
];

function beadToShopProduct(bead: BeadStrand): ShopProduct {
  const unitLabel = bead.unit === "pc" ? "piece" : "strand";

  return {
    id: bead.id,
    name: bead.name,
    price: bead.price,
    rating: 4.6,
    description: `Premium ${bead.name} — sold per ${bead.unit}. Ideal for custom bracelets, necklaces, and artisan projects.`,
    longDescription: `Hand-selected ${bead.name} from our artisan palette. Each batch is chosen for color consistency and quality. Perfect for bespoke jewelry and DIY creations. Priced per ${unitLabel}.`,
    image: bead.image,
    category: "DIY Kits",
    badge: "Premium Bead",
    cartPrice: bead.price,
    cartSubtitle: `per ${bead.unit}`,
  };
}

/** Full catalog including home-page featured pieces and premium beads. */
export const allCatalogProducts: ShopProduct[] = [
  ...baseShopProducts,
  ...trendingProducts.map(homeProductToShopProduct),
  ...premiumBeads.map(beadToShopProduct),
];

export const testimonials: Testimonial[] = [
  {
    id: "elena",
    name: "Elena R.",
    role: "Verified Collector",
    quote:
      "The customization process was so intuitive. I designed a bracelet set for my wedding that felt entirely my own.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
  },
  {
    id: "sophia",
    name: "Sophia W.",
    role: "Jewelry Artisan",
    quote:
      "Rose & Gilded beads are unmatched in clarity and color saturation. They elevate every piece I create.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
  },
  {
    id: "margot",
    name: "Margot D.",
    role: "Bespoke Client",
    quote:
      "A bespoke high jewelry set for our anniversary — every detail was considered, and the result was breathtaking.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
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

export const contactGallery = [
  {
    id: "pearl-bracelet",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=600&h=600&fit=crop",
    alt: "Pearl bracelet with gold clasp",
  },
  {
    id: "blue-beads",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
    alt: "Blue beaded bracelet",
  },
  {
    id: "pearl-necklace",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c2f?w=600&h=600&fit=crop",
    alt: "Pearl necklace on model",
  },
  {
    id: "burgundy-set",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
    alt: "Burgundy beaded jewelry set",
  },
] as const;

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
