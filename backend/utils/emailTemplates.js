
const formatDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN");
};

const makeEmail = (subject, lines) => ({
  subject,
  text: lines
    .filter((line) => line !== null && line !== undefined)
    .join("\n"),
});

// Task assigned email
function taskAssignedEmail({
  employeeName,
  assignedByName,
  title,
  description,
  priority,
  deadline,
  departmentName,
  groupName,
}) {
  return makeEmail(
    `New Task Assigned - ERM${departmentName ? ` - ${departmentName}` : ""}`,
    [
      "Dear Admin,",
      "",
      "A new task has been assigned in the ERM system.",
      "",
      "TASK DETAILS",
      "------------------------------",
      `Department: ${departmentName || "Not specified"}`,
      `Group: ${groupName || "Not specified"}`,
      `Task Title: ${title || "Not specified"}`,
      `Assigned To: ${employeeName || "Not specified"}`,
      `Assigned By: ${assignedByName || "Admin/Team Leader"}`,
      `Priority: ${priority || "Not specified"}`,
      `Deadline: ${formatDate(deadline)}`,
      description ? `Description: ${description}` : null,
      "",
      "Please log in to the ERM system for more details.",
      process.env.FRONTEND_URL || "",
      "",
      "Regards,",
      "ERM Team",
      "Margam Group",
    ]
  );
}

// Report submitted email
function reportSubmittedEmail({
  recipientName,
  submitterName,
  reportType,
  reportDate,
  departmentName,
  groupName,
}) {
  return makeEmail(`Report Submitted - ${reportType}`, [
    `Hello ${recipientName || "Reviewer"},`,
    "",
    `${submitterName || "A user"} submitted a ${reportType} report.`,
    `Report date: ${formatDate(reportDate)}`,
    departmentName ? `Department: ${departmentName}` : null,
    groupName ? `Group: ${groupName}` : null,
    "",
    "Please log in to ERM to review the report.",
    process.env.FRONTEND_URL || "",
  ]);
}

// Report review email
function reportReviewEmail({
  authorName,
  reportType,
  decision,
  comment,
  departmentName,
  groupName,
  waitingForAdmin = false,
}) {
  const decisionText = {
    approved: "approved",
    rejected: "rejected",
    sent_back: "sent back for correction",
  }[decision] || decision;

  return makeEmail(`Your ${reportType} Report - ${decisionText}`, [
    `Hello ${authorName || "Employee"},`,
    "",
    `Your ${reportType} report has been ${decisionText}.`,
    departmentName ? `Department: ${departmentName}` : null,
    groupName ? `Group: ${groupName}` : null,
    comment ? `Review comment: ${comment}` : null,
    waitingForAdmin
      ? "Your report is now waiting for the Admin's final review."
      : null,
    "",
    "Please log in to ERM for details.",
    process.env.FRONTEND_URL || "",
  ]);
}

// Admin final review email
function adminReviewEmail({
  adminName,
  submitterName,
  reportType,
  reportDate,
  departmentName,
  groupName,
}) {
  return makeEmail("Report Waiting for Admin Review", [
    `Hello ${adminName || "Admin"},`,
    "",
    "A report is waiting for your final review.",
    "",
    `Submitted By: ${submitterName || "Not specified"}`,
    `Report Type: ${reportType || "Not specified"}`,
    `Report Date: ${formatDate(reportDate)}`,
    `Department: ${departmentName || "Not specified"}`,
    `Group: ${groupName || "Not specified"}`,
    "",
    "Please log in to ERM to review the report.",
    process.env.FRONTEND_URL || "",
    "",
    "Regards,",
    "ERM Team",
    "Margam Group",
  ]);
}

module.exports = {
  taskAssignedEmail,
  reportSubmittedEmail,
  reportReviewEmail,
  adminReviewEmail,
};
