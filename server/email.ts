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
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #013DC4 0%, #0150FF 50%, #CDB6EF 100%); padding: 32px 24px; text-align: center;">
              <img src="https://loretta-care.replit.app/loretta_logo_white.png" alt="Loretta" width="160" style="display: block; margin: 0 auto 12px auto; max-width: 160px; height: auto;" />
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

function generateFeedbackId(): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return random;
}

function generateFeedbackEmailHTML(
  username: string,
  firstName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: string,
  feedbackId: string
): string {
  const categoryColors: Record<string, string> = {
    bug: '#EF4444',
    feature: '#22C55E',
    general: '#013DC4',
    support: '#F59E0B'
  };
  const categoryColor = categoryColors[category.toLowerCase()] || '#013DC4';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: white; border-radius: 24px; box-shadow: 0 4px 24px rgba(1, 61, 196, 0.08); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #013DC4 0%, #0150FF 50%, #CDB6EF 100%); padding: 32px 24px; text-align: center;">
              <!-- Logo -->
              <img src="https://loretta-care.replit.app/loretta_logo_white.png" alt="Loretta" width="180" style="display: block; margin: 0 auto 12px auto; max-width: 180px; height: auto;" />
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">App Feedback</p>
            </td>
          </tr>
          
          <!-- Feedback ID Badge -->
          <tr>
            <td style="padding: 20px 24px 0 24px; text-align: center;">
              <span style="display: inline-block; background: linear-gradient(135deg, #f0f4ff 0%, #f3f0ff 100%); border: 1px solid #CDB6EF; color: #013DC4; font-size: 11px; font-weight: 700; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px;">
                FEEDBACK #${feedbackId}
              </span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 24px;">
              <!-- Subject - Large and prominent -->
              <h1 style="color: #1a1a2e; font-size: 26px; font-weight: 800; margin: 0 0 20px 0; line-height: 1.3; text-align: center;">"${subject}"</h1>
              
              <!-- User Info Card -->
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <span style="color: #a0aec0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Username</span>
                      <p style="color: #2d3748; font-size: 15px; font-weight: 600; margin: 4px 0 0 0;">@${username}</p>
                    </td>
                    <td style="padding-bottom: 12px; text-align: right;">
                      <span style="display: inline-block; background: ${categoryColor}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;">${category}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-bottom: 12px;">
                      <span style="color: #a0aec0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">First Name</span>
                      <p style="color: #2d3748; font-size: 15px; font-weight: 600; margin: 4px 0 0 0;">${firstName || 'Not provided'}</p>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <span style="color: #a0aec0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email</span>
                      <p style="color: #013DC4; font-size: 14px; margin: 4px 0 0 0;">
                        <a href="mailto:${userEmail}" style="color: #013DC4; text-decoration: none;">${userEmail}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Message Box -->
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f3f0ff 100%); border: 2px solid #CDB6EF; border-radius: 16px; padding: 24px;">
                <p style="color: #013DC4; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Message</p>
                <p style="color: #2d3748; font-size: 16px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%); padding: 20px 24px; border-top: 1px solid #e9ecef;">
              <p style="color: #a0aec0; font-size: 11px; margin: 0; text-align: center; line-height: 1.5;">
                Received via Loretta App<br>
                <span style="color: #cbd5e0;">${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })} (Berlin)</span>
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom branding -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 24px;">
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

function generateFeedbackEmailText(
  username: string,
  firstName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: string,
  feedbackId: string
): string {
  return `
App Feedback #${feedbackId}

Subject: "${subject}"

Username: @${username}
First Name: ${firstName || 'Not provided'}
Email: ${userEmail}
Category: ${category}

Message:
${message}

---
Received via Loretta App
${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })} (Berlin)

© ${new Date().getFullYear()} Loretta Health
  `.trim();
}

export async function sendFeedbackEmail(
  username: string,
  firstName: string,
  userEmail: string,
  subject: string,
  message: string,
  category: string
): Promise<{ success: boolean; message: string }> {
  const feedbackId = generateFeedbackId();
  
  if (!BREVO_API_KEY) {
    console.log(`[Feedback] Brevo not configured. Feedback #${feedbackId} from @${username} (${userEmail}): [${category}] ${subject} - ${message.substring(0, 100)}...`);
    return {
      success: true,
      message: "Brevo not configured. Feedback logged to console for demo purposes."
    };
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = `App Feedback #${feedbackId} - ${subject}`;
  sendSmtpEmail.htmlContent = generateFeedbackEmailHTML(username, firstName, userEmail, subject, message, category, feedbackId);
  sendSmtpEmail.textContent = generateFeedbackEmailText(username, firstName, userEmail, subject, message, category, feedbackId);
  sendSmtpEmail.sender = { name: FROM_NAME, email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: FEEDBACK_RECEIVER_EMAIL, name: 'Loretta Team' }];
  sendSmtpEmail.replyTo = { email: userEmail, name: firstName || username };

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

function generateFeedbackThankYouHTML(firstName: string): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Feedback</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f4ff 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: white; border-radius: 24px; box-shadow: 0 4px 24px rgba(1, 61, 196, 0.08); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #013DC4 0%, #0150FF 50%, #CDB6EF 100%); padding: 32px 24px; text-align: center;">
              <img src="https://loretta-care.replit.app/loretta_logo_white.png" alt="Loretta" width="160" style="display: block; margin: 0 auto 12px auto; max-width: 160px; height: auto;" />
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">Your personal health companion</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h1 style="color: #1a1a2e; font-size: 24px; font-weight: 800; margin: 0 0 20px 0; text-align: center;">Thank You for Your Feedback!</h1>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; text-align: center;">
                ${greeting},
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; text-align: center;">
                We truly appreciate you taking the time to share your thoughts with us. Your feedback is invaluable in helping us improve Loretta and create a better experience for everyone.
              </p>
              
              <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f3f0ff 100%); border: 2px solid #CDB6EF; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="color: #013DC4; font-size: 15px; font-weight: 600; margin: 0; line-height: 1.6;">
                  Our team will review your feedback carefully. If we need any additional information, we'll be in touch!
                </p>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0; text-align: center;">
                Thank you for being part of the Loretta community.
              </p>
            </td>
          </tr>
          
          <!-- Signature -->
          <tr>
            <td style="padding: 0 24px 32px 24px; text-align: center;">
              <p style="color: #013DC4; font-size: 16px; font-weight: 700; margin: 0;">
                With gratitude,<br>
                <span style="font-size: 18px;">The Loretta Team</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%); padding: 20px 24px; border-top: 1px solid #e9ecef;">
              <p style="color: #a0aec0; font-size: 11px; margin: 0; text-align: center;">
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

function generateFeedbackThankYouText(firstName: string): string {
  const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
  
  return `
Thank You for Your Feedback!

${greeting},

We truly appreciate you taking the time to share your thoughts with us. Your feedback is invaluable in helping us improve Loretta and create a better experience for everyone.

Our team will review your feedback carefully. If we need any additional information, we'll be in touch!

Thank you for being part of the Loretta community.

With gratitude,
The Loretta Team

---
© ${new Date().getFullYear()} Loretta Health. All rights reserved.
  `.trim();
}

export async function sendFeedbackThankYouEmail(
  userEmail: string,
  firstName: string
): Promise<{ success: boolean; message: string }> {
  if (!BREVO_API_KEY) {
    console.log(`[Feedback Thank You] Brevo not configured. Would send thank you to ${userEmail}`);
    return {
      success: true,
      message: "Brevo not configured. Thank you email logged for demo purposes."
    };
  }

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = 'Thank You for Your Feedback - Loretta';
  sendSmtpEmail.htmlContent = generateFeedbackThankYouHTML(firstName);
  sendSmtpEmail.textContent = generateFeedbackThankYouText(firstName);
  sendSmtpEmail.sender = { name: 'Loretta Team', email: FROM_EMAIL };
  sendSmtpEmail.to = [{ email: userEmail, name: firstName || 'Loretta User' }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Feedback Thank You] Email sent successfully to ${userEmail}`);
    return {
      success: true,
      message: "Thank you email sent successfully."
    };
  } catch (error: any) {
    console.error('[Feedback Thank You] Failed to send email:', error?.body || error?.message || error);
    return {
      success: false,
      message: "Failed to send thank you email."
    };
  }
}
