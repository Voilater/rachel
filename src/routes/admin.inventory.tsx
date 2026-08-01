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
          <h1 className="font-serif text-3xl text-burgundy">Inventory</h1>
          <p className="mt-2 text-muted-foreground">{products.length} products in catalog</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-burgundy px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-left text-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowForm(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-burgundy">
                {editingId ? "Edit Product" : "Add Product"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
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

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-burgundy py-3 text-sm font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
