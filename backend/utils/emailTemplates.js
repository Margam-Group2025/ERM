
const formatDate = (value) => {
  if (!value) return "Not specified";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN");
};

const makeEmail = (subject, lines) => ({
  subject,
  text: lines.filter((line) => line !== null && line !== undefined).join("\n"),
});

function taskAssignedEmail({
  employeeName,
  title,
  description,
  priority,
  deadline,
  departmentName,
  groupName,
}) {
  return makeEmail("New Task Assigned - ERM", [
    `Hello ${employeeName || "Employee"},`,
    "",
    "A new task has been assigned to you.",
    `Task: ${title}`,
    description ? `Description: ${description}` : null,
    priority ? `Priority: ${priority}` : null,
    `Deadline: ${formatDate(deadline)}`,
    departmentName ? `Department: ${departmentName}` : null,
    groupName ? `Group: ${groupName}` : null,
    "",
    "Please log in to ERM to view your task.",
    process.env.FRONTEND_URL || "",
  ]);
}

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
  return makeEmail("New Task Assigned - ERM" + (departmentName ? ` - ${departmentName}` : ""), [
    "Dear Admin,",
    "",
    "A new task has been assigned in the ERM system.",
    "",
    "TASK DETAILS",
    "------------------------------",
    `Department: ${departmentName || "Not specified"}`,
    `Group: ${groupName || "Not specified"}`,
    `Task Title: ${title}`,
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
  ]);
}


module.exports = {
  taskAssignedEmail,
  reportSubmittedEmail,
  reportReviewEmail,
  adminReviewEmail,
};
