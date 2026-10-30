
require("dotenv").config();

const { sendEmail } = require("./utils/sendEmail");

async function testEmail() {
  console.log("Sending test email...");

  const result = await sendEmail({
    to: process.env.TEST_EMAIL,
    subject: "ERM - Test Email",
    text: `Hello!

This is a test email from your local ERM project.

If you received this email, your Resend email configuration is working.

Regards,
ERM System`,
  });

  console.log("Test result:", result);
}

testEmail();
