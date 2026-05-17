import { model, models, Schema, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    image: { type: String, trim: true, default: null },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, isActive: 1 });

export type CategoryDocument = InferSchemaType<typeof categorySchema>;

const Category = models.Category || model("Category", categorySchema);

export default Category;
