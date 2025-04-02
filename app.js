// IMPORT Statements
import "./utils/db.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import userRouter from "./routers/userRouter.js";
import categoryRouter from "./routers/categoryRouter.js";
import productRouter from "./routers/productRouter.js";
import orderRouter from "./routers/orderRouter.js";
import reviewRouter from "./routers/reviewRouter.js";
import formDataRouter from "./routers/formDataRouter.js";
import path from "path";
import cartRouter from "./routers/cartRouter.js";


// import "./cloudinaryConfig.js";

// Config here
dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // Adjust as needed
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// Routing

app.get("/", (req, res) => {
  res.send("<h1>hello world Vercel Testing Auto Update</h1>");
});

// Serve static files from the uploads folder
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use("/user", userRouter);
app.use("/category", categoryRouter);
app.use("/product", productRouter);
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/review", reviewRouter);
app.use("/form", formDataRouter);

app.get("/key", (req, res) => {
  try {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({
      message: `Internal Server Errror::${error.message}`,
      success: false,
    });
  }
});

app.listen(PORT, () => {
  console.log(`The Sever is listening on ${PORT}`);
});


