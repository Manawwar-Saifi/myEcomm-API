import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

import fs from "fs"; // For file system operations
import path from "path"; // For handling file paths
import { fileURLToPath } from "url";

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/imageUpload.js";

export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      photo,
      phone,
      state,
      pincode,
      address,
      country,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Fields Required (name,email,password)",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "The Email Already Exists !! You Can Login",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      photo,
      phone,
      state,
      pincode,
      country,
      address,
    });

    res.status(201).json({
      message: "User Registered Successfully",
      success: true,
      newUser,
    });
  } catch (err) {
    res.status(500).json({
      message: `Internal server error ${err}`,
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (
      !email ||
      !password ||
      email == "" ||
      password == "" ||
      email == " " ||
      password == " "
    ) {
      return res.status(422).json({
        message: `All fields are required`,
        success: false,
      });
    } else {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          message: `User not fount`,
          success: false,
        });
      }

      let passwordCheck = await bcrypt.compare(password, user.password);
      if (!passwordCheck) {
        return res.status(401).json({
          message: `Password is wrong`,
          success: false,
        });
      }

      let token = jwt.sign(user.name, process.env.TOKEN_SECRET);
      res.status(200).json({
        message: "User loggedIn Successfully",
        success: true,
        email,
        token,
        name: `${user.name}`,
        photo: `${user.photo}`,
        userId: `${user._id}`,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: `Interval server error ${err}`,
      success: false,
    });
  }
};

export const allUser = async (req, res) => {
  try {
    const response = await User.find({});
    if (!response) {
      return res.status(400).json({
        message: `Something went wrong ${error}`,
        success: false,
      });
    }

    // console.log(response);
    res.status(200).json({
      message: "User Fetched Successfully",
      success: true,
      Users: response,
    });
  } catch (error) {
    res.status(500).json({
      message: `Interval server error ${error}`,
      success: false,
    });
  }
};

export const singleUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID", success: false });
    }

    console.log(id);
    // Check if userId is provided
    if (!id) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    // Find the user by ID in the database
    const user = await User.findById(id).select("-password"); // Exclude the password

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Return the user details
    return res.status(200).json({
      message: "User found",
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error); // For debugging
    res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false,
    });
  }
};

// export const updateUser1 = async (req, res) => {
//   try {
//     const { id } = req.params; // User ID from URL params
//     const { name, email, phone, role } = req.body;
//     const photo = req.file ? req.file.filename : null; // Uploaded photo

//     // Check if the ID is valid
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         message: "Invalid user ID",
//         success: false,
//       });
//     }

//     // Find the user by ID
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found",
//         success: false,
//       });
//     }

//     // If a new photo is uploaded, delete the old photo
//     if (photo && user.photo) {
//       const oldPhotoPath = path.join(__dirname, "../uploads", user.photo);
//       fs.unlink(oldPhotoPath, (err) => {
//         if (err) {
//           console.error(`Error deleting old photo: ${err.message}`);
//         } else {
//           console.log("Old photo deleted successfully.");
//         }
//       });
//     }

//     // Update user fields
//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.phone = phone || user.phone;
//     user.role = role || user.role;
//     user.photo = photo || user.photo;

//     // Save the updated user
//     const updatedUser = await user.save();

//     res.status(200).json({
//       message: "User updated successfully",
//       success: true,
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: `Internal server error: ${error.message}`,
//       success: false,
//     });
//   }
// };

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, country, city, state, pincode, address, role } =
      req.body;

    const fileBuffer = req.file ? req.file.buffer : null;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // If a new photo is uploaded
    if (fileBuffer) {
      // Delete old image from Cloudinary if exists
      if (user.photoPublicId) {
        try {
          await deleteFromCloudinary(user.photoPublicId);
          console.log("Old user image deleted from Cloudinary.");
        } catch (err) {
          console.error(
            "Error deleting old image from Cloudinary:",
            err.message
          );
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(fileBuffer, "users");
      user.photo = uploadResult.imageUrl;
      user.photoPublicId = uploadResult.photoPublicId;
    }

    // Update fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.country = country || user.country;
    user.city = city || user.city;
    user.state = state || user.state;
    user.pincode = pincode || user.pincode;
    user.address = address || user.address;
    user.role = role || user.role;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "User updated successfully",
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({
      message: "Server error",
      success: false,
      error: error.message,
    });
  }
};

export const toggleRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Toggle Role
    user.role = user.role === "user" ? "admin" : "user";

    await user.save();

    res.status(200).json({
      message: `User role updated to ${user.role}`,
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};
