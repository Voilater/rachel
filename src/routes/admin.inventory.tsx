import { createFileRoute } from "@tanstack/react-router";
import { Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { ProductImageField } from "@/components/admin/ProductImageField";
import { useInventory, type InventoryItem } from "@/lib/inventory-store";
import type { ShopCategory } from "@/lib/site-data";
import { formatPrice, siteConfig } from "@/lib/site-data";

const CATEGORIES: ShopCategory[] = ["Necklaces", "Bracelets", "Earrings", "DIY Kits"];

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({
    meta: [{ title: `Inventory — ${siteConfig.name} Admin` }],
  }),
  component: AdminInventoryPage,
});

type FormState = {
  name: string;
  sku: string;
  category: ShopCategory;
  price: string;
  stock: string;
  description: string;
  image: string;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  category: "Bracelets",
  price: "",
  stock: "10",
  description: "",
  image: "https://images.unsplash.com/photo-1611591437281-460bfac57583?w=600&h=600&fit=crop",
};

function AdminInventoryPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useInventory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (product: InventoryItem) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
      image: product.image,
    });
    setShowForm(true);
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !Number.isFinite(price) || !Number.isFinite(stock) || !form.image.trim()) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || `VK-${Date.now().toString().slice(-6)}`,
      category: form.category,
      price,
      stock,
      description: form.description.trim() || form.name.trim(),
      image: form.image.trim(),
      rating: 4.5,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await addProduct(payload);
      }
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-burgundy md:text-3xl">Inventory</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            {products.length} products in catalog
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-burgundy px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 sm:w-auto"
        >
          <Plus className="size-4" />
          Add Product
        </button>
      </div>

      <input
        type="search"
        placeholder="Search by name or SKU…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full max-w-md rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
      />

      <div className="mt-6 space-y-4 md:hidden">
        {filtered.map((product) => (
          <article
            key={product.id}
            className="rounded-2xl border border-border bg-white p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <img
                src={product.image}
                alt=""
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.sku}</p>
                <p className="mt-2 text-sm text-muted-foreground">{product.category}</p>
                <p className="mt-2 font-semibold text-burgundy">{formatPrice(product.price)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stock
                </span>
                <button
                  type="button"
                  onClick={() => adjustStock(product.id, -1)}
                  className="rounded border border-border p-1 hover:bg-blush-section"
                  aria-label="Decrease stock"
                >
                  <Minus className="size-3" />
                </button>
                <span
                  className={
                    product.stock <= 5 ? "min-w-[2rem] text-center font-semibold text-burgundy" : "min-w-[2rem] text-center font-medium"
                  }
                >
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => adjustStock(product.id, 1)}
                  className="rounded border border-border p-1 hover:bg-blush-section"
                  aria-label="Increase stock"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-blush-section hover:text-burgundy"
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteProduct(product.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border bg-white md:block">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="border-b border-border bg-blush-section/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-blush-section/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt=""
                      className="size-10 rounded-lg object-cover"
                    />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{product.sku}</td>
                <td className="px-4 py-3">{product.category}</td>
                <td className="px-4 py-3">{formatPrice(product.price)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustStock(product.id, -1)}
                      className="rounded border border-border p-1 hover:bg-blush-section"
                      aria-label="Decrease stock"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span
                      className={
                        product.stock <= 5
                          ? "font-semibold text-burgundy"
                          : "font-medium"
                      }
                    >
                      {product.stock}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustStock(product.id, 1)}
                      className="rounded border border-border p-1 hover:bg-blush-section"
                      aria-label="Increase stock"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-blush-section hover:text-burgundy"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowForm(false)}
            aria-label="Close"
          />
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-serif text-xl text-burgundy">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  placeholder="SKU"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                />
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ShopCategory })
                  }
                  className="rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  placeholder="Price (INR)"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
                />
              </div>
              <textarea
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-none rounded-lg border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-burgundy/20"
              />
              <div>
                <p className="text-sm font-medium">Product image</p>
                <div className="mt-2">
                  <ProductImageField
                    value={form.image}
                    onChange={(image) => setForm({ ...form, image })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-burgundy py-3 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
