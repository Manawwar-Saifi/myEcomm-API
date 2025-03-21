import Category from "../models/categoryModel.js";
import mongoose from "mongoose";
import fs from "fs"; // For file system operations
import path from "path"; // For handling file paths
import { fileURLToPath } from "url";

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
    let photo = "";
    if (!req.file) {
      photo = "";
    }

    photo = req.file ? req.file.filename : null; // Store only the file name

    const newCategory = new Category({
      name,
      photo: photo,
      description,
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
    const photo = req.file ? req.file.filename : null; // Uploaded file
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    // Find the category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
        success: false,
      });
    }

    // If a new photo is uploaded, delete the old photo
    if (photo && category.photo) {
      const oldPhotoPath = path.join(__dirname, "../uploads", category.photo);
      fs.unlink(oldPhotoPath, (err) => {
        if (err) {
          console.error(`Error deleting old image: ${err.message}`);
        } else {
          console.log("Old image deleted successfully.");
        }
      });
    }

    // Update category fields
    category.name = name || category.name;
    category.description = description || category.description;
    category.status = status || category.status;
    category.photo = photo || category.photo;

    // Save the updated category
    const updatedCategory = await category.save();

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal Server Error112: ${err.message}`,
      success: false,
    });
  }
};

// Deleting category
export const deleteCate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid category ID",
        success: false,
      });
    }

    // Find the category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }

    // Delete the associated image if it exists
    if (category.photo) {
      const imagePath = path.join(__dirname, "../uploads", category.photo);
      try {
        await fs.promises.unlink(imagePath); // Use async file deletion
        console.log(`Image deleted: ${imagePath}`);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn(`Image not found: ${imagePath}`);
        } else {
          console.error(`Error deleting image: ${err.message}`);
        }
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
      message: `Internal Server Error :: ${err.message}`,
      success: false,
    });
  }
};;
