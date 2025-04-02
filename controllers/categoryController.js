import Category from "../models/categoryModel.js";
import mongoose from "mongoose";
import fs from "fs"; // For file system operations
import path from "path"; // For handling file paths
import { fileURLToPath } from "url";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/imageUpload.js";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const allCate = async (req, res) => {
  try {
    const all = await Category.find({});
    if (all == "false") {
      return res.status(500).json({
        message: `Something went wrong`,
        success: false,
      });
    }
    res.status(200).json({
      message: "All Category Get the successfully",
      success: true,
      categories: all,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Internal server error ${err}`,
    });
  }
};
export const addCate = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const fileBuffer = req.file ? req.file.buffer : null;

    let imageUrl = "";
    let photoPublicId = "";

    // Upload image to Cloudinary if provided
    if (fileBuffer) {
      const uploadResult = await uploadToCloudinary(fileBuffer, "categories");
      imageUrl = uploadResult.imageUrl;
      photoPublicId = uploadResult.photoPublicId;
    }

    const newCategory = new Category({
      name,
      photo: imageUrl,
      description,
      photoPublicId,
      status,
    });

    await newCategory.save();
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Error creating category ${error}`, success: false });
  }
};

// Get Single Category using id
export const singleCate = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }
    const singleCate = await Category.findById(id);
    if (!singleCate) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    const { name, photo, description, status } = singleCate;

    res.status(200).json({
      success: true,
      message: "Category get successfully",
      category: { name, photo, description, status },
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal Server Error :: ${err}`,
      success: false,
    });
  }
};

// Updating a category
export const updateCate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    // Find category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
        success: false,
      });
    }

    let { imageUrl, photoPublicId } = category; // Keep old values
    const fileBuffer = req.file ? req.file.buffer : null;

    // If user uploaded a new image, delete the old one and upload a new one
    if (fileBuffer) {
      if (photoPublicId) {
        await deleteFromCloudinary(photoPublicId); // Delete old Cloudinary image
      }
      const uploadResult = await uploadToCloudinary(fileBuffer, "categories");

      console.log("Cloudinary Upload Result:", uploadResult);

      if (
        !uploadResult ||
        !uploadResult.imageUrl ||
        !uploadResult.photoPublicId
      ) {
        return res.status(500).json({
          message: "Cloudinary upload failed. Image URL or Public ID missing.",
          success: false,
        });
      }

      imageUrl = uploadResult.imageUrl;
      photoPublicId = uploadResult.photoPublicId;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name || category.name,
        description: description || category.description,
        status: status || category.status,
        photo: imageUrl,
        photoPublicId,
      },
      { new: true } // ✅ Returns updated data
    );
    // console.log("Updated Category in DB:", updatedCategory);

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal Server Error: ${err.message}`,
      success: false,
    });
  }
};

// Deleting a category
export const deleteCate = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    // Find the category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    // Delete image from Cloudinary using photoPublicId
    if (category.photoPublicId) {
      try {
        const deleted = await deleteFromCloudinary(category.photoPublicId);
        if (deleted) {
          console.log(
            `Deleted category image from Cloudinary: ${category.photoPublicId}`
          );
        } else {
          console.warn(
            `Cloudinary image not deleted or already removed: ${category.photoPublicId}`
          );
        }
      } catch (err) {
        console.error(`Error deleting image from Cloudinary: ${err.message}`);
      }
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    res.status(200).json({
      message: "Category deleted successfully",
      success: true,
      category,
    });
  } catch (err) {
    console.error(`Error deleting category: ${err.message}`);
    res.status(500).json({
      message: `Internal Server Error: ${err.message}`,
      success: false,
    });
  }
};
