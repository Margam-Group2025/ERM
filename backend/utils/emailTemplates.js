
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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
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
  const name = escapeHtml(submitterName || "A user");
  const recipient = escapeHtml(recipientName || "Team");
  const type = escapeHtml(reportType || "Report");
  const date = escapeHtml(formatDate(reportDate));
  const department = escapeHtml(departmentName || "Not specified");
  const group = escapeHtml(groupName || "Not specified");
  const frontendUrl = escapeHtml(
    process.env.FRONTEND_URL || ""
  );

  const subject = `New ${type} Report Submitted - ERM`;

  const text = [
    `Hello ${recipient},`,
    "",
    `${name} submitted a ${type} report.`,
    `Report Date: ${date}`,
    `Department: ${department}`,
    `Group: ${group}`,
    "",
    "Please log in to ERM to review the report.",
    process.env.FRONTEND_URL || "",
    "",
    "Regards,",
    "ERM Team",
    "Margam Group",
  ].join("\n");

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#263238;">
    <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

      <div style="background:#155e45;padding:25px 30px;color:#ffffff;">
        <h1 style="margin:0;font-size:24px;">ERM Notifications</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#e0f2e9;">
          Employee Report Management System
        </p>
      </div>

      <div style="padding:30px;">
        <h2 style="margin:0 0 18px;color:#155e45;font-size:21px;">
          New Report Submitted
        </h2>

        <p style="font-size:15px;line-height:1.6;">
          Hello <strong>${recipient}</strong>,
        </p>

        <p style="font-size:15px;line-height:1.6;color:#4b5563;">
          A new report has been submitted and is waiting for your review.
        </p>

        <div style="background:#f8faf9;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin:22px 0;">
          <h3 style="margin:0 0 16px;color:#155e45;font-size:16px;">
            Report Details
          </h3>

          <p style="margin:10px 0;font-size:14px;">
            <strong>Submitted By:</strong> ${name}
          </p>
          <p style="margin:10px 0;font-size:14px;">
            <strong>Report Type:</strong> ${type}
          </p>
          <p style="margin:10px 0;font-size:14px;">
            <strong>Report Date:</strong> ${date}
          </p>
          <p style="margin:10px 0;font-size:14px;">
            <strong>Department:</strong> ${department}
          </p>
          <p style="margin:10px 0;font-size:14px;">
            <strong>Group:</strong> ${group}
          </p>
        </div>

        <p style="font-size:14px;line-height:1.6;color:#4b5563;">
          Please log in to the ERM system to review the submitted report.
        </p>

        ${
          frontendUrl
            ? `<div style="text-align:center;margin:28px 0;">
                <a href="${frontendUrl}" style="display:inline-block;background:#155e45;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:7px;font-size:14px;font-weight:bold;">
                  Open ERM Dashboard
                </a>
              </div>`
            : ""
        }

        <p style="font-size:14px;color:#4b5563;line-height:1.6;">
          Regards,<br/>
          <strong>ERM Team</strong><br/>
          Margam Group
        </p>
      </div>

      <div style="background:#f8faf9;padding:16px 25px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#6b7280;">
          This is an automated notification from Margam Group ERM.
        </p>
      </div>

    </div>
  </body>
  </html>
  `;

  return { subject, text, html };
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
