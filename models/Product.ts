import { model, models, Schema, type InferSchemaType } from "mongoose";

const productImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productVariantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0, default: null },
    images: { type: [productImageSchema], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sold: { type: Number, required: true, min: 0, default: 0 },
    variants: { type: [productVariantSchema], default: [] },
    ratings: {
      avg: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text", brand: "text" });

export type ProductDocument = InferSchemaType<typeof productSchema>;

const Product = models.Product || model("Product", productSchema);

export default Product;
