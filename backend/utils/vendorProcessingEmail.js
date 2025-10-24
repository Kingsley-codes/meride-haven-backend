import nodemailer from 'nodemailer';

// Create transporter (same as in your template)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

const adminEmail = "adeniyifunmilola001@gmail.com"

// 1. Email for approved vendor
export const sendVendorApprovalEmail = async (vendor) => {
    const dashboardLink = `${process.env.FRONTEND_URL}/vendor/dashboard/dashboard`;

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendor.email,
        subject: "Congratulations! Your Vendor Account Has Been Approved",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .success-container {
            background-color: #f0f8f0;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Vendor Account Approved</h2>
        </div>

        <p>Dear ${vendor.VendorType === "driver" ? vendor.vendorName : vendor.businessName},</p>

        <div class="success-container">
          <div class="icon">✓</div>
          <h3 style="color: #4CAF50; margin: 0 0 15px 0;">Congratulations!</h3>
          <p style="margin: 0; font-size: 16px;">
            Your vendor account for ${vendor.VendorType === "driver" ? `<strong>${vendor.vendorName}</strong>` : `<strong>${vendor.businessName}</strong>`} has been approved and is now active on Meride Haven.
          </p>
        </div> 

        <p>You can now start receiving bookings and managing your services through our platform.</p>

        <div style="text-align: center;">
          <a href="${dashboardLink}" class="button">Access Your Dashboard</a>
        </div>

        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Complete your profile setup</li>
          <li>Set your availability and pricing</li>
          <li>Start accepting bookings from customers</li>
        </ul>

        <p>Need help getting started? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Vendor approval email sent to ${vendor.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor approval email:", error);
        throw new Error(`Failed to send vendor approval email: ${error.message}`);
    }
};

// 2. Email for rejected vendor
export const sendVendorRejectionEmail = async (vendor, declineReason) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendor.email,
        subject: "Update on Your Vendor Application",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .rejection-container {
            background-color: #fff5f5;
            border: 1px solid #e74c3c;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 15px;
          }
          .reason-box {
            background-color: #fff;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Application Status Update</h2>
        </div>
        
        <p>Dear ${vendor.VendorType === "driver" ? vendor.vendorName : vendor.businessName},</p>
        
        <div class="rejection-container">
          <div class="icon">⚠️</div>
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">Application Review Complete</h3>
          <p style="margin: 0;">
            After careful review, we're unable to approve your vendor application for 
            ${vendor.VendorType === "driver" ? `<strong>${vendor.vendorName}</strong>` : `<strong>${vendor.businessName}</strong>`} as 
            a vendor on our platform at this time.
          </p>
        </div>

        <p><strong>Reason for rejection:</strong></p>
        <div class="reason-box">
          ${declineReason !== 'seems illegitimate' ? declineReason : 'Further details were not provided.'}
        </div>

        <p>${declineReason !== 'seems illegitimate' ? "You can address the issues mentioned above and submit a new application when you're ready." : ""}</p>

        <div style="text-align: center;">
        ${declineReason !== 'seems illegitimate' ?
                `<a href="${reapplyLink}" class="button">Reapply Now</a>`
                : ""}
        </div>

        <p>If you have any questions about the rejection reason or need clarification, our support team is here to help.</p>

        <p> ${declineReason !== 'seems illegitimate' ? "We appreciate your interest in partnering with Meride Haven and hope to see your application again in the future." : ""}</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Vendor rejection email sent to ${vendor.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor rejection email:", error);
        throw new Error(`Failed to send vendor rejection email: ${error.message}`);
    }
};


// 3. Email to admin for KYC upload notification
export const sendKYCUploadNotificationToAdmin = async (vendorData) => {
    const adminDashboardLink = `${process.env.FRONTEND_URL}/admin/dashboard/client`;

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `KYC Documents Uploaded - ${vendorData.VendorType === "driver" ? vendorData.vendorName : vendorData.businessName}`,
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .notification-container {
            background-color: #e8f4fd;
            border: 1px solid #3498db;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #3498db;
            margin-bottom: 15px;
          }
          .vendor-info {
            background-color: #fff;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>KYC Documents Uploaded</h2>
        </div>
        
        <div class="notification-container">
          <div class="icon">📄</div>
          <h3 style="color: #3498db; margin: 0 0 15px 0;">New KYC Submission</h3>
          <p style="margin: 0;">
            A vendor has uploaded their KYC documents and is ready for review.
          </p>
        </div>

        <div class="vendor-info">
          <h4 style="margin-top: 0;">Vendor Details:</h4>
          <p><strong>Business Name:</strong> ${vendorData.VendorType === "driver" ? vendorData.vendorName : vendorData.businessName}</p>
          <p><strong>Email:</strong> ${vendorData.email}</p>
          <p><strong>Phone:</strong> ${vendorData.phone || 'Not provided'}</p>
          <p><strong>Vendor Type:</strong> ${vendorData.VendorType}</p>
          <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>Please review the uploaded documents and verify the vendor's information in the admin dashboard.</p>

        <div style="text-align: center;">
          <a href="${adminDashboardLink}" class="button">Review Vendor Documents</a>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`KYC upload notification sent to admin ${adminEmail}`);
        return result;
    } catch (error) {
        console.error("Error sending KYC notification email:", error);
        throw new Error(`Failed to send KYC notification email: ${error.message}`);
    }
};


// 4. Email for suspended vendor account
export const sendVendorSuspensionEmail = async (vendor, suspendReason) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendor.email,
        subject: "Important: Your Vendor Account Has Been Suspended",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .suspension-container {
            background-color: #fff5f5;
            border: 1px solid #e74c3c;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 15px;
          }
          .reason-box {
            background-color: #fff;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
          }
          .impact-box {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Account Status Update</h2>
        </div>
        
        <p>Dear ${vendor.VendorType === "driver" ? vendor.vendorName : vendor.businessName},</p>
        
        <div class="suspension-container">
          <div class="icon">⛔</div>
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">Account Suspended</h3>
          <p style="margin: 0;">
            Your vendor account ${vendor.VendorType === "driver" ? `<strong>${vendor.vendorName}</strong>` : `<strong>${vendor.businessName}</strong>`} has been temporarily suspended.
          </p>
        </div>

        <p><strong>Reason for suspension:</strong></p>
        <div class="reason-box">
          ${suspendReason || 'Further details were not provided.'}
        </div>

        <div class="impact-box">
          <h4 style="margin-top: 0; color: #DAA520;">What this means:</h4>
          <ul style="margin-bottom: 0;">
            <li>Your profile is no longer visible to customers</li>
            <li>You cannot receive new bookings</li>
            <li>Existing bookings may be affected</li>
            <li>Access to your vendor dashboard is restricted</li>
          </ul>
        </div>

        <p><strong>Next steps:</strong></p>
        <ul>
          <li>Review the reason for suspension above</li>
          <li>Address any issues that led to this action</li>
          <li>Contact support if you need clarification</li>
          <li>Submit an appeal if you believe this was an error</li>
        </ul>

        <p>We take account suspensions seriously to maintain the quality and safety of our platform. Please contact us if you have any questions.</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Vendor suspension email sent to ${vendor.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor suspension email:", error);
        throw new Error(`Failed to send vendor suspension email: ${error.message}`);
    }
};

// 5. Email for reactivated vendor account
export const sendVendorReactivationEmail = async (vendor) => {
    const dashboardLink = `${process.env.FRONTEND_URL}/vendor/vendor/dashboard`;

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendor.email,
        subject: "Good News: Your Vendor Account Has Been Reactivated",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .reactivation-container {
            background-color: #f0f8f0;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 15px;
          }
          .benefits-box {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Account Reactivated</h2>
        </div>

        <p>Dear ${vendor.VendorType === "driver" ? vendor.vendorName : vendor.businessName},</p>

        <div class="reactivation-container">
          <div class="icon">✅</div>
          <h3 style="color: #4CAF50; margin: 0 0 15px 0;">Welcome Back!</h3>
          <p style="margin: 0; font-size: 16px;">
            We're pleased to inform you that your vendor account ${vendor.VendorType === "driver" ? `<strong>${vendor.vendorName}</strong>` : `<strong>${vendor.businessName}</strong>`} has been reactivated.
          </p>
        </div>

        <div class="benefits-box">
          <h4 style="margin-top: 0; color: #DAA520;">Your account is now fully restored:</h4>
          <ul style="margin-bottom: 0;">
            <li>Your profile is visible to customers again</li>
            <li>You can receive new bookings</li>
            <li>Full access to your vendor dashboard</li>
            <li>Ability to manage your services and availability</li>
          </ul>
        </div>

        <p>We appreciate your cooperation and look forward to continuing our partnership. Your commitment to maintaining our platform standards is valued.</p>

        <div style="text-align: center;">
          <a href="${dashboardLink}" class="button">Access Your Dashboard</a>
        </div>

        <p><strong>Getting back to business:</strong></p>
        <ul>
          <li>Review and update your availability if needed</li>
          <li>Check your service listings and pricing</li>
          <li>Ensure all documents are up to date</li>
          <li>Contact support if you need any assistance</li>
        </ul>

        <p>Thank you for being a valued Meride Haven vendor. We're excited to have you back on the platform!</p>

        <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Vendor reactivation email sent to ${vendor.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor reactivation email:", error);
        throw new Error(`Failed to send vendor reactivation email: ${error.message}`);
    }

};

// 4. Email for suspended client account
export const sendClientSuspensionEmail = async (client, suspendReason) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: client.email,
        subject: "Important: Your Client Account Has Been Suspended",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .suspension-container {
            background-color: #fff5f5;
            border: 1px solid #e74c3c;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 15px;
          }
          .reason-box {
            background-color: #fff;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
          }
          .impact-box {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Account Status Update</h2>
        </div>
        
        <p>Dear ${client.fullName},</p>
        
        <div class="suspension-container">
          <div class="icon">⛔</div>
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">Account Suspended</h3>
          <p style="margin: 0;">
            Your client account ${client.fullName} has been temporarily suspended.
          </p>
        </div>

        <p><strong>Reason for suspension:</strong></p>
        <div class="reason-box">
          ${suspendReason || 'Further details were not provided.'}
        </div>

        <div class="impact-box">
          <h4 style="margin-top: 0; color: #DAA520;">What this means:</h4>
          <ul style="margin-bottom: 0;">
            <li>You cannot make new bookings</li>
            <li>Existing bookings may be affected</li>
            <li>Access to your client dashboard is restricted</li>
          </ul>
        </div>

        <p><strong>Next steps:</strong></p>
        <ul>
          <li>Review the reason for suspension above</li>
          <li>Address any issues that led to this action</li>
          <li>Contact support if you need clarification</li>
          <li>Submit an appeal if you believe this was an error</li>
        </ul>

        <p>We take account suspensions seriously to maintain the quality and safety of our platform. Please contact us if you have any questions.</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Vendor suspension email sent to ${client.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor suspension email:", error);
        throw new Error(`Failed to send vendor suspension email: ${error.message}`);
    }
};

// 5. Email for reactivated client account
export const sendClientReactivationEmail = async (client) => {
    const dashboardLink = `${process.env.FRONTEND_URL}/user/dashboard/dashboard`;

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: client.email,
        subject: "Good News: Your Client Account Has Been Reactivated",
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .reactivation-container {
            background-color: #f0f8f0;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 15px;
          }
          .benefits-box {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Account Reactivated</h2>
        </div>

        <p>Dear ${client.fullName},</p>

        <div class="reactivation-container">
          <div class="icon">✅</div>
          <h3 style="color: #4CAF50; margin: 0 0 15px 0;">Welcome Back!</h3>
          <p style="margin: 0; font-size: 16px;">
            We're pleased to inform you that your client account <strong>${client.fullName}</strong> has been reactivated.
          </p>
        </div>

        <div class="benefits-box">
          <h4 style="margin-top: 0; color: #DAA520;">Your account is now fully restored:</h4>
          <ul style="margin-bottom: 0;">
            <li>You can make new bookings</li>
            <li>Full access to your client dashboard</li>
            <li>Ability to view and manage your bookings</li>
          </ul>
        </div>

        <p>We appreciate your cooperation and look forward to continuing our partnership. Your commitment to maintaining our platform standards is valued.</p>

        <div style="text-align: center;">
          <a href="${dashboardLink}" class="button">Access Your Dashboard</a>
        </div>

        <p>Thank you for being a valued Meride Haven client. We're excited to have you back on the platform!</p>

        <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Client reactivation email sent to ${client.email}`);
        return result;
    } catch (error) {
        console.error("Error sending vendor reactivation email:", error);
        throw new Error(`Failed to send vendor reactivation email: ${error.message}`);
    }
};


// 1. Email for approved service
export const sendServiceApprovalEmail = async (vendorEmail, vendorName, serviceName, serviceType) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendorEmail,
        subject: `Your ${serviceType} Service Has Been Approved - ${serviceName}`,
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .success-container {
            background-color: #f0f8f0;
            border: 1px solid #4CAF50;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 15px;
          }
          .service-info {
            background-color: #fff;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #DAA520;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Service Approved</h2>
        </div>
        
        <p>Dear ${vendorName || 'Vendor'},</p>
        
        <div class="success-container">
          <div class="icon">✓</div>
          <h3 style="color: #4CAF50; margin: 0 0 15px 0;">Congratulations!</h3>
          <p style="margin: 0; font-size: 16px;">
            Your ${serviceType} service has been approved and is now live on Meride Haven.
          </p>
        </div>

        <div class="service-info">
          <h4 style="margin-top: 0; color: #DAA520;">Service Details:</h4>
          <p><strong>Service Name:</strong> ${serviceName}</p>
          <p><strong>Service Type:</strong> ${serviceType}</p>
          <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Active & Live</span></p>
          <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>Your service is now visible to customers and ready to receive bookings. Make sure your availability is up to date to maximize your opportunities.</p>

        <div style="text-align: center;">

        <p><strong>Next Steps to Maximize Your Service:</strong></p>
        <ul>
          <li>Ensure your pricing is competitive</li>
          <li>Keep your availability calendar updated</li>
          <li>Respond promptly to customer inquiries</li>
          <li>Maintain high-quality service to earn great reviews</li>
        </ul>

        <p>Need help managing your service? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Service approval email sent to ${vendorEmail}`);
        return result;
    } catch (error) {
        console.error("Error sending service approval email:", error);
        throw new Error(`Failed to send service approval email: ${error.message}`);
    }
};

// 2. Email for rejected service
export const sendServiceRejectionEmail = async (vendorEmail, vendorName, serviceName, serviceType, declineReason) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: vendorEmail,
        subject: `Update on Your ${serviceType} Service Submission - ${serviceName}`,
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .rejection-container {
            background-color: #fff5f5;
            border: 1px solid #e74c3c;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 15px;
          }
          .service-info {
            background-color: #fff;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .reason-box {
            background-color: #fff;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Service Review Complete</h2>
        </div>
        
        <p>Dear ${vendorName || 'Vendor'},</p>
        
        <div class="rejection-container">
          <div class="icon">⚠️</div>
          <h3 style="color: #e74c3c; margin: 0 0 15px 0;">Service Not Approved</h3>
          <p style="margin: 0;">
            After careful review, we're unable to approve your ${serviceType} service at this time.
          </p>
        </div>

        <div class="service-info">
          <h4 style="margin-top: 0; color: #DAA520;">Service Details:</h4>
          <p><strong>Service Name:</strong> ${serviceName}</p>
          <p><strong>Service Type:</strong> ${serviceType}</p>
          <p><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">Rejected</span></p>
          <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p><strong>Reason for rejection:</strong></p>
        <div class="reason-box">
          ${declineReason || 'Further details were not provided.'}
        </div>

        <p>You can address the issues mentioned above and submit a new service application when you're ready.</p>

        <p><strong>Common reasons for rejection include:</strong></p>
        <ul>
          <li>Incomplete or unclear service description</li>
          <li>Pricing that doesn't meet platform standards</li>
          <li>Missing or low-quality images</li>
          <li>Service details that don't meet our quality guidelines</li>
        </ul>

        <p>If you need clarification on the rejection reason or help with resubmission, our support team is here to assist you.</p>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`Service rejection email sent to ${vendorEmail}`);
        return result;
    } catch (error) {
        console.error("Error sending service rejection email:", error);
        throw new Error(`Failed to send service rejection email: ${error.message}`);
    }
};

// 3. Email to admin for new service notification
export const sendNewServiceNotificationToAdmin = async (serviceData, vendorData) => {

    const mailOptions = {
        from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `New ${serviceData.serviceType} Service Submission - ${serviceData.serviceName}`,
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
            background-color: #fafafa;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #DAA520;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h2 {
            color: #b8860b;
            margin: 0;
          }
          .notification-container {
            background-color: #e8f4fd;
            border: 1px solid #3498db;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
          }
          .icon {
            font-size: 48px;
            color: #3498db;
            margin-bottom: 15px;
          }
          .service-info, .vendor-info {
            background-color: #fff;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #DAA520;
          }
          .button {
            display: inline-block;
            background-color: #DAA520;
            color: white !important;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #b8860b;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
          }
          a {
            color: #DAA520;
            text-decoration: none;
          }
          a:hover {
            color: #b8860b;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>New Service Submission</h2>
        </div>
        
        <div class="notification-container">
          <div class="icon">📋</div>
          <h3 style="color: #3498db; margin: 0 0 15px 0;">New Service Awaiting Review</h3>
          <p style="margin: 0;">
            A vendor has submitted a new ${serviceData.serviceType} service for approval.
          </p>
        </div>

        <div class="service-info">
          <h4 style="margin-top: 0; color: #DAA520;">Service Details:</h4>
          <p><strong>Service Name:</strong> ${serviceData.serviceName}</p>
          <p><strong>Service Type:</strong> ${serviceData.serviceType}</p>
          <p><strong>Location:</strong> ${serviceData.location}</p>
          <p><strong>Price:</strong> $${serviceData.price}</p>
          <p><strong>Description:</strong> ${serviceData.description}</p>
          <p><strong>Availability:</strong> ${serviceData.availability}</p>
          <p><strong>Submission Date:</strong> ${new Date(serviceData.createdAt).toLocaleDateString()}</p>
        </div>

        <div class="vendor-info">
          <h4 style="margin-top: 0; color: #DAA520;">Vendor Details:</h4>
          <p><strong>Vendor Name:</strong> ${vendorData.vendorName}</p>
          <p><strong>Business Name:</strong> ${vendorData.businessName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${vendorData.email}</p>
          <p><strong>Phone:</strong> ${vendorData.phone || 'Not provided'}</p>
          <p><strong>Vendor Type:</strong> ${vendorData.VendorType}</p>
        </div>

        <p>Please review the service details and either approve or reject the submission based on our platform guidelines.</p>

        <p><strong>Items to review:</strong></p>
        <ul>
          <li>Service description and details</li>
          <li>Pricing competitiveness</li>
          <li>Image quality and relevance</li>
          <li>Vendor credibility and history</li>
          <li>Compliance with platform standards</li>
        </ul>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(`New service notification sent to admin ${adminEmail}`);
        return result;
    } catch (error) {
        console.error("Error sending new service notification email:", error);
        throw new Error(`Failed to send new service notification email: ${error.message}`);
    }
};