const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS &&
          process.env.EMAIL_USER !== 'mock_user') {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        this.isConfigured = true;
        console.log('Email service configured with SMTP transport.');
      } else {
        console.log('Email service running in mock mode (no SMTP configured).');
      }
    } catch (err) {
      console.error('Email service initialization failed:', err.message);
    }
  }

  async sendEmail(to, subject, html) {
    const emailData = {
      from: process.env.EMAIL_FROM || 'noreply@ayucare.com',
      to,
      subject,
      html,
    };

    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail(emailData);
        console.log(`Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error('Email send failed:', err.message);
        return { success: false, error: err.message };
      }
    }

    // Mock mode — log email to console
    console.log('=== MOCK EMAIL ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.substring(0, 200)}...`);
    console.log('==================');
    return { success: true, mock: true };
  }

  async sendAppointmentConfirmation(patientEmail, appointmentDetails) {
    const { doctorName, department, date, time, appointmentId } = appointmentDetails;
    const subject = `Appointment Confirmed - ${appointmentId}`;
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6C4DF6, #8B6FF8); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">AyuCare Hospital</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Appointment Confirmation</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a1a2e;">Your Appointment is Confirmed!</h2>
          <div style="background: #F5F6FA; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p><strong>Appointment ID:</strong> ${appointmentId}</p>
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
          </div>
          <p style="color: #666;">Please arrive 15 minutes before your scheduled time.</p>
          <p style="color: #666;">If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
        </div>
        <div style="background: #F5F6FA; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>&copy; 2024 AyuCare Hospital. All rights reserved.</p>
        </div>
      </div>
    `;
    return this.sendEmail(patientEmail, subject, html);
  }

  async sendAppointmentReminder(patientEmail, appointmentDetails) {
    const { doctorName, date, time } = appointmentDetails;
    const subject = 'Appointment Reminder - AyuCare Hospital';
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6C4DF6, #8B6FF8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Appointment Reminder</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p>This is a reminder for your upcoming appointment:</p>
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p style="color: #666;">Please arrive 15 minutes early.</p>
        </div>
      </div>
    `;
    return this.sendEmail(patientEmail, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Password Reset Request - AyuCare Hospital';
    const resetUrl = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`;
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6C4DF6, #8B6FF8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #6C4DF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Reset Password</a>
          <p style="color: #666;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to AyuCare Hospital!';
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6C4DF6, #8B6FF8); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to AyuCare!</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2>Hello ${name}!</h2>
          <p>Thank you for joining AyuCare Hospital. We are committed to providing you with the best healthcare experience.</p>
          <p>With AyuCare, you can:</p>
          <ul>
            <li>Book appointments with top specialists</li>
            <li>Access your health records anytime</li>
            <li>Receive prescriptions digitally</li>
            <li>Track your health metrics</li>
          </ul>
          <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: #6C4DF6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Get Started</a>
        </div>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
