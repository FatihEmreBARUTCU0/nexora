import { z } from "zod";

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid id format.");

const productImageSchema = z.object({
  url: z.string().url("Image URL is invalid."),
  publicId: z.string().min(1, "Image publicId is required."),
});

const productVariantSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  stock: z.number().int().min(0),
});

export const productSchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z.string().min(1, "Slug is required."),
  description: z.string().min(1, "Description is required."),
  price: z.number().positive("Price must be greater than zero."),
  comparePrice: z.number().min(0).nullable().optional(),
  images: z.array(productImageSchema).optional(),
  category: z.string().min(1, "Category is required."),
  brand: z.string().min(1, "Brand is required."),
  stock: z.number().int().min(0, "Stock cannot be negative."),
  sold: z.number().int().min(0).optional(),
  variants: z.array(productVariantSchema).optional(),
  isActive: z.boolean().optional(),
});

export const productUpdateSchema = productSchema.partial().omit({ sold: true });

export const cartItemSchema = z.object({
  productId: objectIdSchema,
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  image: z.string().max(2000),
  quantity: z.number().int().min(1).max(99),
  slug: z.string().min(1).max(200),
  selectedColor: z.string().max(100).optional(),
  selectedSize: z.string().max(100).optional(),
});

export const cartUpdateSchema = z.object({
  items: z.array(cartItemSchema).max(50),
});

export const paymentCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(99),
});

export const shippingAddressSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(30),
  city: z.string().min(1).max(100),
  district: z.string().min(1).max(100),
  fullAddress: z.string().min(1).max(500),
});

export const paymentInitiateSchema = z.object({
  cartItems: z.array(paymentCartItemSchema).min(1).max(50),
  shippingAddress: shippingAddressSchema,
});

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const profileUpdateSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).max(128).optional(),
  })
  .refine(
    (data) => !data.newPassword || data.currentPassword,
    { message: "Current password is required.", path: ["currentPassword"] }
  );

export const chatMessageSchema = z.object({
  role: z.literal("user"),
  content: z.string().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).max(30),
});

export const favoriteAddSchema = z.object({
  productId: objectIdSchema,
});

export const upsellCartItemSchema = z.object({
  productId: objectIdSchema,
  name: z.string().max(200),
  price: z.number().min(0).max(1_000_000),
});

export const upsellRequestSchema = z.object({
  cartItems: z.array(upsellCartItemSchema).max(50),
});

export const aiSearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product: objectIdSchema,
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  shippingAddress: shippingAddressSchema,
});
