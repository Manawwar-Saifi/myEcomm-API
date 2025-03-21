import Cart from "../models/cartModel.js";
import mongoose from "mongoose";

export const addToCart = async (req, res) => {
  try {
    const { userId, productId, name, image, price,quantity } = req.body;

    // Validate required fields
    if (!userId || !productId || !name || !image || !price || !quantity ) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    // Find the cart for the given user
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If the cart does not exist, create a new one
      cart = new Cart({
        userId,
        items: [],
      });
    }

    // Check if the product is already in the cart
    const existingProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingProductIndex !== -1) {
      // If the product exists, update the quantity
      cart.items[existingProductIndex].quantity += quantity;
    } else {
      // If the product does not exist, add it to the cart
      cart.items.push({
        productId,
        name,
        image,
        price,
        quantity,
      });
    }

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Product added to cart successfully",
      success: true,
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      success: false,
    });
  }
};

//Call this api (onChange event on the cart button and get the value of the input feild and give to the api that's it)
export const quantityUpdate = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Validate required fields
    if (!userId || !productId || !quantity) {
      return res
        .status(400)
        .json({ message: "All fields are required", success: false });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }

    // Find the product in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in cart", success: false });
    }

    // Update the quantity of the product
    cart.items[productIndex].quantity = quantity;

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Cart updated successfully",
      success: true,
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};

export const deleteCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({
        message: "User ID and Product ID are required",
        success: false,
      });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }

    // Check if the product exists in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ message: "Product not found in cart", success: false });
    }

    // Remove the product from the cart
    cart.items.splice(productIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      success: true,
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};

// const response = await fetch(`/api/cart/get-cart?userId=${userId}`);
export const getAll = async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate required fields
    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required", success: false });
    }

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid User ID", success: false });
    }
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId"); // Populate product details if necessary

    if (!cart) {
      return res
        .status(404)
        .json({ message: "Cart not found", success: false });
    }

    res.status(200).json({
      message: "Cart retrieved successfully",
      success: true,
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      success: false,
      error: error.message,
    });
  }
};
