import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { ShopFilters } from "@/components/ShopFilters";
import { ShopProductCard } from "@/components/ShopProductCard";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  emptyShopFilters,
  filterShopProducts,
  type ShopFilterState,
} from "@/lib/shop-filters";
import { searchShopProducts } from "@/lib/shop-search";
import { toInventoryItem, useInventory, type InventoryItem } from "@/lib/inventory-store";
import { siteConfig } from "@/lib/site-data";
import { listProducts } from "@/server/products";
import { cn } from "@/lib/utils";

const PER_PAGE = 9;
const SORT_OPTIONS = ["Featured", "Price: Low to High", "Price: High to Low", "Newest"] as const;

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [{ title: `Shop — ${siteConfig.name}` }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  loader: async () => {
    try {
      const rows = await listProducts();
      return {
        products: rows.map(toInventoryItem),
        error: null as string | null,
      };
    } catch (err) {
      return {
        products: [] as InventoryItem[],
        error: err instanceof Error ? err.message : "Failed to load products.",
      };
    }
  },
  component: ShopPage,
});

function ShopPage() {
  const loaderData = Route.useLoaderData();
  const { q: searchQuery } = Route.useSearch();
  const { products: liveProducts, loading, error: liveError } = useInventory();
  const [filters, setFilters] = useState<ShopFilterState>(emptyShopFilters);
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>("Featured");
  const [page, setPage] = useState(1);

  const products =
    liveProducts.length > 0 ? liveProducts : loaderData.products;
  const error = liveError ?? loaderData.error;
  const showLoading = loading && products.length === 0 && !error;

  const filtered = useMemo(() => {
    let list = filterShopProducts(products, filters);

    if (searchQuery.trim()) {
      const ids = new Set(searchShopProducts(list, searchQuery, 500).map((p) => p.id));
      list = list.filter((p) => ids.has(p.id));
    }

    switch (sortBy) {
      case "Price: Low to High":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "Newest":
        list = [...list].sort((a, b) => (a.badge ? -1 : 1) - (b.badge ? -1 : 1));
        break;
      default:
        list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return list;
  }, [filters, sortBy, products, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleFiltersChange = (next: ShopFilterState) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <PageLayout>
      {showLoading ? (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground md:px-8">
          Loading collection…
        </div>
      ) : error ? (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-8">
          <p className="text-burgundy">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check MySQL is running and your .env DATABASE_* settings.
          </p>
        </div>
      ) : (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-burgundy md:text-5xl">Shop</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {filtered.length} handcrafted pieces
              {searchQuery.trim() ? ` matching “${searchQuery.trim()}”` : ""}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Sort by:
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border bg-white py-2 pl-4 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-burgundy/20"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </label>
        </div>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-start">
          <ShopFilters filters={filters} onChange={handleFiltersChange} />

          <div className="min-w-0 flex-1">
            {pageItems.length === 0 ? (
              <p className="py-20 text-center text-muted-foreground">
                No pieces match your filters. Try adjusting your selection.
              </p>
            ) : (
              <div className="grid auto-rows-fr gap-8 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-sm disabled:opacity-40"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      page === n
                        ? "bg-burgundy text-white"
                        : "text-muted-foreground hover:text-burgundy",
                    )}
                    aria-current={page === n ? "page" : undefined}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-sm disabled:opacity-40"
                  aria-label="Next page"
                >
                  ›
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
      )}
    </PageLayout>
  );
}
