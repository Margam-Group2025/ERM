const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/uploadController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddleware");

// any logged-in user can upload a file for a dynamic "file" type field
router.post("/", protect, upload("file"), uploadFile);

module.exports = router;