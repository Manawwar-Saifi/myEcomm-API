import express from "express";
import { sendMail, getMail } from "../controllers/formDataCo.js";

const router = express.Router();

router.post("/add", sendMail);
router.get("/get", getMail);

export default router;
