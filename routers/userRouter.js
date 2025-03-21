import express from "express";
import {
  login,
  signup,
  allUser,
  singleUser,
  updateUser,
  toggleRole,
} from "../controllers/userController.js";
import upload from "../utils/imageUpload.js";

// import multer from "multer";
// import fs from "fs";
// import path from "path";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/all", allUser);
router.get("/single-user/:id", singleUser);
router.put("/update-user/:id", upload.single("photo"), updateUser);
router.put("/toggle-role/:id", toggleRole);

export default router;
