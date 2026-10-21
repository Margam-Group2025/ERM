const ExcelJS = require("exceljs");
const Report = require("../models/Report");
const User = require("../models/User");
const { andFilters, teamLeadReportScope } = require("../utils/groupScope");

// @route  GET /api/reports/export
// @desc   Admin filters any department and downloads reports as .xlsx.
// Team Lead can also export, but only their OWN department's reports.
// Query params: department, team (group), employee, reportType, status,
// adminStatus, startDate, endDate
const exportReportsToExcel = async (req, res) => {
  try {
    const { employee, reportType, status, startDate, endDate } = req.query;

    const filter = {};
    const extra = [];
    let scope = {};

    const wantsOwnOnly =
      req.user.role === "employee" ||
      (req.user.role === "teamlead" && req.query.onlyMine === "true");

    if (wantsOwnOnly) {
      // own reports only — the ?employee param is ignored here
      filter.employee = req.user._id;
    } else {
      if (req.user.role === "teamlead") {
        // own department, or only their own group in a department with groups
        scope = await teamLeadReportScope(req.user);
      } else {
        // Admin-only filters
        if (req.query.department) filter.department = req.query.department;
        if (req.query.team) {
          const inGroup = await User.find({ team: req.query.team }).select("_id");
          extra.push({ employee: { $in: inGroup.map((u) => u._id) } });
        }
        if (req.query.adminStatus) {
          filter["adminReview.status"] =
            req.query.adminStatus === "none" ? { $in: ["none", null] } : req.query.adminStatus;
        }
      }
      if (employee) filter.employee = employee;
    }

    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) filter.reportDate.$gte = new Date(startDate);
      if (endDate) filter.reportDate.$lte = new Date(endDate);
    }

    const reports = await Report.find(andFilters(scope, filter, ...extra))
      .populate({
        path: "employee",
        select: "name employeeId role team",
        populate: { path: "team", select: "name" },
      })
      .populate("department", "name")
      .populate("reportTemplate", "fields")
      .sort({ reportDate: -1 });

    if (reports.length === 0) {
      return res.status(404).json({ message: "No reports match this filter" });
    }

    // Every department/role has different fields (data is a Mixed object),
    // so collect the UNION of keys across the filtered reports. Headings use
    // the human label from the template each report was filled with, not the
    // raw key (e.g. "CVs Screened Today" instead of "cvs_screened_today").
    const dynamicKeys = new Set();
    const labelByKey = {};
    reports.forEach((r) => {
      Object.keys(r.data || {}).forEach((key) => dynamicKeys.add(key));
      (r.reportTemplate?.fields || []).forEach((f) => {
        if (!labelByKey[f.key]) labelByKey[f.key] = f.label;
      });
    });
    const dynamicKeysArr = Array.from(dynamicKeys);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reports");

    // fixed columns first, then one column per dynamic field. Column ids are
    // index-based (dyn_0, dyn_1...) so labels containing dots or symbols
    // can never confuse ExcelJS's key handling.
    sheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Role", key: "role", width: 12 },
      { header: "Department", key: "department", width: 18 },
      { header: "Group", key: "group", width: 14 },
      { header: "Report Type", key: "reportType", width: 12 },
      { header: "Report Date", key: "reportDate", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Admin Review", key: "adminReview", width: 14 },
      ...dynamicKeysArr.map((key, i) => ({
        header: labelByKey[key] || key,
        key: `dyn_${i}`,
        width: 24,
      })),
    ];

    // bold header row
    sheet.getRow(1).font = { bold: true };

    reports.forEach((r) => {
      const row = {
        employeeId: r.employee?.employeeId || "",
        employeeName: r.employee?.name || "",
        role: r.employee?.role === "teamlead" ? "Team Lead" : "Employee",
        department: r.department?.name || "",
        group: r.employee?.team?.name || "",
        reportType: r.reportType,
        reportDate: r.reportDate.toISOString().split("T")[0],
        status: r.status,
        adminReview:
          r.adminReview?.status && r.adminReview.status !== "none" ? r.adminReview.status : "",
      };
      dynamicKeysArr.forEach((key, i) => {
        const v = r.data?.[key];
        row[`dyn_${i}`] = v === undefined || v === null ? "" : v;
      });
      sheet.addRow(row);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=reports-export.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { exportReportsToExcel };