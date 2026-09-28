const nodemailer = require("nodemailer");

/**
 * Creates a Nodemailer transporter if SMTP settings exist in environment variables.
 * Supports:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE
 * - Or EMAIL_SERVICE (e.g. 'gmail') with EMAIL_USER and EMAIL_PASS
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
  }

  if (process.env.EMAIL_SERVICE && user && pass) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Sends a 6-digit OTP verification email for account registration or password recovery.
 * If no SMTP credentials are configured, logs the OTP prominently to the terminal.
 */
async function sendOtpEmail({
  toEmail,
  otp,
  fullName,
  purpose = "password_reset",
}) {
  const transporter = getTransporter();
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    '"Lingkod Batas Security" <no-reply@lingkodbatas.ph>';

  const isRegistration = purpose === "registration";
  const is2FA = purpose === "login_2fa";

  const subject = isRegistration
    ? "Lingkod Batas — Verify Your Email for Account Registration"
    : is2FA
      ? "Lingkod Batas — Two-Factor Authentication (2FA) Code"
      : "Lingkod Batas — Password Reset Verification Code";

  const textContent = isRegistration
    ? `Hello ${fullName || "User"},\n\nYour 6-digit verification code to complete your Lingkod Batas account creation is:\n\n${otp}\n\nThis verification code expires in 10 minutes. If you did not create an account, please ignore this email.\n\n— Lingkod Batas Compliance Team`
    : is2FA
      ? `Hello ${fullName || "User"},\n\nYour 6-digit two-factor authentication (2FA) code to sign in to your Lingkod Batas account is:\n\n${otp}\n\nThis code expires in 10 minutes. If you did not attempt to sign in, please secure your account immediately.\n\n— Lingkod Batas Security Team`
      : `Hello ${fullName || "User"},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis verification code expires in 10 minutes. If you did not request a password reset, please ignore this email.\n\n— Lingkod Batas Compliance Team`;

  const leadText = isRegistration
    ? "Thank you for registering with Lingkod Batas. To finalize your account creation and verify your email ownership, enter the one-time verification code below:"
    : is2FA
      ? "A sign-in attempt was detected for your Lingkod Batas account. Enter the 6-digit two-factor authentication (2FA) code below to authorize your session:"
      : "We received a request to reset the password associated with your account. Use the one-time verification code below to authorize your password update:";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f2ecdf; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #dcd3c1; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(14,24,48,0.06); }
        .header { background-color: #0e1830; padding: 28px 32px; text-align: left; }
        .brand { color: #f2ecdf; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
        .subbrand { color: #c8a355; font-size: 11px; text-transform: uppercase; font-family: monospace; letter-spacing: 0.1em; margin-top: 4px; }
        .content { padding: 32px; color: #1c2230; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0e1830; }
        .otp-container { margin: 24px 0; background-color: #f7f4ee; border: 1px dashed #c8a355; border-radius: 8px; padding: 20px; text-align: center; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #722f37; margin: 0; }
        .otp-note { font-size: 11px; color: #647087; margin-top: 8px; font-family: monospace; text-transform: uppercase; }
        .footer { padding: 20px 32px; background: #faf7f0; border-top: 1px solid #eae2d1; font-size: 11.5px; color: #758195; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1 class="brand">Lingkod Batas</h1>
          <div class="subbrand">Philippine Labor Compliance Platform · RA 10173</div>
        </div>
        <div class="content">
          <p class="greeting">Hello ${fullName || "User"},</p>
          <p>${leadText}</p>
          
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="otp-note">Valid for 10 minutes · Single-use authorization</div>
          </div>

          <p style="font-size: 13px; color: #647087;">If you did not initiate this action, someone may have mistyped their email address. No further steps are needed, and you can safely disregard this message.</p>
        </div>
        <div class="footer">
          Lingkod Batas Compliance &amp; Review System · Data Privacy Act of 2012 Certified
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EMAIL] OTP verification email (${purpose}) dispatched to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, delivered: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email via SMTP:`, err.message);
      // Fallback to console output
    }
  }

  // Fallback / Development Logger
  console.log("\n==============================================================");
  console.log(`[LINGKOD BATAS] EMAIL OTP (${isRegistration ? "REGISTRATION" : is2FA ? "LOGIN 2FA" : "PASSWORD RESET"})`);
  console.log(`To: ${toEmail}`);
  console.log(`Recipient: ${fullName || "User"}`);
  console.log(`Verification Code (OTP): [ ${otp} ]`);
  console.log(`Expires in: 10 minutes`);
  console.log("==============================================================\n");

  return { success: true, delivered: false, simulated: true };
}

module.exports = {
  sendOtpEmail,
};
