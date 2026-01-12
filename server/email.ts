import * as Brevo from '@getbrevo/brevo';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@loretta.health';
const FROM_NAME = process.env.FROM_NAME || 'Loretta';

const apiInstance = new Brevo.TransactionalEmailsApi();
if (BREVO_API_KEY) {
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
}

function generatePasswordResetEmailHTML(
  userName: string,
  resetCode: string,
  expiryMinutes: number = 15
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: white; border-radius: 24px; box-shadow: 0 4px 24px rgba(1, 61, 196, 0.08); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #013DC4 0%, #0150FF 50%, #CDB6EF 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 16px; margin-bottom: 8px;">
                <span style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">loretta</span>
              </div>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">Your personal health companion</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="color: #1a1a2e; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; text-align: center;">Reset Your Password</h1>
              
              <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hi ${userName || 'there'},<br><br>
                We received a request to reset your password. Enter this code in the app to set a new password:
              </p>
              
              <!-- Code Box -->
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f3f0ff 100%); border: 2px dashed #CDB6EF; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <p style="color: #718096; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Your Reset Code</p>
                <p style="font-family: 'DM Mono', 'SF Mono', Monaco, monospace; font-size: 36px; font-weight: 700; color: #013DC4; letter-spacing: 8px; margin: 0;">${resetCode}</p>
              </div>
              
              <!-- Timer notice -->
              <div style="background: #fef3cd; border-radius: 12px; padding: 12px 16px; margin: 0 0 24px 0;">
                <p style="color: #856404; font-size: 13px; margin: 0; text-align: center;">
                  ⏱️ This code expires in <strong>${expiryMinutes} minutes</strong>
                </p>
              </div>
              
              <!-- Security notice -->
              <p style="color: #718096; font-size: 13px; line-height: 1.5; margin: 0; text-align: center;">
                Didn't request this? You can safely ignore this email. Your password won't change unless you enter the code above.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 20px 24px; border-top: 1px solid #e9ecef;">
              <p style="color: #718096; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                This is an automated message from Loretta.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Company footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin-top: 24px;">
          <tr>
            <td style="text-align: center;">
              <p style="color: #a0aec0; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Loretta Health. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generatePasswordResetEmailText(
  userName: string,
  resetCode: string,
  expiryMinutes: number = 15
): string {
  return `
Reset Your Password

Hi ${userName || 'there'},

We received a request to reset your password. Enter this code in the app to set a new password:

Your Reset Code: ${resetCode}

This code expires in ${expiryMinutes} minutes.

Didn't request this? You can safely ignore this email. Your password won't change unless you enter the code above.

---
This is an automated message from Loretta.
Please do not reply to this email.

© ${new Date().getFullYear()} Loretta Health. All rights reserved.
  `.trim();
}

export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetCode: string,
  expiryMinutes: number = 15
): Promise<{ success: boolean; message: string }> {
  if (!BREVO_API_KEY) {
    console.log(`[Password Reset] Brevo not configured. Code for ${toEmail}: ${resetCode} (expires in ${expiryMinutes} minutes)`);
    return {
      success: true,
      message: "Brevo not configured. Reset code logged to console for demo purposes."
    };
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = 'Reset your Loretta password';
  sendSmtpEmail.htmlContent = generatePasswordResetEmailHTML(userName, resetCode, expiryMinutes);
  sendSmtpEmail.textContent = generatePasswordResetEmailText(userName, resetCode, expiryMinutes);
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: toEmail, name: userName || 'User' }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Password Reset] Email sent successfully to ${toEmail}`);
    return {
      success: true,
      message: "Password reset email sent successfully."
    };
  } catch (error: any) {
    console.error('[Password Reset] Failed to send email:', error?.body || error?.message || error);
    return {
      success: false,
      message: "Failed to send password reset email. Please try again later."
    };
  }
}

export function isEmailConfigured(): boolean {
  return !!BREVO_API_KEY;
}

const FEEDBACK_RECEIVER_EMAIL = process.env.FEEDBACK_RECEIVER_EMAIL || 'support@loretta.health';

function generateFeedbackEmailHTML(
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 24px; box-shadow: 0 4px 24px rgba(1, 61, 196, 0.08); overflow: hidden;">
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #013DC4 0%, #0150FF 50%, #CDB6EF 100%); padding: 24px; text-align: center;">
              <span style="font-size: 24px; font-weight: 800; color: white; letter-spacing: -0.5px;">Loretta Feedback</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="color: #1a1a2e; font-size: 20px; font-weight: 800; margin: 0 0 24px 0;">New Feedback Received</h1>
              
              <!-- User Info -->
              <div style="background: #f8f9ff; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <p style="color: #718096; font-size: 13px; margin: 0 0 8px 0;"><strong>From:</strong> ${userName}</p>
                <p style="color: #718096; font-size: 13px; margin: 0 0 8px 0;"><strong>Email:</strong> ${userEmail}</p>
                <p style="color: #718096; font-size: 13px; margin: 0 0 8px 0;"><strong>Category:</strong> <span style="background: #013DC4; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${category}</span></p>
                <p style="color: #718096; font-size: 13px; margin: 0;"><strong>Subject:</strong> ${subject}</p>
              </div>
              
              <!-- Message -->
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f3f0ff 100%); border: 1px solid #CDB6EF; border-radius: 12px; padding: 20px;">
                <p style="color: #718096; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">Message</p>
                <p style="color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 16px 24px; border-top: 1px solid #e9ecef;">
              <p style="color: #718096; font-size: 11px; margin: 0; text-align: center;">
                Sent via Loretta App Feedback Form | ${new Date().toISOString()}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateFeedbackEmailText(
  userName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: string
): string {
  return `
New Feedback Received

From: ${userName}
Email: ${userEmail}
Category: ${category}
Subject: ${subject}

Message:
${message}

---
Sent via Loretta App Feedback Form
${new Date().toISOString()}
  `.trim();
}

export async function sendFeedbackEmail(
  userEmail: string,
  userName: string,
  subject: string,
  message: string,
  category: string
): Promise<{ success: boolean; message: string }> {
  if (!BREVO_API_KEY) {
    console.log(`[Feedback] Brevo not configured. Feedback from ${userEmail}: [${category}] ${subject} - ${message.substring(0, 100)}...`);
    return {
      success: true,
      message: "Brevo not configured. Feedback logged to console for demo purposes."
    };
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `[Loretta Feedback] [${category}] ${subject}`;
  sendSmtpEmail.htmlContent = generateFeedbackEmailHTML(userName, userEmail, subject, message, category);
  sendSmtpEmail.textContent = generateFeedbackEmailText(userName, userEmail, subject, message, category);
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: FEEDBACK_RECEIVER_EMAIL, name: 'Loretta Team' }];
  sendSmtpEmail.replyTo = { email: userEmail, name: userName };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Feedback] Email sent successfully from ${userEmail}`);
    return {
      success: true,
      message: "Feedback sent successfully."
    };
  } catch (error: any) {
    console.error('[Feedback] Failed to send email:', error?.body || error?.message || error);
    return {
      success: false,
      message: "Failed to send feedback. Please try again later."
    };
  }
}
