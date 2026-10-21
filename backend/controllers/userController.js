const User = require("../models/User");
const Team = require("../models/Team");
const { andFilters, teamLeadUserScope } = require("../utils/groupScope");

// @route  GET /api/users
// @desc   Admin views all users (optionally filter by department/role via query).
// Team Lead can also call this, but is locked to their own department —
// they need it to populate the "assign to" dropdown when creating tasks.
const getUsers = async (req, res) => {
  try {
    const filter = {};
    let scope = {};

    if (req.user.role === "teamlead") {
      // own department — or only their own group's employees in a department
      // with groups. Query params can narrow this, never widen it.
      scope = await teamLeadUserScope(req.user);
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(andFilters(scope, filter))
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wasLead = user.role === "teamlead";
    const nextRole = role !== undefined ? role : user.role;
    const nextDept = department !== undefined ? department : user.department;
    const deptChanged =
      department !== undefined && String(department) !== String(user.department);

    // ---- group (team) rules ----
    let nextTeam = user.team;

    if (team !== undefined) {
      // a Team Leader's group is managed from the group itself (PUT /api/teams/:id)
      // so Team.teamLead and User.team can never drift apart
      if (nextRole === "teamlead") {
        return res.status(400).json({
          message: "Team Leader ka group, group edit karke set hota hai (Groups page se)",
        });
      }
      if (team) {
        const targetTeam = await Team.findById(team);
        if (!targetTeam) {
          return res.status(404).json({ message: "Group not found" });
        }
        if (String(targetTeam.department) !== String(nextDept)) {
          return res.status(400).json({ message: "Ye group is user ke department ka nahi hai" });
        }
      }
      nextTeam = team || null;
    } else if (deptChanged) {
      nextTeam = null; // the old group belongs to the old department
    }

    // a Team Leader who stops leading (demoted, or moved to another department)
    // frees the group's leader slot
    if (wasLead && (nextRole !== "teamlead" || deptChanged)) {
      await Team.updateMany({ teamLead: user._id }, { $set: { teamLead: null } });
    }

    // an employee promoted to Team Leader: lead their group only if it has no leader yet
    if (!wasLead && nextRole === "teamlead" && nextTeam) {
      const currentTeam = await Team.findById(nextTeam);
      if (currentTeam && !currentTeam.teamLead) {
        currentTeam.teamLead = user._id;
        await currentTeam.save();
      } else {
        nextTeam = null; // group already has a leader; assign one from the Groups page
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;
    user.role = nextRole;
    user.department = nextDept;
    user.team = nextTeam;
    await user.save();

    const result = user.toObject();
    delete result.password;
    res.status(200).json(result);
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