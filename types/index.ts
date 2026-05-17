export type UserRole = "user" | "admin";
export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "failed";

export type ProductImage = {
  url: string;
  publicId: string;
};

export type ProductVariant = {
  name: string;
  value: string;
  stock: number;
};

export type ProductRating = {
  avg: number;
  count: number;
};

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: ProductImage[];
  category: string;
  brand: string;
  stock: number;
  sold: number;
  variants: ProductVariant[];
  ratings: ProductRating;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Address = {
  title: string;
  city: string;
  district: string;
  fullAddress: string;
  isDefault: boolean;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  product: string;
  name: string;
  price: number;
  qty: number;
  image: string;
};

export type ShippingAddress = {
  name: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
};

export type Order = {
  _id: string;
  user: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentId?: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parent?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
