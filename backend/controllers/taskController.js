
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendEmail } = require("../utils/sendEmail");
const { taskAssignedEmail } = require("../utils/emailTemplates");
const {
  andFilters,
  departmentUsesGroups,
  teamLeadUserScope,
} = require("../utils/groupscope");

// @route  POST /api/tasks
// @desc   Admin or Team Leader assigns a task
const createTask = async (req, res) => {
  try {
    console.log("========== CREATE TASK API CALLED ==========");

    const { title, description, assignedTo, priority, deadline } = req.body;

    console.log("Task request:", {
      title,
      assignedTo,
      assignedByRole: req.user?.role,
    });

    if (!title || !assignedTo) {
      return res.status(400).json({
        message: "title and assignedTo are required",
      });
    }

    // Find the person receiving the task, including department and group.
    const assignee = await User.findById(assignedTo)
      .populate("department", "name")
      .populate("team", "name");

    if (!assignee) {
      console.log("TASK ERROR: Assignee not found");

      return res.status(404).json({
        message: "Assignee not found",
      });
    }

    console.log("TASK ASSIGNEE:", {
      name: assignee.name,
      email: assignee.email || "(email missing)",
      role: assignee.role,
    });

    // Team Leader can assign tasks only within their permitted scope.
    if (req.user.role === "teamlead") {
      const allowed = await User.exists(
        andFilters(
          await teamLeadUserScope(req.user),
          { _id: assignedTo }
        )
      );

      if (!allowed) {
        return res.status(403).json({
          message:
            "Aap sirf apne group/department ke members ko task assign kar sakte ho",
        });
      }
    }

    // Create the task.
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      department: assignee.department?._id || assignee.department,
      priority,
      deadline,
    });

    // Create in-app notification.
    await Notification.create({
      recipient: assignedTo,
      message: `New task assigned: "${title}"`,
      type: "task_assigned",
      relatedId: task._id,
    });

    // Send email to the actual assignee.
    if (!assignee.email || !assignee.email.trim()) {
      console.error(
        "TASK EMAIL SKIPPED: Assignee has no email address in the database."
      );
    } else {
      try {
        const email = taskAssignedEmail({
        employeeName: assignee.name,
        assignedByName: req.user.name,
        title,
        description,
        priority,
        deadline,
        departmentName: assignee.department?.name,
        groupName: assignee.team?.name,
       });
        console.log("TASK EMAIL DEBUG:", {
          recipient: assignee.email,
          subject: email.subject,
        });

        const result = await sendEmail({
          to: assignee.email,
          ...email,
        });

        console.log("TASK EMAIL RESULT:", result);

        if (!result?.success) {
          console.error(
            "TASK EMAIL NOT SENT. Check Resend configuration and logs."
          );
        }
      } catch (emailError) {
        // Do not undo a successfully created task if email fails.
        console.error(
          "TASK EMAIL EXCEPTION:",
          emailError.message
        );
      }
    }

    return res.status(201).json(task);
  } catch (err) {
    console.error("CREATE TASK ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

// @route GET /api/tasks/mine
// @desc Any logged-in user views tasks assigned to them
const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user._id,
    })
      .populate("assignedBy", "name employeeId")
      .sort({ deadline: 1 });

    return res.status(200).json(tasks);
  } catch (err) {
    console.error("GET MY TASKS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// @route GET /api/tasks/team
// @desc Team Leader/Admin views assigned tasks
const getTeamTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "teamlead") {
      filter.department = req.user.department;

      if (await departmentUsesGroups(req.user.department)) {
        const members = await User.find(
          await teamLeadUserScope(req.user)
        ).select("_id");

        filter.assignedTo = {
          $in: members.map((member) => member._id),
        };
      }
    } else if (req.user.role === "admin") {
      if (req.query.department) {
        filter.department = req.query.department;
      }

      if (req.query.assignedToRole === "teamlead") {
        const teamLeads = await User.find({
          role: "teamlead",
        }).select("_id");

        filter.assignedTo = {
          $in: teamLeads.map((lead) => lead._id),
        };
      }
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name employeeId role email")
      .populate("department", "name")
      .sort({ deadline: 1 });

    return res.status(200).json(tasks);
  } catch (err) {
    console.error("GET TEAM TASKS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/tasks/:id/status
// @desc Task owner updates their own task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["not_started", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only update your own tasks",
      });
    }

    task.status = status;
    await task.save();

    return res.status(200).json(task);
  } catch (err) {
    console.error("UPDATE TASK STATUS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  getTeamTasks,
  updateTaskStatus,
};
