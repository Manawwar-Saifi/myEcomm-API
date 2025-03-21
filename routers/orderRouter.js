import express from "express";

import {
  paymentVerify,
  checkout,
  getAllOrder,
  orderConfirm,
  orderCOD,
  UpdateOrderStatus,
  getOrderById,
} from "../controllers/orderController.js";
const router = express.Router();

router.post("/verify-payment", paymentVerify);
router.post("/checkout", checkout);

router.post("/create", orderConfirm);
router.post("/create/cod", orderCOD);
router.get("/get-all", getAllOrder);
router.get("/single-order/:id", getOrderById);
router.put("/update-status/:id", UpdateOrderStatus);

export default router;
