import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useInventory } from "@/lib/inventory-store";
import { formatPrice, allCatalogProducts } from "@/lib/site-data";
import { searchShopProducts } from "@/lib/shop-search";
import { cn } from "@/lib/utils";

export function HeaderSearch({ className }: { className?: string }) {
  const navigate = useNavigate();
  const { products } = useInventory();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const catalog = useMemo(() => {
    const map = new Map<string, typeof allCatalogProducts[number]>();
    for (const product of allCatalogProducts) map.set(product.id, product);
    for (const product of products) map.set(product.id, product);
    return Array.from(map.values());
  }, [products]);

  const results = useMemo(
    () => searchShopProducts(catalog, query, 6),
    [catalog, query],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const goToShopSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    navigate({ to: "/shop", search: { q: trimmed } });
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Search pieces</span>
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-burgundy/50" />
        <input
          type="search"
          value={query}
          placeholder="Search pieces..."
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (results.length === 1) {
                setOpen(false);
                navigate({
                  to: "/shop/$productId",
                  params: { productId: results[0].id },
                });
                return;
              }
              goToShopSearch(query);
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full rounded-full border-0 bg-white/70 py-2 pl-9 pr-4 text-sm text-burgundy placeholder:text-burgundy/40 outline-none focus:bg-white focus:ring-2 focus:ring-burgundy/20"
        />
      </label>

      {open && query.trim().length > 0 && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,320px)] rounded-xl border border-border bg-white py-2 shadow-lg"
          role="listbox"
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No pieces found.</p>
          ) : (
            results.map((product) => (
              <Link
                key={product.id}
                to="/shop/$productId"
                params={{ productId: product.id }}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="flex items-center gap-3 px-3 py-2 hover:bg-blush-section"
                role="option"
              >
                <img
                  src={product.image}
                  alt=""
                  className="size-10 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))
          )}
          {results.length > 0 && (
            <button
              type="button"
              onClick={() => goToShopSearch(query)}
              className="mt-1 w-full border-t border-border px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-burgundy hover:bg-blush-section"
            >
              View all results for &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MobileHeaderSearch() {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <button
        type="button"
        aria-label="Search"
        className="p-2 text-burgundy/80 hover:text-burgundy md:hidden"
        onClick={() => setVisible(true)}
      >
        <Search className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 top-14 z-50 border-b border-border bg-blush-nav px-4 py-3 md:hidden">
      <HeaderSearch />
    </div>
  );
}
