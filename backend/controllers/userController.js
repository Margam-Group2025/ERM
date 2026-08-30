const User = require("../models/User");

// @route  GET /api/users
// @desc   Admin views all users (optionally filter by department/role via query).
// Team Lead can also call this, but is locked to their own department —
// they need it to populate the "assign to" dropdown when creating tasks.
const getUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "teamlead") {
      filter.department = req.user.department; // ignore any department query param
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select("-password") // never send password hashes to the frontend
      .populate("department", "name")
      .populate("team", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("department", "name")
      .populate("team", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/users/:id
// @desc   Admin updates a user (assign department/team, change role, activate/deactivate)
// Note: password updates are intentionally NOT handled here — keep that a separate
// "change password" flow later so it's not accidentally overwritten.
const updateUser = async (req, res) => {
  try {
    const { name, email, role, department, team, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, team, isActive },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/users/:id
// @desc   Admin deletes a user. In practice, deactivating (isActive: false) via
// updateUser is usually safer than a hard delete, since reports reference employees.
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };