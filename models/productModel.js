import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "product name is required"],
    },
    description: {
      type: String,
    },
    sku: {
      type: String,
      requried: [true, "SKU code is required"],
    },
    regular_price: {
      type: Number,
      default: 0.0,
    },
    selling_price: {
      type: Number,
      default: 0.0,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to the Category model
        default: "Uncategorized",
      },
    ],
    // Store both URL and Public ID for the featured image
    featuredImage: {
      imageUrl: { type: String, required: true }, // URL of the featured image
      photoPublicId: { type: String, required: true }, // Public ID for the featured image in Cloudinary
    },

    images: [
      {
        imageUrl: { type: String, default: "" }, // URL of the uploaded image
        photoPublicId: { type: String, default: "" }, // Public ID for the image in Cloudinary
      },
    ],

    stock: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
