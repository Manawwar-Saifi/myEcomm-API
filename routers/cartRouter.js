import express from "express";
import {
  addToCart,
  quantityUpdate,
  deleteCart,
  getAll,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", addToCart);
router.put("/update", quantityUpdate);
router.delete("/delete", deleteCart);
router.get("/all", getAll);

export default router;
