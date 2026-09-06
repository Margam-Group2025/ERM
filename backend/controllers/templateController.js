const ReportTemplate = require("../models/ReportTemplate");

// @route  POST /api/templates
// @desc   Admin creates a report template for a department + reportType
const createTemplate = async (req, res) => {
  try {
    const { department, reportType, role, fields } = req.body;
    const templateRole = role || "employee";

    if (!department || !reportType || !fields || !fields.length) {
      return res.status(400).json({
        message: "department, reportType and at least one field are required",
      });
    }

    const existing = await ReportTemplate.findOne({ department, reportType, role: templateRole });
    if (existing) {
      return res.status(400).json({
        message:
          "A template already exists for this department + report type + role. Use update instead.",
      });
    }

    const template = await ReportTemplate.create({
      department,
      reportType,
      role: templateRole,
      fields,
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/templates
// @desc   Get all templates, or filter with ?department=<id>&reportType=daily
const getTemplates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.reportType) filter.reportType = req.query.reportType;
    if (req.query.role) filter.role = req.query.role;

    const templates = await ReportTemplate.find(filter)
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/templates/active?department=<id>&reportType=daily&role=employee
// @desc   What the report-filing screen calls — gets the one active template
// for a department + report type + role (Admin can define a different form
// for Employees vs Team Leads in the same department).
const getActiveTemplate = async (req, res) => {
  try {
    const { department, reportType, role } = req.query;
    const templateRole = role || "employee";

    if (!department || !reportType) {
      return res.status(400).json({ message: "department and reportType are required" });
    }

    const template = await ReportTemplate.findOne({
      department,
      reportType,
      role: templateRole,
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({
        message: "No active template found for this department/report type/role yet",
      });
    }

    res.status(200).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/templates/:id
// @desc   Admin edits a template's fields (e.g. add/remove/reorder fields)
const updateTemplate = async (req, res) => {
  try {
    const { fields, isActive } = req.body;

    const template = await ReportTemplate.findByIdAndUpdate(
      req.params.id,
      { fields, isActive },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/templates/:id
const deleteTemplate = async (req, res) => {
  try {
    const template = await ReportTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.status(200).json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getActiveTemplate,
  updateTemplate,
  deleteTemplate,
};