const Report = require("../models/Report");
const ReportTemplate = require("../models/ReportTemplate");

// @route  POST /api/reports
// @desc   Employee (or Team Lead) submits or drafts a report.
// Validates the submitted `data` against the department's active template
// so a report can never be saved with fields that don't belong to it.
const createReport = async (req, res) => {
  try {
    const { reportType, reportDate, data, status } = req.body;
    const employee = req.user._id;
    const department = req.user.department;

    if (!department) {
      return res.status(400).json({ message: "Your account has no department assigned" });
    }
    if (!reportType || !reportDate || !data) {
      return res.status(400).json({ message: "reportType, reportDate and data are required" });
    }

    const template = await ReportTemplate.findOne({
      department,
      reportType,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({ message: "No active template for your department/report type" });
    }

    // check required fields from the template are actually filled in `data`
    const missing = template.fields
      .filter((f) => f.required && (data[f.key] === undefined || data[f.key] === ""))
      .map((f) => f.label);

    // drafts are allowed to be incomplete, submitted reports are not
    const finalStatus = status === "draft" ? "draft" : "submitted";
    if (finalStatus === "submitted" && missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const report = await Report.create({
      employee,
      department,
      team: req.user.team,
      reportTemplate: template._id,
      reportType,
      reportDate,
      data,
      status: finalStatus,
    });

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/mine
// @desc   Logged-in user's own report history
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ employee: req.user._id }).sort({ reportDate: -1 });
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/:id
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("employee", "name employeeId")
      .populate("department", "name")
      .populate("reportTemplate");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // an employee may only view their own report; teamlead/admin handled in review routes
    if (
      req.user.role === "employee" &&
      report.employee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id
// @desc   Employee edits their own draft, or a report sent back for correction
const updateReport = async (req, res) => {
  try {
    const { data, status } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own reports" });
    }

    if (!["draft", "sent_back"].includes(report.status)) {
      return res.status(400).json({ message: "Only draft or sent-back reports can be edited" });
    }

    if (data) report.data = data;
    if (status === "draft" || status === "submitted") report.status = status;

    await report.save();
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createReport, getMyReports, getReportById, updateReport };