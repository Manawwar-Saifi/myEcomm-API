import express from "express";

import {
  addCate,
  updateCate,
  deleteCate,
  allCate,
  singleCate,
} from "../controllers/categoryController.js";

import upload from "../utils/imageUpload.js";

const router = express.Router();



router.get("/all", allCate);
router.post("/add", upload.single("photo"), addCate);
router.put("/update/:id", upload.single("photo"), updateCate);
router.delete("/delete/:id", deleteCate);
router.get("/single/:id", singleCate);

export default router;
