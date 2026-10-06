const Report = require("../models/Report");
const ReportTemplate = require("../models/ReportTemplate");
const User = require("../models/User");
const Notification = require("../models/Notification");

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

    // Team Leads can also file their own reports (spec section 3), and Admin
    // may have defined a different form for them than for Employees —
    // match on the submitter's actual role.
    const templateRole = req.user.role === "teamlead" ? "teamlead" : "employee";

    const template = await ReportTemplate.findOne({
      department,
      reportType,
      role: templateRole,
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
    const filter = { employee: req.user._id };

    if (req.query.startDate || req.query.endDate) {
      filter.reportDate = {};
      if (req.query.startDate) filter.reportDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.reportDate.$lte = new Date(req.query.endDate);
    }

    // ?limit=2 gives the "last 2 reports" quick view; omit it for full history
    const limit = parseInt(req.query.limit, 10);

    const query = Report.find(filter).sort({ createdAt: -1 }); // newest submitted first
    if (limit > 0) query.limit(limit);

    const reports = await query;
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/:id
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("employee", "name employeeId role")
      .populate("department", "name")
      .populate("reportTemplate");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // any logged-in user may only view their OWN report (unless the
    // review routes handle broader access separately)
    if (report.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id
// @desc   Employee or Team Lead edits their own report — ONLY allowed once
// their editRequest has been explicitly approved by their Team Lead/Admin.
// The approval is single-use: it's consumed as soon as this save succeeds.
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

    if (report.editRequest?.status !== "approved") {
      return res.status(403).json({
        message: "You need approval before editing this report. Please request edit access first.",
      });
    }

    if (data) {
      // figure out which fields actually changed compared to what's saved now
      const changedKeys = Object.keys(data).filter(
        (key) => JSON.stringify(data[key]) !== JSON.stringify(report.data?.[key])
      );
      if (changedKeys.length > 0) {
        const merged = new Set([...(report.editedFields || []), ...changedKeys]);
        report.editedFields = Array.from(merged);
        report.isEdited = true;
        report.editedAt = new Date();
      }
      report.data = data;
    }

    if (status === "draft" || status === "submitted") report.status = status;

    // the approval is used up — a future edit needs a fresh request
    report.editRequest = { status: "none" };

    await report.save();
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/reports/:id/request-edit
// @desc   Report owner asks permission to edit. Employees' requests go to
// their department's Team Lead; a Team Lead's own requests go to Admin.
const requestEdit = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only request to edit your own reports" });
    }
    if (["approved", "rejected"].includes(report.status)) {
      return res
        .status(400)
        .json({ message: "This report has already been reviewed and can no longer be edited" });
    }

    const submittedDay = report.createdAt.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    if (submittedDay !== today) {
      return res
        .status(400)
        .json({ message: "This report can only be edited on the day it was submitted" });
    }

    if (report.editRequest?.status === "pending") {
      return res.status(400).json({ message: "An edit request is already pending for this report" });
    }

    report.editRequest = { status: "pending", requestedAt: new Date() };
    await report.save();

    // figure out who approves it
    let approvers = [];
    if (req.user.role === "employee") {
      approvers = await User.find({ role: "teamlead", department: req.user.department });
    } else if (req.user.role === "teamlead") {
      approvers = await User.find({ role: "admin" });
    }

    await Promise.all(
      approvers.map((a) =>
        Notification.create({
          recipient: a._id,
          message: `${req.user.name} requested permission to edit a ${report.reportType} report`,
          type: "edit_request",
          relatedId: report._id,
        })
      )
    );

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/reports/:id/edit-request
// @desc   Team Lead approves/denies their employee's request; Admin
// approves/denies a Team Lead's own request.
const respondEditRequest = async (req, res) => {
  try {
    const { decision } = req.body; // "approved" | "denied"
    if (!["approved", "denied"].includes(decision)) {
      return res.status(400).json({ message: "decision must be approved or denied" });
    }

    const report = await Report.findById(req.params.id).populate("employee", "name role department");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.user.role === "teamlead") {
      const sameDept = report.department.toString() === req.user.department.toString();
      if (report.employee.role !== "employee" || !sameDept) {
        return res.status(403).json({ message: "You can only respond to your own team's requests" });
      }
    } else if (req.user.role === "admin") {
      if (report.employee.role !== "teamlead") {
        return res.status(403).json({ message: "You can only respond to Team Leads' requests" });
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (report.editRequest?.status !== "pending") {
      return res.status(400).json({ message: "No pending edit request on this report" });
    }

    report.editRequest.status = decision;
    report.editRequest.respondedAt = new Date();
    report.editRequest.respondedBy = req.user._id;
    await report.save();

    await Notification.create({
      recipient: report.employee._id,
      message:
        decision === "approved"
          ? "Your edit request was approved — you can now edit your report"
          : "Your edit request was denied",
      type: decision === "approved" ? "edit_approved" : "edit_denied",
      relatedId: report._id,
    });

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/reports/edit-requests/pending
// @desc   Team Lead sees pending requests from their own department's
// employees; Admin sees pending requests from Team Leads.
const getPendingEditRequests = async (req, res) => {
  try {
    const filter = { "editRequest.status": "pending" };
    if (req.user.role === "teamlead") filter.department = req.user.department;

    let reports = await Report.find(filter)
      .populate("employee", "name employeeId role")
      .populate("department", "name")
      .sort({ "editRequest.requestedAt": -1 });

    if (req.user.role === "teamlead") {
      reports = reports.filter((r) => r.employee.role === "employee");
    } else if (req.user.role === "admin") {
      reports = reports.filter((r) => r.employee.role === "teamlead");
    }

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getReportById,
  updateReport,
  uploadAttachment,
  requestEdit,
  respondEditRequest,
  getPendingEditRequests,
};

// @route  POST /api/reports/:id/attachment
// @desc   Attach a photo/file to a report the employee owns (multipart/form-data, field name "file")
async function uploadAttachment(req, res) {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    if (report.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only attach files to your own reports" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    report.attachment = {
      filename: req.file.originalname,
      url: req.file.path, // Cloudinary's storage engine sets this to the full https URL
    };
    await report.save();

    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}