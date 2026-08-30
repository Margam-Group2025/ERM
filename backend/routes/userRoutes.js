const express = require("express");
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

// all user-management routes are Admin-only
// GET is open to Admin and Team Lead (Team Lead is locked to their own
// department in the controller). Create/update/delete stay Admin-only.
router.get("/", protect, authorize("admin", "teamlead"), getUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;