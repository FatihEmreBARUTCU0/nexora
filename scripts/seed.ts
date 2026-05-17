/**
 * Seed command:
 * 1) npm run seed:secrets  (writes strong SEED_* passwords to .env.local)
 * 2) npm run seed
 * Requires MONGODB_URI and SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD in .env.local.
 */

import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { getProductImageUrl } from "../lib/productImage";
import { loadSeedCredentials } from "../lib/seedCredentials";
import Category from "../models/Category";
import Product from "../models/Product";
import User from "../models/User";

const categories = [
  { name: "Elektronik", slug: "elektronik" },
  { name: "Giyim", slug: "giyim" },
  { name: "Ev ve Yaşam", slug: "ev-ve-yasam" },
  { name: "Spor", slug: "spor" },
  { name: "Aksesuar", slug: "aksesuar" },
];

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  brand: string;
  price: number;
  stock: number;
  ratingAvg: number;
};

function buildProductImages(slug: string, name: string, categorySlug: string) {
  const label = encodeURIComponent(name.slice(0, 36));
  const primaryUrl = getProductImageUrl({ name, slug, categorySlug });

  return [
    {
      url: primaryUrl,
      publicId: `seed-${slug}-primary`,
    },
    {
      url: `https://placehold.co/1200x1200/1a1a2e/e2e8f0?text=${label}`,
      publicId: `seed-${slug}-fallback`,
    },
  ];
}

const products: SeedProduct[] = [
  {
    name: "NovaSound Pro Kulaklık",
    slug: "novasound-pro-kulaklik",
    description: "Aktif gürültü engelleme destekli premium kablosuz kulaklık.",
    categorySlug: "elektronik",
    brand: "Nexora",
    price: 3499,
    stock: 38,
    ratingAvg: 4.7,
  },
  {
    name: "Titan Smart Watch",
    slug: "titan-smart-watch",
    description: "Sağlık takibi ve uzun pil ömrü sunan akıllı saat.",
    categorySlug: "elektronik",
    brand: "Arc",
    price: 6799,
    stock: 24,
    ratingAvg: 4.6,
  },
  {
    name: "AirPulse Pro Kulaklık",
    slug: "airpulse-pro-kulaklik",
    description: "Yüksek çözünürlüklü ses sunan premium kablosuz kulaklık.",
    categorySlug: "elektronik",
    brand: "Lumen",
    price: 2999,
    stock: 34,
    ratingAvg: 4.8,
  },
  {
    name: "Luna Oversize Kanka",
    slug: "luna-oversize-kanka",
    description: "Yumuşak dokulu, modern kesimli günlük oversize üst.",
    categorySlug: "giyim",
    brand: "Nova",
    price: 899,
    stock: 72,
    ratingAvg: 4.4,
  },
  {
    name: "Terra Denim Ceket",
    slug: "terra-denim-ceket",
    description: "Şehir stiline uygun premium denim ceket.",
    categorySlug: "giyim",
    brand: "Nexora",
    price: 1599,
    stock: 40,
    ratingAvg: 4.5,
  },
  {
    name: "MotionFlex Koşu Ayakkabısı",
    slug: "motionflex-kosu-ayakkabisi",
    description: "Hafif tabanlı, nefes alabilen günlük koşu ayakkabısı.",
    categorySlug: "giyim",
    brand: "Arc",
    price: 2199,
    stock: 56,
    ratingAvg: 4.3,
  },
  {
    name: "Nordic Işık Masa Lambası",
    slug: "nordic-isik-masa-lambasi",
    description: "Minimal tasarımlı, ayarlanabilir ışık seviyeli masa lambası.",
    categorySlug: "ev-ve-yasam",
    brand: "Lumen",
    price: 1299,
    stock: 44,
    ratingAvg: 4.2,
  },
  {
    name: "CloudRest Ortopedik Yastık",
    slug: "cloudrest-ortopedik-yastik",
    description: "Boyun desteği sunan ergonomik uyku yastığı.",
    categorySlug: "ev-ve-yasam",
    brand: "Nova",
    price: 749,
    stock: 63,
    ratingAvg: 4.1,
  },
  {
    name: "PureBrew Filtre Kahve Makinesi",
    slug: "purebrew-filtre-kahve-makinesi",
    description: "Programlanabilir zamanlayıcılı filtre kahve makinesi.",
    categorySlug: "ev-ve-yasam",
    brand: "Nexora",
    price: 2999,
    stock: 28,
    ratingAvg: 4.5,
  },
  {
    name: "CorePower Dambıl Seti",
    slug: "corepower-dambil-seti",
    description: "Ev antrenmanları için ayarlanabilir dambıl seti.",
    categorySlug: "spor",
    brand: "Arc",
    price: 2699,
    stock: 35,
    ratingAvg: 4.4,
  },
  {
    name: "HydroBoost Termal Matara",
    slug: "hydroboost-termal-matara",
    description: "Uzun süre sıcak-soğuk tutan paslanmaz çelik matara.",
    categorySlug: "spor",
    brand: "Nova",
    price: 499,
    stock: 90,
    ratingAvg: 3.9,
  },
  {
    name: "UrbanCarry Deri Sırt Çantası",
    slug: "urbancarry-deri-sirt-cantasi",
    description: "Laptop bölmeli, günlük kullanım için şık sırt çantası.",
    categorySlug: "aksesuar",
    brand: "Nexora",
    price: 1899,
    stock: 47,
    ratingAvg: 4.3,
  },
];

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
  ]);

  const credentials = loadSeedCredentials();

  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    bcrypt.hash(credentials.admin.password, 12),
    bcrypt.hash(credentials.user.password, 12),
  ]);

  await User.create([
    {
      name: "Admin",
      email: credentials.admin.email,
      password: adminPasswordHash,
      role: "admin",
      addresses: [],
    },
    {
      name: "Test Kullanıcı",
      email: credentials.user.email,
      password: userPasswordHash,
      role: "user",
      addresses: [],
    },
  ]);

  const createdCategories = await Category.insertMany(categories);
  const categoryBySlug = new Map(
    createdCategories.map((category) => [category.slug, category._id])
  );

  await Product.insertMany(
    products.map((product) => {
      const compareMultiplier = 1.2 + Math.random() * 0.2;
      const comparePrice = Math.round(product.price * compareMultiplier);

      return {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        comparePrice,
        images: buildProductImages(product.slug, product.name, product.categorySlug),
        category: categoryBySlug.get(product.categorySlug),
        brand: product.brand,
        stock: product.stock,
        sold: Math.floor(Math.random() * 80),
        variants: [],
        ratings: {
          avg: product.ratingAvg,
          count: Math.floor(10 + Math.random() * 300),
        },
        isActive: true,
      };
    })
  );

  console.log("Seed completed successfully.");
  console.log(`Seeded ${products.length} products with images.`);
  console.log(`Admin account: ${credentials.admin.email}`);
  console.log("Use the password from SEED_ADMIN_PASSWORD in .env.local (not printed here).");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
