import Order from "../models/orderModel.js";
import crypto from "crypto";
import { instance } from "../razorpay.js";
import { RazorTest } from "../models/razorTest.js";
import Cart from "../models/cartModel.js";

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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !userId
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { razorpay_order_id },
      {
        $set: {
          paymentStatus: "Paid",
          razorpay_payment_id,
          razorpay_signature,
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Empty the cart after successful payment
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }, // Empty the cart
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified, order placed successfully, and cart emptied.",
      updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal Server Error: ${error.message}`,
      success: false,
    });
  }
};

// POST: Order Confirmation
export const orderCOD = async (req, res) => {
  try {
    const { userId, products, totalPrice, paymentMethod, amount } = req.body;

    // Validate required fields
    if (!userId || !products || products.length === 0 || !totalPrice) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Create order in MongoDB
    const newOrder = new Order({
      userId,
      products,
      totalPrice,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      amount,
    });

    const savedOrder = await newOrder.save();

    if (!savedOrder) {
      return res.status(500).json({
        message: "Server Error: Order not saved",
        success: false,
      });
    }

    // Empty the cart after order placement
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } }, // Reset items array to empty
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully. Cart is now empty.",
      savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: `Server Error: ${error.message}`,
      success: false,
    });
  }
};
// POST: Order Confirmation

export const orderConfirm = async (req, res) => {
  try {
    console.log("Incoming Request:", req.body); // Debugging Input

    const { userId, products, totalPrice, paymentMethod, amount } = req.body;

    // Ensure `products` is defined and is an array
    // if (!userId || !Array.isArray(products) || products.length === 0 || !totalPrice) {
    //   console.error("Validation Failed: Missing required fields");
    //   return res.status(400).json({ message: "All required fields must be provided and 'products' must be an array" });
    // }

    const options = {
      amount: Number(amount * 100), // Convert to paise
      currency: "INR",
    };

    console.log("Creating Razorpay Order with options:", options);

    const razorpayOrder = await instance.orders.create(options);

    if (!razorpayOrder) {
      console.error("Failed to create order on Razorpay");
      return res
        .status(500)
        .json({ message: "Failed to create order on Razorpay" });
    }

    const newOrder = new Order({
      userId,
      products,
      razorpay_payment_id: "",
      razorpay_order_id: razorpayOrder.id,
      razorpay_signature: "",
      totalPrice,
      paymentMethod,
      paymentStatus: "Pending",
    });

    const savedOrder = await newOrder.save();
    console.log("Order Saved in DB:", savedOrder);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      razorpayOrder,
      savedOrder,
    });
  } catch (error) {
    console.error("Error in orderConfirm API:", error.message);
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

//  GET
export const getAllOrder = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId", "name price");
    res.status(200).json({
      orders,
      message: "Oders successfully feteched",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      success: false,
    });
  }
};

// @route   GET /api/orders/:id
// @desc    Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .populate("userId", "name email")
      .populate("products.productId", "name price");

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @route   PUT /api/orders/:id
// @desc    Update order status
export const UpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res
      .status(200)
      .json({ success: true, message: "Status updated successfully", order });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// @route   DELETE /api/orders/:id
// @desc    Delete an order
const deleteOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.deleteOne();
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
