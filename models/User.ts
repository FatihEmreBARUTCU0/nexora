import { model, models, Schema, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const favoriteItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    slug: { type: String, required: true, trim: true },
    selectedColor: { type: String, default: "" },
    selectedSize: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    addresses: { type: [addressSchema], default: [] },
    favorites: { type: [favoriteItemSchema], default: [] },
    cart: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User = models.User || model("User", userSchema);

export default User;
