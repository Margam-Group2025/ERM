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
      .populate("employee", "name employeeId")
      .populate("department", "name")
      .sort({ reportDate: -1 });

    if (reports.length === 0) {
      return res.status(404).json({ message: "No reports match this filter" });
    }

    // Since every department has different fields (data is a Mixed object),
    // collect the UNION of all keys that appear across the filtered reports
    // so the Excel sheet has a column for every field actually used.
    const dynamicKeys = new Set();
    reports.forEach((r) => {
      Object.keys(r.data || {}).forEach((key) => dynamicKeys.add(key));
    });
    const dynamicKeysArr = Array.from(dynamicKeys);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reports");

    // fixed columns first, then one column per dynamic field key
    sheet.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Employee Name", key: "employeeName", width: 20 },
      { header: "Department", key: "department", width: 18 },
      { header: "Report Type", key: "reportType", width: 12 },
      { header: "Report Date", key: "reportDate", width: 14 },
      { header: "Status", key: "status", width: 12 },
      ...dynamicKeysArr.map((key) => ({ header: key, key, width: 20 })),
    ];

    // bold header row
    sheet.getRow(1).font = { bold: true };

    reports.forEach((r) => {
      sheet.addRow({
        employeeId: r.employee?.employeeId || "",
        employeeName: r.employee?.name || "",
        department: r.department?.name || "",
        reportType: r.reportType,
        reportDate: r.reportDate.toISOString().split("T")[0],
        status: r.status,
        ...r.data,
      });
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