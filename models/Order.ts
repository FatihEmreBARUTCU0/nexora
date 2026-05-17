import { model, models, Schema, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
    image: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    fullAddress: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, required: true, trim: true },
    paymentId: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled", "failed"],
      default: "pending",
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema>;

const Order = models.Order || model("Order", orderSchema);

export default Order;
