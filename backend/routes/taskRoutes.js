const express = require("express");
const router = express.Router();
const {
  createTask,
  getMyTasks,
  getTeamTasks,
  updateTaskStatus,
} = require("../controllers/taskController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Team Lead / Admin: assign tasks and view all tasks in their department
router.post("/", protect, authorize("teamlead", "admin"), createTask);
router.get("/team", protect, authorize("teamlead", "admin"), getTeamTasks);

// Employee: view own tasks, update their own status
router.get("/mine", protect, getMyTasks);
router.put("/:id/status", protect, updateTaskStatus);

module.exports = router;