import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// .connect(process.env.MONGODB_LOCAL, { dbName: "myEcomm" })
mongoose
  .connect(process.env.MONGODB_URI, { dbName: "myEcomm" })
  .then(() => {
    console.log("Databases Connected Successfully");
  })
  .catch((err) => {
    console.log("Something went wrong in db connection", err);
  });
