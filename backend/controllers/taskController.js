const Task = require("../models/Task");
const User = require("../models/User");

// @route  POST /api/tasks
// @desc   Team Lead assigns a task to an employee in their department, OR
// Admin assigns a task to any Team Lead. The task's department is taken
// from the PERSON RECEIVING the task (not the assigner), since Admin has
// no department of their own.
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "title and assignedTo are required" });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ message: "Assignee not found" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      department: assignee.department, // department of whoever is RECEIVING the task
      priority,
      deadline,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/tasks/mine
// @desc   Any logged-in user (Employee or Team Lead) views tasks assigned to them
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name employeeId")
      .sort({ deadline: 1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/tasks/team
// @desc   Team Lead views tasks THEY assigned within their own department.
// Admin views tasks assigned to Team Leads across any/all departments
// (optionally filtered by department or status) — this is how Admin checks
// whether an assigned Team Lead task is complete.
const getTeamTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "teamlead") {
      filter.department = req.user.department; // locked to their own department
    } else if (req.user.role === "admin") {
      if (req.query.department) filter.department = req.query.department;
      if (req.query.assignedToRole === "teamlead") {
        // Admin's "tasks I assigned to team leads" view
        const teamLeads = await User.find({ role: "teamlead" }).select("_id");
        filter.assignedTo = { $in: teamLeads.map((t) => t._id) };
      }
    }

    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name employeeId role")
      .populate("department", "name")
      .sort({ deadline: 1 });

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/tasks/:id/status
// @desc   Task owner (Employee or Team Lead) updates their own task's status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["not_started", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only update your own tasks" });
    }

    task.status = status;
    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTask, getMyTasks, getTeamTasks, updateTaskStatus };