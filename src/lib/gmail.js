import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

let transporter = null;

export async function initializeGmail() {
  try {
    if (transporter) return true;

    const credentialsPath = path.join(process.cwd(), 'gmail-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('gmail-credentials.json not found in project root');
      return false;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Using Service Account with nodemailer
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    return true;
  } catch (error) {
    console.error('Gmail initialization error:', error);
    return false;
  }
}

export async function sendEmail(to, subject, htmlContent) {
  try {
    if (!transporter) {
      const initialized = await initializeGmail();
      if (!initialized) {
        return {
          success: false,
          error: 'Failed to initialize Gmail',
        };
      }
    }

    const mailOptions = {
      from: process.env.GMAIL_USER || 'noreply@apexcrm.com',
      to,
      subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Email templates
export const emailTemplates = {
  welcomeLead: (leadName, companyName) => `
    <h2>Welcome, ${leadName}!</h2>
    <p>Thank you for your interest in ${companyName}.</p>
    <p>Our sales team will reach out shortly to discuss how we can help.</p>
    <p>Best regards,<br/>The APEX CRM Team</p>
  `,

  assignmentNotification: (leadName, salesRepName) => `
    <h2>New Lead Assignment</h2>
    <p>Hi ${salesRepName},</p>
    <p>${leadName} has been assigned to you.</p>
    <p>View their profile in your dashboard.</p>
  `,

  proposalEmail: (contactName) => `
    <h2>Your Custom Proposal</h2>
    <p>Hi ${contactName},</p>
    <p>We've prepared a custom proposal for your business.</p>
    <p>Check your dashboard for details.</p>
  `,
};
