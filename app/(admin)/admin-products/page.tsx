"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  category: string;
  brand: string;
  isActive: boolean;
  images?: { url: string; publicId?: string }[];
};

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  category: string;
  brand: string;
  images: { url: string; publicId: string }[];
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  comparePrice: "",
  stock: "",
  category: "",
  brand: "",
  images: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products?limit=100&sort=newest&admin=true", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { products: Product[] };
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await fetch("/api/categories", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as {
      categories: Category[];
    };
    setCategories(data.categories ?? []);
  };

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      comparePrice: product.comparePrice ? String(product.comparePrice) : "",
      stock: String(product.stock),
      category: String(product.category),
      brand: product.brand,
      images: product.images?.[0]
        ? [
            {
              url: product.images[0].url,
              publicId: product.images[0].publicId ?? "",
            },
          ]
        : [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-"),
        description: form.description,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        stock: Number(form.stock),
        category: form.category,
        brand: form.brand,
        images: form.images.length
          ? form.images
          : [
              {
                url: "https://placehold.co/600x600/111111/ffffff?text=Nexora",
                publicId: `admin-${Date.now()}`,
              },
            ],
      };

      const endpoint = editingProduct ? `/api/products/${editingProduct._id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchProducts();
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Bu ürünü silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (response.ok) {
      await fetchProducts();
    }
  };

  const toggleActive = async (product: Product) => {
    const response = await fetch(`/api/products/${product._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });

    if (response.ok) {
      await fetchProducts();
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { url: string; publicId: string };
      setForm((prev) => ({
        ...prev,
        images: [{ url: data.url, publicId: data.publicId }],
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">Ürün Yönetimi</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5458e8] md:px-5 md:py-3"
        >
          <Plus size={16} />
          Yeni Ürün
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center rounded-xl border border-[#2a2a2a] bg-[#111111] px-3">
          <Search size={16} className="shrink-0 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün ara..."
            className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-400">Ürünler yükleniyor...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">Ürün bulunamadı.</p>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {filteredProducts.map((product, index) => (
              <div key={product._id} className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#1f1f1f] bg-gradient-to-b ${
                      ["from-[#0d0d1a] to-[#17172b]", "from-[#0a1628] to-[#10243a]", "from-[#0a1a0f] to-[#143020]", "from-[#1a0f00] to-[#2b1a06]"][
                        index % 4
                      ]
                    }`}
                  >
                    {product.images?.[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{product.name}</p>
                    <p className="text-xs text-zinc-500">
                      {categories.find((c) => c._id === String(product.category))?.name ?? "Kategori"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{product.price.toLocaleString("tr-TR")} TL</p>
                    <p className="text-xs text-zinc-500">Stok: {product.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleActive(product)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        product.isActive
                          ? "border-[#22c55e44] bg-[#22c55e1a] text-[#86efac]"
                          : "border-[#ef444444] bg-[#ef44441a] text-[#fca5a5]"
                      }`}
                    >
                      {product.isActive ? "Aktif" : "Pasif"}
                    </button>
                    <button
                      type="button"
                      aria-label="Düzenle"
                      onClick={() => openEditModal(product)}
                      className="rounded-lg border border-[#2a2a2a] p-2 text-zinc-300 transition hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Sil"
                      onClick={() => void handleDelete(product._id)}
                      className="rounded-lg border border-[#2a2a2a] p-2 text-zinc-300 transition hover:text-[#fca5a5]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <section className="hidden overflow-x-auto rounded-2xl border border-[#1f1f1f] bg-[#111111] md:block">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="text-zinc-500">
                <tr className="border-b border-[#1f1f1f]">
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Fiyat</th>
                  <th className="px-4 py-3 font-medium">Stok</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-[#191919] transition hover:bg-[#111111]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative h-10 w-10 overflow-hidden rounded-md border border-[#1f1f1f] bg-gradient-to-b ${
                            ["from-[#0d0d1a] to-[#17172b]", "from-[#0a1628] to-[#10243a]", "from-[#0a1a0f] to-[#143020]", "from-[#1a0f00] to-[#2b1a06]"][
                              index % 4
                            ]
                          }`}
                        >
                          {product.images?.[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : null}
                        </div>
                        <p className="text-zinc-200">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {categories.find((category) => category._id === String(product.category))?.name ?? "Kategori"}
                    </td>
                    <td className="px-4 py-3 text-white">{product.price.toLocaleString("tr-TR")} TL</td>
                    <td className="px-4 py-3 text-zinc-300">{product.stock}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(product)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          product.isActive
                            ? "border-[#22c55e44] bg-[#22c55e1a] text-[#86efac]"
                            : "border-[#ef444444] bg-[#ef44441a] text-[#fca5a5]"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Düzenle"
                          onClick={() => openEditModal(product)}
                          className="rounded-md border border-[#2a2a2a] p-2 text-zinc-300 transition hover:text-white"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Sil"
                          onClick={() => void handleDelete(product._id)}
                          className="rounded-md border border-[#2a2a2a] p-2 text-zinc-300 transition hover:text-[#fca5a5]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
          <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-[#1f1f1f] bg-[#111111] p-5 sm:max-w-lg sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white md:text-xl">
                {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün"}
              </h2>
              <button type="button" onClick={closeModal} className="rounded-lg border border-[#2a2a2a] p-1.5 text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ürün adı" className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Açıklama" className="min-h-[80px] rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="Fiyat" className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
                <input value={form.comparePrice} onChange={(e) => setForm((p) => ({ ...p, comparePrice: e.target.value }))} placeholder="Karş. Fiyat" className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} placeholder="Stok" className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
                <input value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))} placeholder="Marka" className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none" />
              </div>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#6366f1] focus:outline-none">
                <option value="">Kategori seç</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];
                    if (selectedFile) {
                      void handleImageUpload(selectedFile);
                    }
                  }}
                  className="w-full text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-[#6366f1] file:px-3 file:py-2 file:text-white"
                />
                {uploadingImage ? (
                  <p className="mt-2 text-xs text-zinc-400">Görsel yükleniyor...</p>
                ) : null}
                {form.images[0]?.url ? (
                  <div className="mt-3 h-16 w-16 overflow-hidden rounded-md border border-[#1f1f1f]">
                    <img
                      src={form.images[0].url}
                      alt="Yüklenen görsel"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-xl border border-[#2a2a2a] px-4 py-2.5 text-sm text-zinc-200">
                İptal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSubmit()}
                className="rounded-xl bg-[#6366f1] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5458e8] disabled:opacity-70"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
