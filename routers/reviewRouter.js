import express from "express";
import {
  addReview,
  getReviewsByUser,
} from "../controllers/reviewController.js";

const router = express.Router();

router.post("/add", addReview);
// router.put("/update", quantityUpdate);
// router.delete("/delete", deleteCart);
router.get("/get/:id", getReviewsByUser);

export default router;
