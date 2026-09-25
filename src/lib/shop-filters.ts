import {
  DEFAULT_SHOP_CATEGORIES,
  mergeShopCategories,
  type ShopCategory,
} from "@/lib/shop-categories";
import type { ShopProduct } from "@/lib/site-data";

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

const baseShopFilterGroups: ShopFilterGroup[] = [
  {
    id: "category",
    label: "Category",
    options: DEFAULT_SHOP_CATEGORIES.map((category) => ({
      label: category,
      value: category,
    })),
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

/** Default static groups (backward compatible). Prefer getShopFilterGroups() for live catalog. */
export const shopFilterGroups: ShopFilterGroup[] = baseShopFilterGroups;

export function getShopFilterGroups(extraCategories: string[] = []): ShopFilterGroup[] {
  const categoryOptions = mergeShopCategories(DEFAULT_SHOP_CATEGORIES, extraCategories).map(
    (category) => ({ label: category, value: category }),
  );

  return [
    {
      id: "category",
      label: "Category",
      options: categoryOptions,
    },
    ...baseShopFilterGroups.filter((group) => group.id !== "category"),
  ];
}

const SHOP_IMAGES = [
  "/images/name-bracelet.png",
];

type ProductFilterMetadata = {
  colorTags: ProductColorTag[];
  materials: ProductMaterial[];
  occasions: ProductOccasion[];
  availability: ProductAvailability;
};

type TaggedProduct = ShopProduct & ProductFilterMetadata;

const CORE_PRODUCT_FILTER_TAGS: Record<string, ProductFilterMetadata> = {
  "name-bracelet": {
    colorTags: ["Rose"],
    materials: ["Quartz", "Gold"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  "magnetic-bracelet": {
    colorTags: ["Rose"],
    materials: ["Sterling Silver"],
    occasions: ["Everyday", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "chip-bead-bracelet": {
    colorTags: ["Azure"],
    materials: ["Quartz", "Sterling Silver"],
    occasions: ["Everyday", "Gifting"],
    availability: "In Stock",
  },
  "watch-bracelet": {
    colorTags: ["Azure", "Gold"],
    materials: ["Gold", "Quartz"],
    occasions: ["Everyday", "Evening", "Gifting"],
    availability: "In Stock",
  },
  "tulip-bracelet": {
    colorTags: ["Rose"],
    materials: ["Quartz"],
    occasions: ["Everyday", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "flower-bracelet": {
    colorTags: ["Rose", "Pearl"],
    materials: ["Quartz", "Sterling Silver"],
    occasions: ["Everyday", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "pink-ad-stone-pendant-chain": {
    colorTags: ["Rose", "Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "red-ad-stone-invisible-chain": {
    colorTags: ["Rose", "Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "pearl-chain": {
    colorTags: ["Pearl", "Gold"],
    materials: ["Pearl", "Gold"],
    occasions: ["Everyday", "Evening", "Bridal", "Gifting"],
    availability: "In Stock",
  },
  "invisible-chain": {
    colorTags: ["Rose", "Gold"],
    materials: ["Gold"],
    occasions: ["Evening", "Bridal", "Gifting"],
    availability: "In Stock",
  },
  "butterfly-invisible-chain-earrings": {
    colorTags: ["Pearl", "Gold"],
    materials: ["Gold"],
    occasions: ["Everyday", "Evening", "Gifting", "Bridal"],
    availability: "In Stock",
  },
  "kids-beads-malai-chain": {
    colorTags: ["Rose", "Pearl", "Gold", "Azure"],
    materials: ["Pearl", "Quartz"],
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
  Beads: {
    occasions: ["Gifting", "Everyday"],
    materials: ["Quartz"],
  },
  "Fancy beads": {
    occasions: ["Gifting", "Everyday"],
    materials: ["Gold"],
  },
  "Raw materials": {
    occasions: ["Gifting", "Everyday"],
    materials: ["Quartz"],
  },
  Custom: {
    occasions: ["Gifting", "Bridal"],
    availability: "Made to Order",
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

export const additionalShopProducts: TaggedProduct[] = [];


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
