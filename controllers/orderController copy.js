import Order from "../models/orderModel.js";
import crypto from "crypto";
import { instance } from "../razorpay.js";
import { RazorTest } from "../models/razorTest.js";

export const checkout = async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100), // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    res.status(200).json({
      order,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal Server Errror::${error.message}`,
      success: false,
    });
  }
};
export const paymentVerify = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    console.log(req.body);

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await RazorTest.create({
        razorpay_order_id,
        razorpay_signature,
        razorpay_payment_id,
      });

      res.redirect(
        `http://localhost:5173/paymentsuccess?reference=${razorpay_payment_id}`
      );
    } else {
      return res.status(500).json({ success: false });
    }
  } catch (error) {
    res.status(400).json({
      message: `Internal Server Errror::${error.message}`,
      success: false,
    });
  }
};



// Update order status or payment status API
router.post("/update-status", async (req, res) => {
  try {
    const { id, field, value } = req.body;

    if (!id || !field || !value) {
      return res.status(400).json({ success: false, message: "Invalid request data" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order[field] = value;
    await order.save();

    return res.status(200).json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});










