const Report = require("../models/Report");

// @route  GET /api/reports/team/all
// @desc   Team Lead views all reports from their OWN department only.
// Admin can view everything (optionally filtered via query params).
const getTeamReports = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "teamlead") {
      // hard rule: a Team Lead can only ever see their own department's reports
      filter.department = req.user.department;
    } else if (req.user.role === "admin") {
      if (req.query.department) filter.department = req.query.department;
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.reportType) filter.reportType = req.query.reportType;
    if (req.query.employee) filter.employee = req.query.employee;

    const reports = await Report.find(filter)
      .populate("employee", "name employeeId")
      .populate("department", "name")
      .sort({ createdAt: -1 }); // newest submitted report first

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id/review
// @desc   Team Lead (or Admin) approves, rejects, or sends back a report
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

    // Team Lead can only review reports from their own department
    if (
      req.user.role === "teamlead" &&
      report.department.toString() !== req.user.department.toString()
    ) {
      return res.status(403).json({ message: "You can only review your own department's reports" });
    }

    if (report.status !== "submitted") {
      return res.status(400).json({ message: "Only submitted reports can be reviewed" });
    }

    report.status = decision;
    report.reviewedBy = req.user._id;
    report.reviewComment = comment || "";
    report.reviewedAt = new Date();

    await report.save();
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTeamReports, reviewReport };