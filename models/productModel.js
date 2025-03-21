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
      default:0.00
    },
    selling_price: {
      type: Number,
      default:0.00
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to the Category model
        default:"Uncategorized"
      },
    ],
    featuredImage: {
      type: String,
    },
    images: [
      {
        type: String,
        default: "",
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
