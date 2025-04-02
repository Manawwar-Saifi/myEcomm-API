import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/imageUpload.js";

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
    const validCategories = await Category.find({
      _id: { $in: categoryArray },
    });
    if (validCategories.length !== categoryArray.length) {
      return res.status(400).json({
        message: "One or more categories are invalid",
        success: false,
      });
    }

    // Handle featured image upload (Store both imageUrl & photoPublicId)
    let featuredImage = { imageUrl: null, photoPublicId: null };
    if (req.files?.featuredImage?.[0]) {
      const uploadResult = await uploadToCloudinary(
        req.files.featuredImage[0].buffer,
        "products"
      );
      featuredImage = {
        imageUrl: uploadResult.imageUrl, // Storing the image URL
        photoPublicId: uploadResult.photoPublicId, // Storing the Public ID
      };
    }

    // Handle multiple image uploads (Store both imageUrl & photoPublicId for each image)
    let uploadedImages = [];
    if (req.files?.images) {
      uploadedImages = await Promise.all(
        req.files.images.map(async (file) => {
          const uploadResult = await uploadToCloudinary(
            file.buffer,
            "products"
          );
          return {
            imageUrl: uploadResult.imageUrl, // Store URL
            photoPublicId: uploadResult.photoPublicId, // Store Public ID
          };
        })
      );
    }

    // Create and save product
    const newProduct = new Product({
      name,
      description,
      sku,
      regular_price,
      selling_price,
      categories: validCategories.map((cat) => cat._id),
      featuredImage, // Stores both imageUrl & publicId
      images: uploadedImages, // Stores both imageUrl & publicId for each image
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

    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Handle featuredImage update
    if (req.files?.featuredImage?.[0]) {
      // Delete old featured image from Cloudinary
      if (product.featuredImage?.photoPublicId) {
        await deleteFromCloudinary(product.featuredImage.photoPublicId);
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.files.featuredImage[0].buffer,
        "products"
      );
      product.featuredImage = {
        imageUrl: uploadResult.imageUrl,
        photoPublicId: uploadResult.photoPublicId,
      };
    }

    // Handle images update
    if (req.files?.images?.length) {
      // Delete all previous images from Cloudinary
      for (const img of product.images) {
        if (img?.photoPublicId) {
          await deleteFromCloudinary(img.photoPublicId);
        }
      }

      // Upload new images
      product.images = await Promise.all(
        req.files.images.map(async (file) => {
          const uploadResult = await uploadToCloudinary(
            file.buffer,
            "products"
          );
          return {
            imageUrl: uploadResult.imageUrl,
            photoPublicId: uploadResult.photoPublicId,
          };
        })
      );
    }

    // Update only provided fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.sku = sku || product.sku;
    product.regular_price = regular_price || product.regular_price;
    product.selling_price = selling_price || product.selling_price;
    product.stock = stock || product.stock;
    product.status = status || product.status;

    // Validate & update categories
    let validCategories = [];
    if (categories) {
      let categoryArray = Array.isArray(categories)
        ? categories
        : typeof categories === "string"
        ? [categories]
        : [];

      if (!categoryArray.every((cat) => /^[0-9a-fA-F]{24}$/.test(cat))) {
        return res.status(400).json({ message: "Invalid category ID format." });
      }

      const foundCategories = await Category.find({
        _id: { $in: categoryArray },
      });
      if (foundCategories.length !== categoryArray.length) {
        return res
          .status(400)
          .json({ message: "Some categories do not exist." });
      }

      product.categories = foundCategories.map((cat) => cat._id);
    }

    // Save updated product
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

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    // Delete featured image from Cloudinary
    if (product.featuredImage?.photoPublicId) {
      try {
        await deleteFromCloudinary(product.featuredImage.photoPublicId);
        console.log("Deleted featured image from Cloudinary.");
      } catch (error) {
        console.error("Error deleting featured image:", error.message);
      }
    }

    // Delete additional images from Cloudinary
    if (product.images && product.images.length > 0) {
      const processedPublicIds = new Set();

      for (const image of product.images) {
        if (
          image?.photoPublicId &&
          !processedPublicIds.has(image.photoPublicId)
        ) {
          try {
            await deleteFromCloudinary(image.photoPublicId);
            processedPublicIds.add(image.photoPublicId);
            console.log(
              `Deleted image ${image.photoPublicId} from Cloudinary.`
            );
          } catch (error) {
            console.error(
              `Error deleting image ${image.photoPublicId}:`,
              error.message
            );
          }
        }
      }
    }

    // Delete the product from the database
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      message: "Product deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting product:", error.message);
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
    const { id } = req.params;
    const { photoPublicId } = req.body;

    if (!id || !photoPublicId) {
      return res.status(400).json({
        message: "Product ID and Image Public ID are required",
        success: false,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    // Find image index by matching the photoPublicId
    const imageIndex = product.images.findIndex(
      (img) => img.photoPublicId === photoPublicId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        message: "Image not found in product's images",
        success: false,
      });
    }

    // Delete image from Cloudinary
    const deleted = await deleteFromCloudinary(photoPublicId);
    if (!deleted) {
      return res.status(500).json({
        message: "Failed to delete image from Cloudinary",
        success: false,
      });
    }

    // Remove image from product images array
    product.images.splice(imageIndex, 1);
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
