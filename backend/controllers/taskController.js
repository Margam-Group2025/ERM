const Task = require("../models/Task");

// @route  POST /api/tasks
// @desc   Team Lead (or Admin) assigns a task to an employee in their department
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({ message: "title and assignedTo are required" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      department: req.user.department,
      priority,
      deadline,
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/tasks/mine
// @desc   Employee views tasks assigned to them
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
// @desc   Team Lead views all tasks they've assigned in their department
const getTeamTasks = async (req, res) => {
  try {
    const filter = { department: req.user.department };
    if (req.query.status) filter.status = req.query.status;

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name employeeId")
      .sort({ deadline: 1 });

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/tasks/:id/status
// @desc   Employee updates the status of their own task
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