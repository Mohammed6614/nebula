import nodemailer from 'nodemailer';
import { env } from './env';
import logger from '../utils/logger';

export const emailTransporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_SECURE,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await emailTransporter.verify();
    logger.info('✅ Email service connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Email service connection failed:', error);
    return false;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await emailTransporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent successfully to ${options.to}`);
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    throw error;
  }
}

// Email templates
export function generateVerificationEmailTemplate(verificationUrl: string, firstName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني - NEBULA</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; text-align: center; }
    .content h2 { color: #333; margin-bottom: 20px; }
    .content p { color: #666; line-height: 1.6; margin-bottom: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌌 NEBULA</h1>
    </div>
    <div class="content">
      <h2>مرحباً ${firstName}!</h2>
      <p>شكراً لتسجيلك في منصة NEBULA. يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني.</p>
      <a href="${verificationUrl}" class="button">تأكيد البريد الإلكتروني</a>
      <p style="margin-top: 30px; font-size: 12px; color: #999;">إذا لم تقم بالتسجيل، يمكنك تجاهل هذا البريد.</p>
    </div>
    <div class="footer">
      <p>© 2024 NEBULA Platform. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generatePasswordResetEmailTemplate(resetUrl: string, firstName: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور - NEBULA</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; text-align: center; }
    .content h2 { color: #333; margin-bottom: 20px; }
    .content p { color: #666; line-height: 1.6; margin-bottom: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌌 NEBULA</h1>
    </div>
    <div class="content">
      <h2>مرحباً ${firstName}!</h2>
      <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.</p>
      <a href="${resetUrl}" class="button">إعادة تعيين كلمة المرور</a>
      <p style="margin-top: 30px; font-size: 12px; color: #999;">هذا الرابط صالح لمدة ساعة واحدة. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
    </div>
    <div class="footer">
      <p>© 2024 NEBULA Platform. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
  `;
}
