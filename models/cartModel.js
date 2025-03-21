// Import mongoose
import mongoose from "mongoose";

// Define the CartItem schema
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the Product model
    required: true,
    ref: "Product",
  },
  name: {
    type: String, // Name of the product
    required: true,
  },
  image: {
    type: String, // Image URL of the product
    required: true,
  },
  price: {
    type: Number, // Price of the product
    required: true,
  },
  quantity: {
    type: Number, // Quantity of the product added to the cart
    required: true,
    min: 1,
    default: 1,
  },
});

// Define the Cart schema
const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      required: true,
      ref: "User",
    },
    items: [cartItemSchema], // Array of CartItem schemas
  },
  {
    timestamps: true,
  }
);

// Create the Cart model
const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
