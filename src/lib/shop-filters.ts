import type { ShopCategory, ShopProduct } from "@/lib/site-data";

export type PriceRangeId = "under-500" | "500-1500" | "1500-2500" | "above-2500";
export type ProductColorTag = "Rose" | "Pearl" | "Gold" | "Onyx" | "Azure";
export type ProductMaterial = "Gold" | "Pearl" | "Quartz" | "Sterling Silver";
export type ProductOccasion = "Everyday" | "Evening" | "Bridal" | "Gifting";
export type ProductAvailability = "In Stock" | "Made to Order";

export type ShopFilterGroupId =
  | "category"
  | "price"
  | "color"
  | "material"
  | "occasion"
  | "availability";

export interface ShopFilterOption {
  label: string;
  value: string;
}

export interface ShopFilterGroup {
  id: ShopFilterGroupId;
  label: string;
  options: ShopFilterOption[];
}

export interface ShopFilterState {
  categories: ShopCategory[];
  priceRanges: PriceRangeId[];
  colors: ProductColorTag[];
  materials: ProductMaterial[];
  occasions: ProductOccasion[];
  availability: ProductAvailability[];
}

export const emptyShopFilters: ShopFilterState = {
  categories: [],
  priceRanges: [],
  colors: [],
  materials: [],
  occasions: [],
  availability: [],
};

export const shopFilterGroups: ShopFilterGroup[] = [
  {
    id: "category",
    label: "Category",
    options: [
      { label: "Necklaces", value: "Necklaces" },
      { label: "Bracelets", value: "Bracelets" },
      { label: "Earrings", value: "Earrings" },
      { label: "DIY Kits", value: "DIY Kits" },
    ],
  },
  {
    id: "price",
    label: "Price Range",
    options: [
      { label: "Under ₹500", value: "under-500" },
      { label: "₹500 – ₹1,500", value: "500-1500" },
      { label: "₹1,500 – ₹2,500", value: "1500-2500" },
      { label: "Above ₹2,500", value: "above-2500" },
    ],
  },
  {
    id: "color",
    label: "Color",
    options: [
      { label: "Rose", value: "Rose" },
      { label: "Pearl", value: "Pearl" },
      { label: "Gold", value: "Gold" },
      { label: "Onyx", value: "Onyx" },
      { label: "Azure", value: "Azure" },
    ],
  },
  {
    id: "material",
    label: "Material",
    options: [
      { label: "Gold", value: "Gold" },
      { label: "Pearl", value: "Pearl" },
      { label: "Quartz", value: "Quartz" },
      { label: "Sterling Silver", value: "Sterling Silver" },
    ],
  },
  {
    id: "occasion",
    label: "Occasion",
    options: [
      { label: "Everyday", value: "Everyday" },
      { label: "Evening", value: "Evening" },
      { label: "Bridal", value: "Bridal" },
      { label: "Gifting", value: "Gifting" },
    ],
  },
  {
    id: "availability",
    label: "Availability",
    options: [
      { label: "In Stock", value: "In Stock" },
      { label: "Made to Order", value: "Made to Order" },
    ],
  },
];

const SHOP_IMAGES = [
  "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c2f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1615485500834-bc10199bc4c5?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1617038260897-41a1a14a4a00?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
];

type TaggedProduct = ShopProduct & {
  colorTags: ProductColorTag[];
  materials: ProductMaterial[];
  occasions: ProductOccasion[];
  availability: ProductAvailability;
};

export function getProductColorTags(product: ShopProduct): ProductColorTag[] {
  return (product as TaggedProduct).colorTags ?? [];
}

export function getProductMaterials(product: ShopProduct): ProductMaterial[] {
  return (product as TaggedProduct).materials ?? [];
}

export function getProductOccasions(product: ShopProduct): ProductOccasion[] {
  return (product as TaggedProduct).occasions ?? [];
}

export function getProductAvailability(product: ShopProduct): ProductAvailability {
  return (product as TaggedProduct).availability ?? "In Stock";
}

export function matchesPriceRange(price: number, range: PriceRangeId): boolean {
  switch (range) {
    case "under-500":
      return price < 500;
    case "500-1500":
      return price >= 500 && price < 1500;
    case "1500-2500":
      return price >= 1500 && price < 2500;
    case "above-2500":
      return price >= 2500;
    default:
      return true;
  }
}

export function filterShopProducts(
  products: ShopProduct[],
  filters: ShopFilterState,
): ShopProduct[] {
  return products.filter((product) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.category)
    ) {
      return false;
    }

    if (
      filters.priceRanges.length > 0 &&
      !filters.priceRanges.some((range) => matchesPriceRange(product.price, range))
    ) {
      return false;
    }

    const colorTags = getProductColorTags(product);
    if (
      filters.colors.length > 0 &&
      !filters.colors.some((color) => colorTags.includes(color))
    ) {
      return false;
    }

    const materials = getProductMaterials(product);
    if (
      filters.materials.length > 0 &&
      !filters.materials.some((material) => materials.includes(material))
    ) {
      return false;
    }

    const occasions = getProductOccasions(product);
    if (
      filters.occasions.length > 0 &&
      !filters.occasions.some((occasion) => occasions.includes(occasion))
    ) {
      return false;
    }

    const availability = getProductAvailability(product);
    if (
      filters.availability.length > 0 &&
      !filters.availability.includes(availability)
    ) {
      return false;
    }

    return true;
  });
}

export function toggleFilterValue<T extends string>(
  values: T[],
  value: T,
): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export const additionalShopProducts: TaggedProduct[] = [
  {
    id: "lunar-pearl-bracelet",
    name: "Lunar Pearl Bracelet",
    price: 95,
    rating: 4.8,
    description: "Soft moonlit pearls on a delicate silk cord — quiet luminosity for daily wear.",
    image: SHOP_IMAGES[0],
    category: "Bracelets",
    colorTags: ["Pearl"],
    materials: ["Pearl", "Sterling Silver"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  {
    id: "rose-aura-choker",
    name: "Rose Aura Choker",
    price: 185,
    rating: 4.9,
    description: "Blush quartz beads with a satin ribbon tie — romantic minimalism at the collar.",
    image: SHOP_IMAGES[4],
    category: "Necklaces",
    badge: "New In",
    colorTags: ["Rose"],
    materials: ["Quartz", "Gold"],
    occasions: ["Evening", "Bridal"],
    availability: "In Stock",
  },
  {
    id: "moonlight-meditation-set",
    name: "Moonlight Meditation Set",
    price: 85,
    rating: 4.7,
    description: "A calming trio of intention beads for mindful practice and serene styling.",
    image: SHOP_IMAGES[5],
    category: "DIY Kits",
    colorTags: ["Pearl", "Azure"],
    materials: ["Quartz", "Pearl"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  {
    id: "dawn-dew-drops",
    name: "Dawn Dew Drops",
    price: 420,
    rating: 4.6,
    description: "Petite gold drops with freshwater pearls — morning light captured in jewelry.",
    image: SHOP_IMAGES[1],
    category: "Earrings",
    colorTags: ["Pearl", "Gold"],
    materials: ["Gold", "Pearl"],
    occasions: ["Everyday", "Evening"],
    availability: "In Stock",
  },
  {
    id: "velvet-rose-cuff",
    name: "Velvet Rose Cuff",
    price: 780,
    rating: 4.8,
    description: "Wide rose quartz cuff with brushed gold accents — statement softness.",
    image: SHOP_IMAGES[3],
    category: "Bracelets",
    colorTags: ["Rose"],
    materials: ["Quartz", "Gold"],
    occasions: ["Evening", "Bridal"],
    availability: "Made to Order",
  },
  {
    id: "golden-hour-strand",
    name: "Golden Hour Strand",
    price: 1650,
    rating: 4.9,
    description: "Layered golden beads that catch sunset warmth — effortless radiance.",
    image: SHOP_IMAGES[5],
    category: "Necklaces",
    colorTags: ["Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Gifting"],
    availability: "In Stock",
  },
  {
    id: "ocean-mist-hoops",
    name: "Ocean Mist Hoops",
    price: 540,
    rating: 4.5,
    description: "Azure glass beads on lightweight hoops — breezy coastal elegance.",
    image: SHOP_IMAGES[7],
    category: "Earrings",
    colorTags: ["Azure"],
    materials: ["Sterling Silver"],
    occasions: ["Everyday"],
    availability: "In Stock",
  },
  {
    id: "onyx-eclipse-band",
    name: "Onyx Eclipse Band",
    price: 890,
    rating: 4.7,
    description: "Polished onyx rounds with a single gold focal — modern contrast.",
    image: SHOP_IMAGES[3],
    category: "Bracelets",
    colorTags: ["Onyx", "Gold"],
    materials: ["Gold"],
    occasions: ["Evening"],
    availability: "In Stock",
  },
  {
    id: "bridal-bloom-necklace",
    name: "Bridal Bloom Necklace",
    price: 3200,
    rating: 5.0,
    description: "Hand-knotted pearls with rose quartz blooms — ceremonial grace.",
    image: SHOP_IMAGES[2],
    category: "Necklaces",
    featured: true,
    colorTags: ["Pearl", "Rose"],
    materials: ["Pearl", "Quartz", "Gold"],
    occasions: ["Bridal", "Evening"],
    availability: "Made to Order",
  },
  {
    id: "studio-bead-collection",
    name: "Studio Bead Collection",
    price: 480,
    rating: 4.8,
    description: "Assorted premium strands for the creative soul — build your own story.",
    image: SHOP_IMAGES[4],
    category: "DIY Kits",
    colorTags: ["Rose", "Azure"],
    materials: ["Quartz", "Pearl"],
    occasions: ["Gifting", "Everyday"],
    availability: "In Stock",
  },
  {
    id: "serene-quartz-ring-set",
    name: "Serene Quartz Ring Set",
    price: 360,
    rating: 4.4,
    description: "Stackable rose quartz rings with gold vermeil bands.",
    image: SHOP_IMAGES[0],
    category: "Bracelets",
    colorTags: ["Rose"],
    materials: ["Quartz", "Gold"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  {
    id: "celestial-layer-set",
    name: "Celestial Layer Set",
    price: 2100,
    rating: 4.9,
    description: "Three delicate chains with pearl and gold charms — celestial layering.",
    image: SHOP_IMAGES[2],
    category: "Necklaces",
    colorTags: ["Pearl", "Gold"],
    materials: ["Pearl", "Gold"],
    occasions: ["Evening", "Bridal"],
    availability: "In Stock",
  },
  {
    id: "whisper-petal-earrings",
    name: "Whisper Petal Earrings",
    price: 620,
    rating: 4.6,
    description: "Rose-toned petals on gold wire — botanical poetry for the ears.",
    image: SHOP_IMAGES[1],
    category: "Earrings",
    colorTags: ["Rose", "Gold"],
    materials: ["Gold", "Quartz"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  {
    id: "midnight-pearl-choker",
    name: "Midnight Pearl Choker",
    price: 1280,
    rating: 4.8,
    description: "Ivory pearls against onyx spacers — dusk-to-dawn sophistication.",
    image: SHOP_IMAGES[6],
    category: "Necklaces",
    colorTags: ["Pearl", "Onyx"],
    materials: ["Pearl", "Sterling Silver"],
    occasions: ["Evening"],
    availability: "In Stock",
  },
  {
    id: "artisan-cord-kit",
    name: "Artisan Cord Kit",
    price: 290,
    rating: 4.7,
    description: "Waxed cords, clasps, and accent beads for your first handmade piece.",
    image: SHOP_IMAGES[4],
    category: "DIY Kits",
    colorTags: ["Azure", "Gold"],
    materials: ["Sterling Silver"],
    occasions: ["Gifting", "Everyday"],
    availability: "In Stock",
  },
  {
    id: "gilded-intention-bracelet",
    name: "Gilded Intention Bracelet",
    price: 1150,
    rating: 4.9,
    description: "Gold letter beads on rose quartz — wear your mantra close.",
    image: SHOP_IMAGES[0],
    category: "Bracelets",
    colorTags: ["Rose", "Gold"],
    materials: ["Quartz", "Gold"],
    occasions: ["Gifting", "Bridal"],
    availability: "Made to Order",
  },
  {
    id: "azure-tide-earrings",
    name: "Azure Tide Earrings",
    price: 720,
    rating: 4.5,
    description: "Turquoise-toned drops that sway with ocean rhythm.",
    image: SHOP_IMAGES[7],
    category: "Earrings",
    colorTags: ["Azure"],
    materials: ["Sterling Silver", "Quartz"],
    occasions: ["Everyday", "Evening"],
    availability: "In Stock",
  },
  {
    id: "pearl-cascade-collar",
    name: "Pearl Cascade Collar",
    price: 2750,
    rating: 5.0,
    description: "Graduated pearls in a dramatic collar — heirloom-worthy glamour.",
    image: SHOP_IMAGES[2],
    category: "Necklaces",
    colorTags: ["Pearl"],
    materials: ["Pearl", "Gold"],
    occasions: ["Bridal", "Evening"],
    availability: "Made to Order",
  },
  {
    id: "rose-garden-wrap",
    name: "Rose Garden Wrap",
    price: 560,
    rating: 4.7,
    description: "Multi-wrap bracelet in blush tones — garden party ready.",
    image: SHOP_IMAGES[3],
    category: "Bracelets",
    colorTags: ["Rose"],
    materials: ["Quartz", "Sterling Silver"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
];

export function tagCoreProducts(products: ShopProduct[]): TaggedProduct[] {
  const tagsById: Record<string, Omit<TaggedProduct, keyof ShopProduct>> = {
    "ethereal-rose-bracelet": {
      colorTags: ["Rose"],
      materials: ["Quartz", "Gold"],
      occasions: ["Everyday", "Gifting"],
      availability: "In Stock",
    },
    "celestial-pearl-drops": {
      colorTags: ["Pearl", "Gold"],
      materials: ["Gold", "Pearl"],
      occasions: ["Evening", "Bridal"],
      availability: "In Stock",
    },
    "azure-horizon-layer": {
      colorTags: ["Pearl", "Azure"],
      materials: ["Pearl", "Sterling Silver"],
      occasions: ["Evening", "Gifting"],
      availability: "In Stock",
    },
    "midnight-glow-band": {
      colorTags: ["Onyx"],
      materials: ["Gold"],
      occasions: ["Everyday", "Evening"],
      availability: "In Stock",
    },
    "artisan-starter-kit": {
      colorTags: ["Rose", "Pearl"],
      materials: ["Quartz", "Pearl"],
      occasions: ["Gifting", "Everyday"],
      availability: "In Stock",
    },
    "sun-kissed-choker": {
      colorTags: ["Gold"],
      materials: ["Gold"],
      occasions: ["Everyday", "Evening"],
      availability: "Made to Order",
    },
  };

  return products.map((product) => ({
    ...product,
    ...tagsById[product.id],
  })) as TaggedProduct[];
}
