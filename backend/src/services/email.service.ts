import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'entechsmartservice@gmail.com',
    pass: 'wfme pfxj jnfq gtsp'
  }
});

export const sendVerificationEmail = async (to: string, token: string) => {
  // ✅ Point directly to backend API endpoint
  const url = `${process.env.BACKEND_URL}/api/auth/verify-email?token=${token}`;

  console.log('📧 Sending verification email to:', to);
  console.log('🔗 Verification URL:', url);

  const html = `
    <div style="font-family: Arial, sans-serif; background: #f0f8ff; padding: 30px; border-radius: 10px; text-align: center;">
      
      <h2 style="color: #1e90ff; margin-bottom: 10px;">Verify your email</h2>
      <p style="font-size: 16px; color: #333;">Welcome to <strong>Entech Smart Service</strong>!</p>
      <p style="font-size: 15px; color: #555;">Click the button below to activate your account:</p>

      <a href="${url}" style="
        display: inline-block;
        margin-top: 20px;
        padding: 12px 24px;
        background: #1e90ff;
        color: white;
        text-decoration: none;
        font-weight: bold;
        border-radius: 6px;
      ">
        Verify Email
      </a>

      <p style="margin-top: 30px; font-size: 12px; color: #999;">
        If you didn't create an account, just ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Entech Smart Service" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email',
    html
  });
};