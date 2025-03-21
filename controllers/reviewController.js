import mongoose from "mongoose";
import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js"; // Assuming Product model exists

export const addReview = async (req, res) => {
  try {
    const { user, product, review, image, email, name } = req.body;

    // 1. Validate MongoDB ObjectId for user and product
    if (
      !mongoose.Types.ObjectId.isValid(user) ||
      !mongoose.Types.ObjectId.isValid(product)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid user or product ID", success: false });
    }

    // 2. Check if user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // 3. Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    // 5. Create and save review
    const newReview = new Review({
      user,
      product,
      email,
      review,
      uimage: image,
      name,
    });

    await newReview.save();

    return res.status(201).json({
      message: "Review added successfully",
      success: true,
      data: newReview,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: `Server Error: ${error.message}`, success: false });
  }
};

export const getReviewsByUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate if the product ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
        success: false,
      });
    }

    // 2. Fetch reviews based on product ID
    const reviews = await Review.find({ product: id });

    if (!reviews.length) {
      return res.status(404).json({
        message: "No reviews found for this product",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Reviews fetched successfully",
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Server Error: ${error.message}`,
      success: false,
    });
  }
};
