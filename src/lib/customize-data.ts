export type ProductType = "bracelet" | "necklace" | "anklet";

export interface BeadOption {
  id: string;
  label: string;
  hex: string;
  premium: number;
  description: string;
}

export interface CharmOption {
  id: string;
  label: string;
  premium: number;
}

export interface SizeOption {
  id: string;
  label: string;
  value: string;
}

export const productTypes: {
  id: ProductType;
  label: string;
  basePrice: number;
}[] = [
  { id: "bracelet", label: "Bracelet", basePrice: 124 },
  { id: "necklace", label: "Necklace", basePrice: 150 },
  { id: "anklet", label: "Anklet", basePrice: 110 },
];

export const beadOptions: BeadOption[] = [
  {
    id: "rose-quartz",
    label: "Rose Quartz",
    hex: "#e8b4b8",
    premium: 15,
    description:
      "Rose Quartz: The stone of universal love. It restores trust and harmony in relationships.",
  },
  {
    id: "lavender",
    label: "Lavender Jade",
    hex: "#b8a8c8",
    premium: 12,
    description:
      "Lavender Jade: A calming stone that nurtures peace and emotional balance in daily wear.",
  },
  {
    id: "mint",
    label: "Mint Aventurine",
    hex: "#a8d4b8",
    premium: 10,
    description:
      "Mint Aventurine: Known for prosperity and confidence — a fresh accent for mindful style.",
  },
  {
    id: "mustard",
    label: "Mustard Agate",
    hex: "#d4b868",
    premium: 8,
    description:
      "Mustard Agate: Warm golden tones that ground the spirit and invite creative energy.",
  },
];

export const charmOptions: CharmOption[] = [
  { id: "star", label: "Star", premium: 0 },
  { id: "heart", label: "Heart", premium: 5 },
  { id: "moon", label: "Moon", premium: 8 },
  { id: "lotus", label: "Lotus", premium: 10 },
];

export const sizeOptions: SizeOption[] = [
  { id: "small", label: "Small (15cm)", value: "Small (15cm)" },
  { id: "medium", label: "Medium (17cm)", value: "Medium (17cm)" },
  { id: "large", label: "Large (19cm)", value: "Large (19cm)" },
];

export function computeCustomizeTotal(
  productTypeId: ProductType,
  beadId: string,
  charmId: string,
): number {
  const type = productTypes.find((t) => t.id === productTypeId);
  const bead = beadOptions.find((b) => b.id === beadId);
  const charm = charmOptions.find((c) => c.id === charmId);
  return (type?.basePrice ?? 0) + (bead?.premium ?? 0) + (charm?.premium ?? 0);
}

export function computeCustomizeTotalForProduct(
  basePrice: number,
  beadId: string,
  charmId: string,
): number {
  const bead = beadOptions.find((b) => b.id === beadId);
  const charm = charmOptions.find((c) => c.id === charmId);
  return basePrice + (bead?.premium ?? 0) + (charm?.premium ?? 0);
}

export function inferProductTypeFromCategory(category: string): ProductType {
  const normalized = category.toLowerCase();
  if (normalized.includes("necklace")) return "necklace";
  if (normalized.includes("anklet")) return "anklet";
  return "bracelet";
}

export function buildCustomizeSubtitle(
  productTypeId: ProductType,
  beadId: string,
  charmId: string,
  initials: string,
  giftNote?: string,
  productName?: string,
): string {
  const type = productTypes.find((t) => t.id === productTypeId);
  const bead = beadOptions.find((b) => b.id === beadId);
  const charm = charmOptions.find((c) => c.id === charmId);
  const parts = [
    productName ? `Based on: ${productName}` : type?.label,
    bead?.label,
    charm ? `${charm.label} charm` : null,
    initials ? `Initials: ${initials.toUpperCase()}` : null,
    giftNote?.trim() ? `Note: ${giftNote.trim()}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
