import { ChevronDown } from "lucide-react";

import {
  emptyShopFilters,
  shopFilterGroups,
  type ShopFilterGroupId,
  type ShopFilterState,
} from "@/lib/shop-filters";
import type { ShopCategory } from "@/lib/site-data";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  filters: ShopFilterState;
  onChange: (filters: ShopFilterState) => void;
}

function setCategoryValue(
  categories: ShopCategory[],
  value: ShopCategory,
  checked: boolean,
): ShopCategory[] {
  if (checked) {
    return categories.includes(value) ? categories : [...categories, value];
  }
  return categories.filter((c) => c !== value);
}

function setStringFilter<T extends string>(values: T[], value: T, checked: boolean): T[] {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }
  return values.filter((v) => v !== value);
}

export function ShopFilters({ filters, onChange }: ShopFiltersProps) {
  const updateGroup = (groupId: ShopFilterGroupId, value: string, checked: boolean) => {
    switch (groupId) {
      case "category":
        onChange({
          ...filters,
          categories: setCategoryValue(filters.categories, value as ShopCategory, checked),
        });
        break;
      case "price":
        onChange({
          ...filters,
          priceRanges: setStringFilter(
            filters.priceRanges,
            value as ShopFilterState["priceRanges"][number],
            checked,
          ),
        });
        break;
      case "color":
        onChange({
          ...filters,
          colors: setStringFilter(
            filters.colors,
            value as ShopFilterState["colors"][number],
            checked,
          ),
        });
        break;
      case "material":
        onChange({
          ...filters,
          materials: setStringFilter(
            filters.materials,
            value as ShopFilterState["materials"][number],
            checked,
          ),
        });
        break;
      case "occasion":
        onChange({
          ...filters,
          occasions: setStringFilter(
            filters.occasions,
            value as ShopFilterState["occasions"][number],
            checked,
          ),
        });
        break;
      case "availability":
        onChange({
          ...filters,
          availability: setStringFilter(
            filters.availability,
            value as ShopFilterState["availability"][number],
            checked,
          ),
        });
        break;
    }
  };

  const isChecked = (groupId: ShopFilterGroupId, value: string) => {
    switch (groupId) {
      case "category":
        return filters.categories.includes(value as ShopCategory);
      case "price":
        return filters.priceRanges.includes(value as ShopFilterState["priceRanges"][number]);
      case "color":
        return filters.colors.includes(value as ShopFilterState["colors"][number]);
      case "material":
        return filters.materials.includes(value as ShopFilterState["materials"][number]);
      case "occasion":
        return filters.occasions.includes(value as ShopFilterState["occasions"][number]);
      case "availability":
        return filters.availability.includes(
          value as ShopFilterState["availability"][number],
        );
      default:
        return false;
    }
  };

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl text-burgundy">Filters</h2>
          <button
            type="button"
            onClick={() => onChange(emptyShopFilters)}
            className="text-xs font-semibold uppercase tracking-wider text-burgundy hover:underline"
          >
            Clear All
          </button>
        </div>

        <div className="mt-6 space-y-1">
          {shopFilterGroups.map((group) => (
            <details
              key={group.id}
              className="group border-b border-border pb-3 last:border-b-0"
              open={group.id === "category"}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between py-3 font-medium text-foreground [&::-webkit-details-marker]:hidden"
              >
                {group.label}
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="mt-1 space-y-2.5 pb-2">
                {group.options.map((option) => (
                  <li key={option.value}>
                    <label
                      className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked(group.id, option.value)}
                        onChange={(e) => updateGroup(group.id, option.value, e.target.checked)}
                        className={cn(
                          "size-4 shrink-0 cursor-pointer rounded border-2 border-burgundy/50",
                          "text-burgundy accent-[var(--burgundy)]",
                          "focus-visible:ring-2 focus-visible:ring-burgundy/30",
                        )}
                      />
                      <span>{option.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </aside>
  );
}
