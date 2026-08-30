const express = require("express");
const router = express.Router();
const {
  createTemplate,
  getTemplates,
  getActiveTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/templateController");
const { protect, authorize } = require("../middleware/authMiddleware");

// any logged-in user can fetch the active template for their department
// (employees need this to render their report form)
router.get("/active", protect, getActiveTemplate);
router.get("/", protect, getTemplates);

// only Admin can build/edit templates
router.post("/", protect, authorize("admin"), createTemplate);
router.put("/:id", protect, authorize("admin"), updateTemplate);
router.delete("/:id", protect, authorize("admin"), deleteTemplate);

module.exports = router;