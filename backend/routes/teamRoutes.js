const express = require("express");
const router = express.Router();
const {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
} = require("../controllers/teamController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, getTeams);

router.post("/", protect, authorize("admin"), createTeam);
router.put("/:id", protect, authorize("admin"), updateTeam);
router.delete("/:id", protect, authorize("admin"), deleteTeam);

module.exports = router;