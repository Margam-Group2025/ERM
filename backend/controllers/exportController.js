const ExcelJS = require("exceljs");
const Report = require("../models/Report");

// @route  GET /api/reports/export
// @desc   Admin filters any department and downloads reports as .xlsx.
// Team Lead can also export, but only their OWN department's reports.
// Query params: department, employee, reportType, status, startDate, endDate
const exportReportsToExcel = async (req, res) => {
  try {
    const { employee, reportType, status, startDate, endDate } = req.query;

    const filter = {};

    if (req.user.role === "employee") {
      // an employee can only ever export their OWN reports
      filter.employee = req.user._id;
    } else if (req.user.role === "teamlead") {
      filter.department = req.user.department; // locked, ignores query param
      if (req.query.onlyMine === "true") filter.employee = req.user._id;
    } else if (req.query.department) {
      filter.department = req.query.department;
    }

    if (employee && req.user.role !== "employee") filter.employee = employee;
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.reportDate = {};
      if (startDate) filter.reportDate.$gte = new Date(startDate);
      if (endDate) filter.reportDate.$lte = new Date(endDate);
    }

    const reports = await Report.find(filter)
      .populate("employee", "name employeeId role")
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
      { header: "Report Type", key: "reportType", width: 12 },
      { header: "Report Date", key: "reportDate", width: 14 },
      { header: "Status", key: "status", width: 12 },
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
        reportType: r.reportType,
        reportDate: r.reportDate.toISOString().split("T")[0],
        status: r.status,
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