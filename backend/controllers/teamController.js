const Team = require("../models/Team");

// @route  POST /api/teams
// @desc   Admin creates a new team under a department
const createTeam = async (req, res) => {
  try {
    const { name, department, teamLead } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: "Team name and department are required" });
    }

    const team = await Team.create({ name, department, teamLead });
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/teams
// @desc   Get all teams (optionally filter by department: /api/teams?department=<id>)
const getTeams = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;

    const teams = await Team.find(filter)
      .populate("department", "name")
      .populate("teamLead", "name employeeId")
      .sort({ name: 1 });

    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/teams/:id
// @desc   Admin updates a team (e.g. assign a Team Lead)
const updateTeam = async (req, res) => {
  try {
    const { name, department, teamLead } = req.body;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, department, teamLead },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTeam, getTeams, updateTeam, deleteTeam };