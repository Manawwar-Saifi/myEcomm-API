// import multer from "multer";
// import path from "path";

// // Configure storage for multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Directory to save uploaded files
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`); // Create unique file names
//   },
// });

// // File filter for images
// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg" ||
//     file.mimetype === "image/webp"
//   ) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only JPEG, PNG, and JPG files are allowed"), false);
//   }
// };

// // Initialize multer with storage and file filter
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 1024 * 1024 * 5 }, // Limit: 5MB
//   fileFilter: fileFilter,
// });

// export default upload;

import multer from "multer";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure storage for multer (in-memory storage since we're uploading to Cloudinary)
const storage = multer.memoryStorage(); // Store files in memory

// File filter for images (same as before)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and JPG files are allowed"), false);
  }
};

// Initialize multer with memory storage and file filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit: 5MB
  fileFilter: fileFilter,
});

export default upload;

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/**
 * Uploads an image to Cloudinary and returns the URL & public ID.
 * @param {Buffer} fileBuffer - Image buffer from multer
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Promise<Object>} - { imageUrl, photoPublicId }
 */
export const uploadToCloudinary = async (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      { resource_type: "auto", folder },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(new Error("Cloudinary upload failed"));
        } else {
          resolve({
            imageUrl: result.secure_url,
            photoPublicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Uploads multiple images to Cloudinary and returns an array of URLs and public IDs.
 * @param {Buffer[]} fileBuffers - Array of image buffers from multer.array()
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Promise<Array<Object>>} - Array of { imageUrl, photoPublicId } objects
 */
export const uploadMultipleToCloudinary = async (fileBuffers, folder) => {
  const uploadPromises = fileBuffers.map(
    (fileBuffer) =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { resource_type: "auto", folder },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              reject(new Error("Cloudinary upload failed"));
            } else {
              resolve({
                imageUrl: result.secure_url,
                photoPublicId: result.public_id,
              });
            }
          }
        );
        uploadStream.end(fileBuffer);
      })
  );

  return Promise.all(uploadPromises);
};

/**
 * Deletes an image from Cloudinary using its public ID.
 * @param {String} publicId - The public ID of the image to delete
 * @returns {Promise<Boolean>} - Returns true if deleted successfully, false otherwise
 */
export const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    if (!publicId) return resolve(false); // No image to delete

    cloudinary.v2.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary Deletion Error:", error);
        reject(new Error("Cloudinary deletion failed"));
      } else {
        resolve(result.result === "ok");
      }
    });
  });
};
