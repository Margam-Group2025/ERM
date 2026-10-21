const Report = require("../models/Report");
const User = require("../models/User");
const Team = require("../models/Team");
const Notification = require("../models/Notification");
const {
  andFilters,
  departmentUsesGroups,
  teamLeadReportScope,
  teamLeadCanAccessUser,
} = require("../utils/groupScope");

// employee + their CURRENT group name, used by list views for the group badge
const EMPLOYEE_POPULATE = {
  path: "employee",
  select: "name employeeId role team",
  populate: { path: "team", select: "name" },
};

const notify = (recipients, message, type, relatedId) =>
  Promise.all(
    recipients.map((r) =>
      Notification.create({ recipient: r._id || r, message, type, relatedId })
    )
  );

// @route  GET /api/reports/team/all
// @desc   Team Lead views reports of their own department — or, in a
// department with groups (e.g. CRM), ONLY their own group's employees.
// Admin can view everything (filters: department, group, employee, type,
// status, adminStatus, date range, submitterRole).
const getTeamReports = async (req, res) => {
  try {
    const clauses = [];
    const filter = {};

    if (req.user.role === "teamlead") {
      // hard rule, enforced here no matter what query params are sent
      clauses.push(await teamLeadReportScope(req.user));
    } else if (req.user.role === "admin") {
      if (req.query.department) filter.department = req.query.department;

      // one group on its own (leave empty for the combined view)
      if (req.query.team) {
        const inGroup = await User.find({ team: req.query.team }).select("_id");
        clauses.push({ employee: { $in: inGroup.map((u) => u._id) } });
      }

      // Admin's final-review state: pending / approved / rejected / returned
      if (req.query.adminStatus) {
        filter["adminReview.status"] =
          req.query.adminStatus === "none" ? { $in: ["none", null] } : req.query.adminStatus;
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.reportType) filter.reportType = req.query.reportType;
    if (req.query.employee) filter.employee = req.query.employee;

    if (req.query.startDate || req.query.endDate) {
      filter.reportDate = {};
      if (req.query.startDate) filter.reportDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.reportDate.$lte = new Date(req.query.endDate);
    }
    clauses.push(filter);

    // split by who submitted it — an employee or a team lead
    if (req.query.submitterRole) {
      const usersWithRole = await User.find({ role: req.query.submitterRole }).select("_id");
      clauses.push({ employee: { $in: usersWithRole.map((u) => u._id) } });
    }

    const reports = await Report.find(andFilters(...clauses))
      .populate(EMPLOYEE_POPULATE)
      .populate("department", "name")
      .populate("reportTemplate", "fields") // labels for the headings
      .sort({ createdAt: -1 }); // newest submitted report first

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id/review
// @desc   Team Lead (or Admin) approves, rejects, or sends back a report.
// In a department with groups, a Team Lead's APPROVAL also puts the report in
// the Admin's final-review queue.
const reviewReport = async (req, res) => {
  try {
    const { decision, comment } = req.body; // decision: "approved" | "rejected" | "sent_back"

    if (!["approved", "rejected", "sent_back"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved, rejected, or sent_back" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const author = await User.findById(report.employee).select("name role department team");

    // A Team Lead may only review reports from their own department and — in
    // a department with groups — only from the employees of their own group.
    if (req.user.role === "teamlead") {
      const sameDept = report.department.toString() === req.user.department.toString();
      if (!sameDept || !(await teamLeadCanAccessUser(req.user, author))) {
        return res
          .status(403)
          .json({ message: "You can only review reports from your own group/department" });
      }
    }

    if (report.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted reports can be reviewed" });
    }

    const sendToAdmin =
      decision === "approved" &&
      req.user.role === "teamlead" &&
      (await departmentUsesGroups(report.department));

    report.status = decision;
    report.reviewedBy = req.user._id;
    report.reviewComment = comment || "";
    report.reviewedAt = new Date();
    if (sendToAdmin) report.adminReview = { status: "pending" };

    await report.save();

    if (sendToAdmin) {
      const admins = await User.find({ role: "admin" }).select("_id");
      const group = author?.team ? await Team.findById(author.team).select("name") : null;
      await notify(
        admins,
        `${author?.name || "An employee"}'s ${report.reportType} report${
          group ? ` (${group.name})` : ""
        } is ready for your final review`,
        "admin_review_pending",
        report._id
      );
    }

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/admin-review
// @desc   Admin's final-review queue: ONLY reports a Team Leader has already
// approved. ?status=pending (default) | approved | rejected | returned | all
// Filters: team (group), employee, department, reportType, startDate, endDate
const getAdminReviewQueue = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const filter = {};

    // "$ne: none" would also match old reports that have no adminReview at
    // all, so list the real states explicitly
    filter["adminReview.status"] =
      status === "all"
        ? { $in: ["pending", "approved", "rejected", "returned"] }
        : status;

    if (req.query.department) filter.department = req.query.department;
    if (req.query.reportType) filter.reportType = req.query.reportType;
    if (req.query.employee) filter.employee = req.query.employee;

    if (req.query.startDate || req.query.endDate) {
      filter.reportDate = {};
      if (req.query.startDate) filter.reportDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.reportDate.$lte = new Date(req.query.endDate);
    }

    const clauses = [filter];
    if (req.query.team) {
      const inGroup = await User.find({ team: req.query.team }).select("_id");
      clauses.push({ employee: { $in: inGroup.map((u) => u._id) } });
    }

    const reports = await Report.find(andFilters(...clauses))
      .populate(EMPLOYEE_POPULATE)
      .populate("department", "name")
      .populate("reportTemplate", "fields")
      .populate("reviewedBy", "name")
      // oldest waiting first; decided ones, most recent decision first
      .sort(status === "pending" ? { createdAt: 1 } : { "adminReview.reviewedAt": -1 });

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id/admin-review
// @desc   Admin's final decision on a Team-Leader-approved report.
//   approved -> final approval
//   rejected -> final rejection (comment required)
//   returned -> goes back to the EMPLOYEE for correction (comment required);
//               once corrected it comes back through the Team Leader again
const adminReviewReport = async (req, res) => {
  try {
    const { decision, comment } = req.body;

    if (!["approved", "rejected", "returned"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved, rejected, or returned" });
    }
    if (decision !== "approved" && !(comment && comment.trim())) {
      return res
        .status(400)
        .json({ message: "Reject ya return karte waqt comment likhna zaroori hai" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.adminReview?.status !== "pending") {
      return res.status(400).json({ message: "Ye report final review ke liye pending nahi hai" });
    }

    report.adminReview = {
      status: decision,
      comment: comment || "",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    if (decision === "rejected") {
      report.status = "rejected";
    } else if (decision === "returned") {
      report.status = "sent_back";
      report.editRequest = { status: "none" }; // start the correction with a clean slate
    }
    if (decision !== "approved") {
      // the employee sees this as the reviewer's comment on their report
      report.reviewComment = comment;
      report.reviewedBy = req.user._id;
      report.reviewedAt = new Date();
    }

    await report.save();

    // tell the author and their group's Team Leader(s)
    const author = await User.findById(report.employee).select("name team");
    const verb = { approved: "approved", rejected: "rejected", returned: "returned for correction" }[
      decision
    ];
    const suffix = decision !== "approved" ? `: "${comment}"` : "";

    const recipients = [{ _id: report.employee }];
    await notify(
      recipients,
      `Your ${report.reportType} report was ${verb} by Admin${suffix}`,
      "admin_review_decision",
      report._id
    );

    if (author?.team) {
      const leads = await User.find({
        role: "teamlead",
        department: report.department,
        team: author.team,
      }).select("_id");
      await notify(
        leads,
        `Admin ${verb} ${author.name}'s ${report.reportType} report${suffix}`,
        "admin_review_decision",
        report._id
      );
    }

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeamReports, reviewReport, getAdminReviewQueue, adminReviewReport };