import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"iDonatio" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify Your iDonatio Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #007AFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .code-container {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .verification-code {
            font-size: 32px;
            letter-spacing: 3px;
            color: #007AFF;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #007AFF;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">iDonatio</div>
          <h2>Verify Your Email Address</h2>
        </div>
        
        <p>Thank you for creating an account with iDonatio. To complete your registration, please use the following verification code:</p>
        
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>
        
        <p>This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
        
        <p>Need help? <a href="mailto:support@idonatio.com" style="color: #007AFF;">Contact our support team</a></p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} iDonatio. All rights reserved.</p>
          <p>If you're having trouble with the code above, you can also copy and paste it directly.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify Your iDonatio Account\n\n
      Thank you for creating an account with iDonatio.\n\n
      Your verification code is: ${code}\n\n
      This code will expire in 15 minutes. If you didn't request this code, you can safely ignore this email.\n\n
      Need help? Contact our support team at support@idonatio.com\n\n
      © ${new Date().getFullYear()} iDonatio. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send verification email");
  }
};


export const sendPasswordResetEmail = async (email, code) => {
  // Generate a reset link with the code as a query parameter
  const resetLink = `${process.env.FRONTEND_URL}/resetPassword?email=${encodeURIComponent(email)}&code=${code}`;

  const mailOptions = {
    from: `"iDonatio" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request for iDonatio",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #007AFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .code-container {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .verification-code {
            font-size: 32px;
            letter-spacing: 3px;
            color: #007AFF;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #007AFF;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">iDonatio</div>
          <h2>Password Reset Request</h2>
        </div>
        
        <p>We received a request to reset your iDonatio account password. You can either:</p>
        
        <p><strong> Use this verification code:</strong></p>
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>

        <p><strong> Or click this button to reset your password:</strong></p>
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">Reset Password</a>
        </div>
                
        <p>This link and code will expire in 10 minutes. If you didn't request this, please secure your account.</p>
        
        <p>Need help? <a href="mailto:support@idonatio.com" style="color: #007AFF;">Contact our support team</a></p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} iDonatio. All rights reserved.</p>
          <p>If the button doesn't work, copy and paste this link into your browser: ${resetLink}</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request for iDonatio\n\n
      We received a request to reset your password.\n\n
      Reset Link: ${resetLink}\n\n
      Or use this code: ${code}\n\n
      This link/code will expire in 15 minutes. If you didn't request this, please secure your account.\n\n
      Need help? Contact our support team at support@idonatio.com\n\n
      © ${new Date().getFullYear()} iDonatio. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};



export const sendInvitationEmail = async (email, token, inviterName, isResend = false) => {
  const invitationLink = `${process.env.FRONTEND_URL}/set-password?token=${token}&email=${encodeURIComponent(email)}`;

  const subject = isResend
    ? 'New Invitation to Join Our Platform'
    : 'Invitation to Join Our Platform';

  const mailOptions = {
    from: `"iDonatio" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="color: #007bff">
                  <h3 class="logo">iDonatio</h3>
                  <h2>You've Been Invited!</h2>
                </div>
                <p>Hello,</p>
                <p>${inviterName} has invited you to join our platform. 
                   ${isResend ? 'Here is a new invitation link.' : ''}</p>                
                <p>Click the link below to set up your password and complete your registration.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${invitationLink}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Set Up Your Password
                    </a>
                </p>
                <p>This invitation link will expire in 1 hour.</p>

                 ${isResend ? `
                <p style="color: #dc3545; font-weight: bold;">
                    Note: Previous invitation links are no longer valid. Please use this new link.
                </p>
                ` : ''}

                <p>If you didn't request this invitation, please ignore this email.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
        `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email ${isResend ? 're' : ''}sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};


export const donorVerificationEmail = async (email, code, isResend = false) => {

  const subject = isResend
    ? 'New Login Codes To Your iDonatio Donor Account'
    : "Login To Your iDonatio Donor Account";

  const mailOptions = {
    from: `"iDonatio" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #007AFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .code-container {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .verification-code {
            font-size: 32px;
            letter-spacing: 3px;
            color: #007AFF;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #007AFF;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">iDonatio</div>
          <h2>Login To Your iDonatio Donor Account</h2>
        </div>
        
        <p>Hello! </p>
        <p> ${isResend ? 'Here is a new login code:' : 'Login to your account using the following verification code:'}</p>
        
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>
        
        <p>This code will expire in 1 minute. If you didn't request this code, you can safely ignore this email.</p>
        
        <p>Need help? <a href="mailto:support@idonatio.com" style="color: #007AFF;">Contact our support team</a></p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} iDonatio. All rights reserved.</p>
          <p>If you're having trouble with the code above, you can also copy and paste it directly.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Login To Your iDonatio Donor Account\n\n
      Hello!\n\n
      Login to your account using the following verification code: ${code}\n\n
      This code will expire in 1 minute. If you didn't request this code, you can safely ignore this email.\n\n
      Need help? Contact our support team at support@idonatio.com\n\n
      © ${new Date().getFullYear()} iDonatio. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};


export const donorSignupVerificationEmail = async (email, code, isResend = false) => {

  const subject = isResend
    ? 'New Verification Code To Your iDonatio Donor Account'
    : "Verify To Your iDonatio Donor Account";

  const mailOptions = {
    from: `"iDonatio" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #007AFF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .code-container {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .verification-code {
            font-size: 32px;
            letter-spacing: 3px;
            color: #007AFF;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #007AFF;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">iDonatio</div>
          <h2>Login To Your iDonatio Donor Account</h2>
        </div>
        
        <p>Hello! </p>
        <p> ${isResend ? 'Here is a new verification code:' : 'Verify to your account using the following verification code:'}</p>
        
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>
        
        <p>This code will expire in 1 minute. If you didn't request this code, you can safely ignore this email.</p>
        
        <p>Need help? <a href="mailto:support@idonatio.com" style="color: #007AFF;">Contact our support team</a></p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} iDonatio. All rights reserved.</p>
          <p>If you're having trouble with the code above, you can also copy and paste it directly.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify Your iDonatio Donor Account\n\n
      Hello!\n\n
      Verify to your account using the following verification code: ${code}\n\n
      This code will expire in 1 minute. If you didn't request this code, you can safely ignore this email.\n\n
      Need help? Contact our support team at support@idonatio.com\n\n
      © ${new Date().getFullYear()} iDonatio. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};
