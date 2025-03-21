import mongoose from "mongoose";

const modelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please add name"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "please add email"],
    },
    photo: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      unique: true,
      required: [true, "please add phone"],
    },

    country: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    pincode: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: [true, "please add password"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

const User = new mongoose.model("User", modelSchema);

export default User;
