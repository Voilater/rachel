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

type ProductFilterMetadata = {
  colorTags: ProductColorTag[];
  materials: ProductMaterial[];
  occasions: ProductOccasion[];
  availability: ProductAvailability;
};

type TaggedProduct = ShopProduct & ProductFilterMetadata;

const CORE_PRODUCT_FILTER_TAGS: Record<string, ProductFilterMetadata> = {
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
  "aura-layer-necklace": {
    colorTags: ["Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Bridal"],
    availability: "In Stock",
  },
  "aura-layer-bracelets": {
    colorTags: ["Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Gifting"],
    availability: "In Stock",
  },
  "emerald-cascade": {
    colorTags: ["Azure"],
    materials: ["Gold"],
    occasions: ["Evening"],
    availability: "In Stock",
  },
  "petite-pearl-choker": {
    colorTags: ["Pearl", "Gold"],
    materials: ["Pearl", "Gold"],
    occasions: ["Everyday", "Bridal"],
    availability: "In Stock",
  },
  "lapis-lazuli": {
    colorTags: ["Azure"],
    materials: ["Quartz"],
    occasions: ["Gifting", "Everyday"],
    availability: "In Stock",
  },
  moonstone: {
    colorTags: ["Pearl"],
    materials: ["Quartz"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  "african-turquoise": {
    colorTags: ["Azure"],
    materials: ["Quartz"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  "rose-gold-elements": {
    colorTags: ["Rose", "Gold"],
    materials: ["Gold"],
    occasions: ["Gifting", "Everyday"],
    availability: "In Stock",
  },
};

const COLOR_LABEL_MAP: Record<string, ProductColorTag> = {
  rose: "Rose",
  pearl: "Pearl",
  gold: "Gold",
  onyx: "Onyx",
  azure: "Azure",
  sky: "Azure",
};

const COLOR_KEYWORDS: [RegExp, ProductColorTag][] = [
  [/\brose\b|blush/i, "Rose"],
  [/\bpearl\b|moonlit|ivory/i, "Pearl"],
  [/\bgold\b|golden|gilded|vermeil/i, "Gold"],
  [/\bonyx\b|midnight|eclipse/i, "Onyx"],
  [/\bazure\b|turquoise|ocean|tide|lapis|emerald|sky\b|blue\b/i, "Azure"],
];

const MATERIAL_KEYWORDS: [RegExp, ProductMaterial][] = [
  [/\bsterling silver\b|\bsilver\b/i, "Sterling Silver"],
  [/\brose quartz\b|\bquartz\b/i, "Quartz"],
  [/\bpearl\b/i, "Pearl"],
  [/\bgold\b|golden|gilded|vermeil/i, "Gold"],
];

const OCCASION_KEYWORDS: [RegExp, ProductOccasion][] = [
  [/\beveryday\b|daily|day-to-night/i, "Everyday"],
  [/\bevening\b|dusk|night/i, "Evening"],
  [/\bbridal\b|wedding|ceremon/i, "Bridal"],
  [/\bgift\b|gifting/i, "Gifting"],
];

const CATEGORY_DEFAULTS: Partial<Record<ShopCategory, Partial<ProductFilterMetadata>>> = {
  "DIY Kits": {
    occasions: ["Gifting", "Everyday"],
    materials: ["Quartz"],
  },
};

let productFilterLookup: Map<string, ProductFilterMetadata> | null = null;

function getProductFilterLookup(): Map<string, ProductFilterMetadata> {
  if (productFilterLookup) return productFilterLookup;

  productFilterLookup = new Map<string, ProductFilterMetadata>();

  for (const [id, meta] of Object.entries(CORE_PRODUCT_FILTER_TAGS)) {
    productFilterLookup.set(id, meta);
  }

  for (const product of additionalShopProducts) {
    productFilterLookup.set(product.id, {
      colorTags: product.colorTags,
      materials: product.materials,
      occasions: product.occasions,
      availability: product.availability,
    });
  }

  return productFilterLookup;
}

function productSearchText(product: ShopProduct): string {
  return [
    product.name,
    product.description,
    product.longDescription,
    product.badge,
    product.cartSubtitle,
    product.category,
  ]
    .filter(Boolean)
    .join(" ");
}

function inferColorTags(product: ShopProduct): ProductColorTag[] {
  const tags = new Set<ProductColorTag>();

  for (const color of product.colors ?? []) {
    const mapped = COLOR_LABEL_MAP[color.label.toLowerCase()] ?? COLOR_LABEL_MAP[color.id.toLowerCase()];
    if (mapped) tags.add(mapped);
  }

  const text = productSearchText(product);
  for (const [pattern, tag] of COLOR_KEYWORDS) {
    if (pattern.test(text)) tags.add(tag);
  }

  return [...tags];
}

function inferMaterials(product: ShopProduct): ProductMaterial[] {
  const materials = new Set<ProductMaterial>();
  const text = productSearchText(product);

  for (const [pattern, material] of MATERIAL_KEYWORDS) {
    if (pattern.test(text)) materials.add(material);
  }

  return [...materials];
}

function inferOccasions(product: ShopProduct): ProductOccasion[] {
  const occasions = new Set<ProductOccasion>();
  const text = productSearchText(product);

  for (const [pattern, occasion] of OCCASION_KEYWORDS) {
    if (pattern.test(text)) occasions.add(occasion);
  }

  const categoryDefaults = CATEGORY_DEFAULTS[product.category];
  for (const occasion of categoryDefaults?.occasions ?? []) {
    occasions.add(occasion);
  }

  return [...occasions];
}

function inferAvailability(product: ShopProduct): ProductAvailability {
  const text = productSearchText(product).toLowerCase();
  if (text.includes("made to order") || text.includes("bespoke")) {
    return "Made to Order";
  }

  const stock = (product as { stock?: number }).stock;
  if (stock !== undefined && stock <= 0) {
    return "Made to Order";
  }

  return "In Stock";
}

function pickTagList<T extends string>(
  explicit: T[] | undefined,
  catalog: T[] | undefined,
  inferred: T[],
): T[] {
  if (explicit?.length) return explicit;
  if (catalog?.length) return catalog;
  return inferred;
}

function inferProductFilterMetadata(product: ShopProduct): ProductFilterMetadata {
  return {
    colorTags: inferColorTags(product),
    materials: inferMaterials(product),
    occasions: inferOccasions(product),
    availability: inferAvailability(product),
  };
}

export function resolveProductFilterMetadata(product: ShopProduct): ProductFilterMetadata {
  const tagged = product as Partial<TaggedProduct>;
  const catalog = getProductFilterLookup().get(product.id);
  const inferred = inferProductFilterMetadata(product);

  return {
    colorTags: pickTagList(tagged.colorTags, catalog?.colorTags, inferred.colorTags),
    materials: pickTagList(tagged.materials, catalog?.materials, inferred.materials),
    occasions: pickTagList(tagged.occasions, catalog?.occasions, inferred.occasions),
    availability: tagged.availability ?? catalog?.availability ?? inferred.availability,
  };
}

export function getProductColorTags(product: ShopProduct): ProductColorTag[] {
  return resolveProductFilterMetadata(product).colorTags;
}

export function getProductMaterials(product: ShopProduct): ProductMaterial[] {
  return resolveProductFilterMetadata(product).materials;
}

export function getProductOccasions(product: ShopProduct): ProductOccasion[] {
  return resolveProductFilterMetadata(product).occasions;
}

export function getProductAvailability(product: ShopProduct): ProductAvailability {
  return resolveProductFilterMetadata(product).availability;
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
  return products.map((product) => {
    const meta = CORE_PRODUCT_FILTER_TAGS[product.id];
    return {
      ...product,
      colorTags: meta?.colorTags ?? [],
      materials: meta?.materials ?? [],
      occasions: meta?.occasions ?? [],
      availability: meta?.availability ?? "In Stock",
    };
  }) as TaggedProduct[];
}
