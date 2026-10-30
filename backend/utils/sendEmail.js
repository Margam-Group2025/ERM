
const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail({ to, subject, text, html }) {
  if (!resend) {
    console.error("RESEND_API_KEY is missing");
    return { success: false };
  }

  if (!to) {
    console.error("Recipient email is missing");
    return { success: false };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      ...(html ? { html } : {}),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return { success: false };
    }

    console.log("Email accepted:", result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Email failed:", error.message);
    return { success: false };
  }
}

module.exports = { sendEmail };

