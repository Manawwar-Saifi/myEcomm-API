import express from "express";
import {
  addPro,
  deletePro,
  updatePro,
  allPro,
  getSingleProduct,
  deleteExtraImage,
} from "../controllers/productController.js";
// import isAdmin from "../middlewares/isAdmin.js";

import upload from "../middlewares/productImgeUpload.js";

const router = express.Router();

router.get("/all", allPro);
router.post(
  "/add",
  upload.fields([
    { name: "featuredImage", maxCount: 1 }, // Single image
    { name: "images", maxCount: 10 }, // Multiple images
  ]),
  addPro
);
router.put(
  "/update/:id",
  upload.fields([
    { name: "featuredImage", maxCount: 1 }, // Single image
    { name: "images", maxCount: 10 }, // Multiple images
  ]),
  updatePro
);
router.delete("/delete/:id", deletePro);
router.get("/product-details/:id", getSingleProduct);
router.delete("/delete-extra-image/:id", deleteExtraImage);

export default router;
