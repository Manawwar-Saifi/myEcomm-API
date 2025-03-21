import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const allPro = async (req, res) => {
  const allProduct = await Product.find({});
  if (allProduct == "false") {
    return res.status(500).json({
      message: `Something went wrong`,
      success: false,
    });
  }

  if (allProduct.length == 0) {
    return res.status(404).json({
      message: `please add some product`,
      success: false,
    });
  }

  res.status(200).json({
    message: `Get All Product Successfully`,
    success: false,
    products: allProduct,
  });
};
//=========== without image upload==========

// export const addPro = async (req, res) => {
//   try {
//     const {
//       name,
//       description,
//       sku,
//       regular_price,
//       selling_price,
//       categories,
//       stock,
//       status,
//     } = req.body;

//     // Extract and handle featuredImage and images
//     const featuredImage = req.files?.featuredImage?.[0]?.filename || null; // Handle single image
//     const images = req.files?.images
//       ? req.files.images.map((file) => file.filename)
//       : []; // Handle multiple images

//     // Validate and convert categories to ObjectId if provided
//     let validCategories = [];
//     if (categories && categories.length > 0) {
//       validCategories = await Category.find({ _id: { $in: categories } });
//       if (validCategories.length !== categories.length) {
//         return res.status(400).json({
//           message: "One or more categories are invalid",
//           success: false,
//         });
//       }
//     }

//     // Create new product object
//     const newProduct = new Product({
//       name: name || "", // Default empty string if not provided
//       description: description || "", // Default empty string if not provided
//       sku: sku || "", // Default empty string if not provided
//       regular_price: regular_price || 0, // Default price to 0 if not provided
//       selling_price: selling_price || 0, // Default price to 0 if not provided
//       categories: validCategories.map((cat) => cat._id) || [], // Pass ObjectIds or empty array
//       featuredImage, // Null if not provided
//       images, // Empty array if no images provided
//       stock: stock || 0, // Default stock to 0 if not provided
//       status: status || "inactive", // Default status to "inactive" if not provided
//     });

//     // Save the product to the database
//     await newProduct.save();

//     // Respond with success
//     res.status(201).json({
//       message: "Product added successfully",
//       product: newProduct,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: "An error occurred while adding the product",
//       error: error.message,
//     });
//   }
// };

export const addPro = async (req, res) => {
  try {
    const {
      name = "",
      description = "",
      sku = "",
      regular_price = 0,
      selling_price = 0,
      categories = [],
      stock = 0,
      status = "inactive",
    } = req.body;

    // Ensure categories is always treated as an array
    let categoryArray = [];
    if (typeof categories === "string") {
      categoryArray = [categories]; // Convert single category string to an array
    } else if (Array.isArray(categories)) {
      categoryArray = categories;
    } else {
      return res.status(400).json({
        message: "Invalid categories format, expected a string or an array",
        success: false,
      });
    }

    // Ensure categoryArray contains only valid MongoDB ObjectIds
    if (!categoryArray.every((cat) => /^[0-9a-fA-F]{24}$/.test(cat))) {
      return res.status(400).json({
        message: "One or more category IDs are invalid",
        success: false,
      });
    }

    // Validate and fetch existing categories
    const validCategories = await Category.find({ _id: { $in: categoryArray } });
    if (validCategories.length !== categoryArray.length) {
      return res.status(400).json({
        message: "One or more categories are invalid",
        success: false,
      });
    }

    // Handle image uploads safely
    const featuredImage = req.files?.featuredImage?.[0]?.filename || null;
    const images = req.files?.images?.map((file) => file.filename) || [];

    // Create and save product
    const newProduct = new Product({
      name,
      description,
      sku,
      regular_price,
      selling_price,
      categories: validCategories.map((cat) => cat._id),
      featuredImage,
      images,
      stock,
      status,
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while adding the product",
      error: error.message,
    });
  }
};


export const updatePro = async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      regular_price,
      selling_price,
      categories,
      stock,
      status,
    } = req.body;

    const { id } = req.params; // Assuming product ID is passed as a URL parameter

    if (!id) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    // Find the product by ID
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update fields only if they are provided
    product.name = name || product.name;
    product.description = description || product.description;
    product.sku = sku || product.sku;
    product.regular_price = regular_price || product.regular_price;
    product.selling_price = selling_price || product.selling_price;
    product.stock = stock || product.stock;
    product.status = status || product.status;

    // Handle featuredImage update
    if (req.files?.featuredImage?.[0]) {
      // Check if there's an existing featured image to delete
      if (product.featuredImage) {
        const oldImagePath = `./uploads/${product.featuredImage}`;
        try {
          if (fs.existsSync(oldImagePath)) {
            // Check if the file exists
            fs.unlinkSync(oldImagePath); // Delete the existing file
            console.log("Old featured image deleted successfully.");
          }
        } catch (err) {
          console.error("Error deleting old featured image:", err.message);
        }
      }

      // Update the product's featuredImage with the new file's filename
      product.featuredImage = req.files.featuredImage[0].filename;
    }

    // Handle images update
    if (req.files?.images?.length) {
      // Delete old images if they exist
      if (product.images && product.images.length > 0) {
        product.images.forEach((img) => {
          try {
            fs.unlinkSync(`./uploads/${img}`);
          } catch (err) {
            console.error("Error deleting old images:", err.message);
          }
        });
      }
      product.images = req.files.images.map((file) => file.filename); // Save new images filenames
    }

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // Validate and map category IDs if provided
    let validCategories = [];
    if (Array.isArray(categories)) {
      validCategories = categories
        .map((catId) =>
          mongoose.Types.ObjectId.isValid(catId)
            ? new mongoose.Types.ObjectId(catId)
            : null
        )
        .filter(Boolean); // Filter out invalid category IDs
    }

    // Update categories if provided
    if (validCategories.length > 0) {
      product.categories = validCategories;
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        sku,
        regular_price,
        selling_price,
        stock,
        status,
      },
      { new: true } // Return updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Save the updated product
    await product.save();

    res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while updating the product.",
      error: error.message,
    });
  }
};

export const deletePro = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found", success: false });
    }

    // Helper function to delete a file
    const deleteFile = async (fileName) => {
      try {
        const filePath = path.resolve("uploads", fileName);
        await fs.promises.unlink(filePath);
        console.log(`Deleted file: ${filePath}`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.warn(`File not found: ${fileName}`);
        } else {
          console.error(`Error deleting file: ${fileName} - ${error.message}`);
        }
      }
    };

    // Delete the featured image if it exists
    if (product.featuredImage) {
      await deleteFile(product.featuredImage);
    }

    // Delete additional images, ensuring no duplicates are processed
    if (product.images && product.images.length > 0) {
      const processedFiles = new Set();
      for (const image of product.images) {
        if (!processedFiles.has(image)) {
          await deleteFile(image);
          processedFiles.add(image);
        }
      }
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Product deleted successfully", success: true });
  } catch (error) {
    console.error(`Error deleting product: ${error.message}`);
    res.status(500).json({
      message: `Internal Server Error: ${error.message}`,
      success: false,
    });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Id is missing Please Provide the id",
        success: false,
      });
    }

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
        success: false,
      });
    }

    const product = await Product.findById(id);

    // If Product not found
    if (!product) {
      return res.status(404).json({
        message: "Product not fount",
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product Found successfully",
      product,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal Server Error::${err}`,
      success: false,
    });
  }
};

export const deleteExtraImage = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from the URL
    const { imageName } = req.body; // Get the image name from the request body

    if (!id || !imageName) {
      return res.status(400).json({
        message: "User ID and Image Name are required",
        success: false,
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if the image exists in extraImages
    if (!product.images.includes(imageName)) {
      return res.status(404).json({
        message: "Image not found in user's extra images",
        success: false,
      });
    }

    // Remove the image from extraImages
    product.images = product.images.filter((img) => img !== imageName);

    // Delete the physical file
    const filePath = path.resolve("uploads", imageName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete the file
    }

    // Save the updated user
    await product.save();

    return res.status(200).json({
      message: "Image deleted successfully",
      product,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting image:", error.message);
    return res.status(500).json({
      message: `Internal Server Error: ${error.message}`,
      success: false,
    });
  }
};

//========== with image upload functionlity ===========

// export const addPro = async (req, res) => {
//   try {
//     const { name, description, sku, regular_price, selling_price, categories } =
//       req.body;

//     // Handle the image upload via Multer
//     upload.single("featuredImage")(req, res, async (err) => {
//       if (err) {
//         return res.status(400).json({ error: err.message });
//       }

//       // Get the image URL generated by Multer
//       const featuredImage = req.file ? req.file.path : ""; // Path where the image is stored

//       // Validate categories
//       const category = await Category.find({ _id: { $in: categories } });
//       if (category.length !== categories.length) {
//         return res
//           .status(400)
//           .json({ error: "One or more categories not found" });
//       }

//       // Validate required fields
//       if (
//         !name ||
//         !description ||
//         !sku ||
//         !regular_price ||
//         !selling_price ||
//         !featuredImage
//       ) {
//         return res.status(400).json({
//           message:
//             "Required fields: name, description, price, categories, featuredImage",
//           success: false,
//         });
//       }

//       // Create the product
//       const product = await Product.create({
//         name,
//         description,
//         sku,
//         regular_price,
//         selling_price,
//         categories,
//         featuredImage, // Store the image URL in the database
//       });

//       return res.status(201).json({
//         message: "Product added successfully",
//         success: true,
//         product,
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message, success: false });
//   }
// };

// export const updatePro = async (req, res) => {
//   try {
//     const { id } = req.params; // Product ID
//     const { name, description, sku, regular_price, selling_price, categories } =
//       req.body;

//     // Handle the image upload via Multer
//     upload.single("featuredImage")(req, res, async (err) => {
//       if (err) {
//         return res.status(400).json({ error: err.message });
//       }

//       // Find the product by ID
//       const product = await Product.findById(id);
//       if (!product) {
//         return res.status(404).json({
//           message: "Product not found",
//           success: false,
//         });
//       }

//       // Prepare updated fields
//       const updatedFields = {};

//       if (name) updatedFields.name = name;
//       if (description) updatedFields.description = description;
//       if (sku) updatedFields.sku = sku;
//       if (regular_price) updatedFields.regular_price = regular_price;
//       if (selling_price) updatedFields.selling_price = selling_price;
//       if (categories) updatedFields.categories = categories;

//       // If a new image is uploaded, delete the old one
//       if (req.file) {
//         const oldImagePath = product.featuredImage;
//         if (oldImagePath) {
//           // Delete old image from local storage
//           fs.unlink(path.join(__dirname, "..", oldImagePath), (err) => {
//             if (err) {
//               console.error("Error deleting old image:", err);
//             }
//           });
//         }

//         // Store the new image path
//         updatedFields.featuredImage = req.file.path;
//       }

//       // Update the product with new data
//       const updatedProduct = await Product.findByIdAndUpdate(
//         id,
//         updatedFields,
//         { new: true }
//       );

//       return res.status(200).json({
//         message: "Product updated successfully",
//         success: true,
//         updatedProduct,
//       });
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message, success: false });
//   }
// };

// export const deletePro = async (req, res) => {
//   try {
//     const { id } = req.params; // Product ID

//     // Find the product by ID
//     const product = await Product.findById(id);
//     if (!product) {
//       return res.status(404).json({
//         message: "Product not found",
//         success: false,
//       });
//     }

//     // Delete the product image from the local storage if it exists
//     const imagePath = product.featuredImage;
//     if (imagePath) {
//       fs.unlink(path.join(__dirname, "..", imagePath), (err) => {
//         if (err) {
//           console.error("Error deleting image:", err);
//         }
//       });
//     }

//     // Delete the product from the database
//     await Product.findByIdAndDelete(id);

//     return res.status(200).json({
//       message: "Product deleted successfully",
//       success: true,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: error.message, success: false });
//   }
// };
