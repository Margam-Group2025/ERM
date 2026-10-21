const Team = require("../models/Team");
const User = require("../models/User");
const Department = require("../models/Department");

const populated = (id) =>
  Team.findById(id)
    .populate("department", "name hasGroups")
    .populate("teamLead", "name employeeId");

// Makes `leadId` the single Team Leader of `team` (or clears it when null) and
// keeps Team.teamLead and User.team in sync. Returns an error message or null.
async function setTeamLead(team, leadId) {
  const prevLeadId = team.teamLead ? String(team.teamLead) : null;

  if (leadId) {
    const lead = await User.findById(leadId);
    if (!lead || lead.role !== "teamlead") {
      return "Selected user Team Leader nahi hai";
    }
    if (String(lead.department) !== String(team.department)) {
      return "Ye Team Leader is department ka nahi hai";
    }
    // one Team Leader leads one group: free the group they led before
    if (lead.team && String(lead.team) !== String(team._id)) {
      await Team.updateOne(
        { _id: lead.team, teamLead: lead._id },
        { $set: { teamLead: null } }
      );
    }
    await User.updateOne({ _id: lead._id }, { $set: { team: team._id } });
  }

  // the previous leader (if replaced or removed) no longer belongs to this group
  if (prevLeadId && prevLeadId !== String(leadId || "")) {
    await User.updateOne({ _id: prevLeadId, team: team._id }, { $set: { team: null } });
  }

  team.teamLead = leadId || null;
  await team.save();
  return null;
}

// @route  POST /api/teams
// @desc   Admin creates a group under a department that has groups enabled
const createTeam = async (req, res) => {
  try {
    const { name, department, teamLead } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: "Group name and department are required" });
    }

    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }
    if (!dept.hasGroups) {
      return res.status(400).json({
        message: "Is department mein Groups enabled nahi hain. Pehle department mein Groups ON karo.",
      });
    }

    let team;
    try {
      team = await Team.create({ name, department });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ message: "Is naam ka group is department mein already hai" });
      }
      throw err;
    }

    if (teamLead) {
      const error = await setTeamLead(team, teamLead);
      if (error) {
        await Team.findByIdAndDelete(team._id); // don't leave a half-set-up group behind
        return res.status(400).json({ message: error });
      }
    }

    res.status(201).json(await populated(team._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/teams
// @desc   Get all groups (optionally filter by department: /api/teams?department=<id>)
const getTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;

    const teams = await Team.find(filter)
      .populate("department", "name hasGroups")
      .populate("teamLead", "name employeeId")
      .sort({ name: 1 });

    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/teams/:id
// @desc   Admin renames a group and/or assigns, replaces or removes its Team Leader
//         (send teamLead: null to remove)
const updateTeam = async (req, res) => {
  try {
    const { name, department, teamLead } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (department !== undefined && String(department) !== String(team.department)) {
      return res.status(400).json({ message: "Group ka department change nahi ho sakta" });
    }

    if (name !== undefined && name.trim()) {
      team.name = name;
      try {
        await team.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(400).json({ message: "Is naam ka group is department mein already hai" });
        }
        throw err;
      }
    }

    if (teamLead !== undefined) {
      const error = await setTeamLead(team, teamLead || null);
      if (error) {
        return res.status(400).json({ message: error });
      }
    }

    res.status(200).json(await populated(team._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Group not found" });
    }

    const employeeCount = await User.countDocuments({ team: team._id, role: "employee" });
    if (employeeCount > 0) {
      return res.status(400).json({
        message: `Group mein ${employeeCount} employee hain — pehle unhe doosre group mein shift karo ya group se hata do`,
      });
    }

    await User.updateMany({ team: team._id }, { $set: { team: null } }); // the Team Leader
    await Team.findByIdAndDelete(team._id);

    res.status(200).json({ message: "Group deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, deleteTeam };