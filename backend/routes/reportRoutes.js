const express = require("express");
const router = express.Router();
const {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
} = require("../controllers/reportController");
const { getTeamReports, reviewReport } = require("../controllers/reviewController");
const { exportReportsToExcel } = require("../controllers/exportController");
const { protect, authorize } = require("../middleware/authMiddleware");

// any logged-in user (employee/teamlead) can submit and manage their own reports
router.post("/", protect, createReport);
router.get("/mine", protect, getMyReports);

// Admin: filter + download Excel (any department). Team Lead can also
// export, but is locked to their own department in the controller.
router.get("/export", protect, authorize("admin", "teamlead"), exportReportsToExcel);

// Team Lead / Admin: view team/department reports and review them
router.get("/team/all", protect, authorize("teamlead", "admin"), getTeamReports);
router.put("/:id/review", protect, authorize("teamlead", "admin"), reviewReport);

router.get("/:id", protect, getReportById);
router.put("/:id", protect, updateReport);

module.exports = router;