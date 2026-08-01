import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { ShopCategory, ShopProduct } from "@/lib/site-data";
import { getShopProduct } from "@/lib/site-data";
import {
  adjustProductStock,
  createProduct,
  deleteProductById,
  listProducts,
  updateProductById,
  type DbProduct,
} from "@/server/products";

export interface InventoryItem extends ShopProduct {
  stock: number;
  sku: string;
}

interface InventoryContextValue {
  products: InventoryItem[];
  ready: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProduct: (id: string) => InventoryItem | undefined;
  addProduct: (input: Omit<InventoryItem, "id"> & { id?: string }) => Promise<InventoryItem>;
  updateProduct: (id: string, patch: Partial<InventoryItem>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (id: string, delta: number) => Promise<void>;
  lowStockProducts: InventoryItem[];
  totalStock: number;
  inventoryValue: number;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function toInventoryItem(product: DbProduct): InventoryItem {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description,
    image: product.image,
    rating: product.rating,
    badge: product.badge,
    featured: product.featured,
    cartPrice: product.cartPrice,
    cartSubtitle: product.cartSubtitle,
    images: product.images,
    longDescription: product.longDescription,
    reviewCount: product.reviewCount,
    sizes: product.sizes,
    colors: product.colors,
  };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await Promise.race([
        listProducts(),
        new Promise<Awaited<ReturnType<typeof listProducts>>>((_, reject) => {
          setTimeout(
            () => reject(new Error("Timed out loading products. Is MySQL running?")),
            20000,
          );
        }),
      ]);
      setProducts(rows.map(toInventoryItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getProduct = useCallback(
    (id: string) => {
      const fromDb = products.find((p) => p.id === id);
      if (fromDb) return fromDb;

      const catalog = getShopProduct(id);
      if (!catalog) return undefined;

      return {
        ...catalog,
        stock: catalog.stock ?? 12,
        sku: catalog.sku ?? `VK-${id.slice(0, 8).toUpperCase()}`,
      };
    },
    [products],
  );

  const addProduct = useCallback(
    async (input: Omit<InventoryItem, "id"> & { id?: string }) => {
      const created = await createProduct({
        data: {
          id: input.id,
          name: input.name,
          sku: input.sku,
          category: input.category as ShopCategory,
          price: input.price,
          stock: input.stock,
          description: input.description,
          image: input.image,
          rating: input.rating,
          badge: input.badge,
          featured: input.featured,
          cartPrice: input.cartPrice,
          cartSubtitle: input.cartSubtitle,
        },
      });
      const item = toInventoryItem(created);
      setProducts((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
      return item;
    },
    [],
  );

  const updateProduct = useCallback(async (id: string, patch: Partial<InventoryItem>) => {
    const updated = await updateProductById({
      data: {
        id,
        patch: {
          name: patch.name,
          sku: patch.sku,
          category: patch.category,
          price: patch.price,
          stock: patch.stock,
          description: patch.description,
          image: patch.image,
          rating: patch.rating,
          badge: patch.badge,
          featured: patch.featured,
          cartPrice: patch.cartPrice,
          cartSubtitle: patch.cartSubtitle,
        },
      },
    });
    const item = toInventoryItem(updated);
    setProducts((prev) => prev.map((p) => (p.id === id ? item : p)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await deleteProductById({ data: { id } });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const adjustStock = useCallback(async (id: string, delta: number) => {
    const updated = await adjustProductStock({ data: { id, delta } });
    const item = toInventoryItem(updated);
    setProducts((prev) => prev.map((p) => (p.id === id ? item : p)));
  }, []);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= 5),
    [products],
  );

  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + p.stock, 0),
    [products],
  );

  const inventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      ready,
      loading,
      error,
      refresh,
      getProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      lowStockProducts,
      totalStock,
      inventoryValue,
    }),
    [
      products,
      ready,
      loading,
      error,
      refresh,
      getProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      lowStockProducts,
      totalStock,
      inventoryValue,
    ],
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
