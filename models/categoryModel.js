import mongoose from "mongoose";

const ModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    photo: {
      type: String,
    },
    photoPublicId: {
      type: String,
      default: "",
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Category = new mongoose.model("Category", ModelSchema);

export default Category;
