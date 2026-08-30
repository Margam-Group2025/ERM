const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

// public: anyone can login
router.post("/login", loginUser);

// protected: only an already-logged-in Admin can register new users
// (frontend will send the Admin's token in the Authorization header)
router.post("/register", protect, authorize("admin"), registerUser);

module.exports = router;