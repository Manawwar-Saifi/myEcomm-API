import User from "../models/userModel.js";

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  const { userId } = req.body; // Assume `userId` is sent in the request body for simplicity
  const user = await User.findById(userId);

  if (!user || user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Only admins can perform this action." });
  }
  next();
};

export default isAdmin;
