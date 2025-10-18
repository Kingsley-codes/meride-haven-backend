import nodemailer from "nodemailer";
import Booking from "../models/bookingModel.js";
import Vendor from "../models/vendorModel.js";
import Ticket from "../models/ticketModel.js";


// ✅ Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const adminEmail = "adeniyifunmilola001@gmail.com"

// Send booking confirmation email to the client
export const sendBookingEmailToClient = async (bookingID) => {
  try {
    const booking = await Booking.findOne({ bookingID });

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `Your Booking Confirmation | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Your Booking Has Been Placed</h2>
        </div>

        <p>Hi ${booking.clientName},</p>
        <p>Thank you for choosing Meride Haven. Your booking for <strong>${booking.serviceName}</strong> has been successfully created.</p>

        <div class="details-container">
          <p class="detail"><strong>Vendor:</strong> ${vendorName}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
          <p class="detail"><strong>Status:</strong> ${booking.status}</p>
        </div>

        <p>You will receive an update once your vendor confirms your booking.</p>

        <a href="${process.env.FRONTEND_URL}/user/dashboard/bookings" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: booking.clientEmail,
      subject,
      html: htmlContent,
      text: `
      Hi ${booking.clientName},

      Your booking for ${booking.serviceName} has been successfully placed.

      Vendor: ${vendorName}
      Booking ID: ${booking.bookingID}
      Price: ₦${booking.price}

      View your booking at ${process.env.FRONTEND_URL}/user/dashboard/booking

      © ${new Date().getFullYear()} Meride Haven. All rights reserved.
      `,
    });

    console.log("✅ Client booking email sent to:", booking.clientEmail);
  } catch (error) {
    console.error("❌ Error sending booking email to client:", error.message);
  }
};


// Send new booking notification to vendor
export const sendBookingEmailToVendor = async (bookingID) => {
  try {
    const booking = await Booking.findOne({ bookingID });

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `New Booking Received | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>New Booking Received</h2>
        </div>

        <p>Hi ${vendorName},</p>
        <p>You just received a new booking for <strong>${booking.serviceName}</strong>.</p>

        <div class="details-container">
          <p class="detail"><strong>Client:</strong> ${booking.clientName}</p>
          <p class="detail"><strong>Contact:</strong> ${booking.clientEmail} | ${booking.clientNumber}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
        </div>

        <p>Kindly log in to your dashboard to confirm or manage this booking.</p>

        <a href="${process.env.FRONTEND_URL}/vendor/bookings/${booking._id}" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: vendor.email,
      subject,
      html: htmlContent,
      text: `
      Hi ${vendorName},

      You have received a new booking for ${booking.serviceName}.

      Client: ${booking.clientName}
      Contact: ${booking.clientEmail} | ${booking.clientNumber}
      Booking ID: ${booking.bookingID}
      Price: ₦${booking.price}

      Manage this booking at ${process.env.FRONTEND_URL}/vendor/bookings/${booking._id}

      © ${new Date().getFullYear()} Meride Haven. All rights reserved.
      `,
    });

    console.log("✅ Vendor booking email sent to:", vendor.email);
  } catch (error) {
    console.error("❌ Error sending booking email to vendor:", error.message);
  }
};


// Send booking confirmation email to the client
export const sendBookingconfirmationToClient = async (bookingID) => {
  try {
    const booking = await Booking.findOne(bookingID)

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `Your Booking Has Been Activated | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Your Booking Has Been Placed</h2>
        </div>

        <p>Hi ${booking.clientName},</p>
        <p>Thank you for choosing Meride Haven. Your booking for <strong>${booking.serviceName}</strong> has been successfully activated by <strong>${vendorName}</strong>.</p>

        <p>Here are the details of your booking once again</p>
        <div class="details-container">
          <p class="detail"><strong>Vendor:</strong> ${vendorName}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
          <p class="detail"><strong>Status:</strong> ${booking.status}</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/user/dashboard/bookings" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: booking.clientEmail,
      subject,
      html: htmlContent,
      text: `
      Hi ${booking.clientName},

      Your booking for ${booking.serviceName} has been successfully placed.

      Vendor: ${vendorName}
      Booking ID: ${booking.bookingID}
      Price: ₦${booking.price}

      View your booking at ${process.env.FRONTEND_URL}/user/dashboard/booking

      © ${new Date().getFullYear()} Meride Haven. All rights reserved.
      `,
    });

    console.log("✅ Client booking email sent to:", booking.clientEmail);
  } catch (error) {
    console.error("❌ Error sending booking email to client:", error.message);
  }
};


export const vendorCancelBooking = async (bookingID) => {
  try {
    const booking = await Booking.findOne(bookingID)

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `Your Booking Has Been Canceled | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Your Booking Has Been Placed</h2>
        </div>

        <p>Hi ${booking.clientName},</p>
        <p>Your booking for <strong>${booking.serviceName}</strong> has been canceled by <strong>${vendorName}</strong>.</p>

        <p>Here are the details of your booking once again</p>
        <div class="details-container">
          <p class="detail"><strong>Vendor:</strong> ${vendorName}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
          <p class="detail"><strong>Status:</strong> ${booking.status}</p>
          <p class="detail"><strong>Reason for cancellation:</strong> ${booking.cancelReason}</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/user/dashboard/bookings" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: booking.clientEmail,
      subject,
      html: htmlContent,

    });

    console.log("✅ Client booking email sent to:", booking.clientEmail);
  } catch (error) {
    console.error("❌ Error sending booking email to client:", error.message);
  }
};


export const clientCancelBooking = async (bookingID) => {
  try {
    const booking = await Booking.findOne(bookingID)

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `A Booking Has Been Canceled | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Your Booking Has Been Placed</h2>
        </div>

        <p>Hi ${vendorName},</p>
        <p>Your booking from <strong>${booking.clientName}</strong> has been canceled by the client.</p>

        <p>Here are the details of your booking once again</p>
        <div class="details-container">
          <p class="detail"><strong>Vendor:</strong> ${vendorName}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
          <p class="detail"><strong>Status:</strong> ${booking.status}</p>
          <p class="detail"><strong>Reason for cancellation:</strong> ${booking.cancelReason}</p>
        </div>

        <a href="${process.env.FRONTEND_URL}/user/dashboard/bookings" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: vendor.email,
      subject,
      html: htmlContent,

    });

    console.log("✅ Client booking cancellation email sent to:", vendor.email);
  } catch (error) {
    console.error("❌ Error sending booking email to client:", error.message);
  }
};



export const bookingCanceled = async (bookingID) => {
  try {
    const booking = await Booking.findOne(bookingID)

    if (!booking) throw new Error("Booking not found");

    const vendor = await Vendor.findById(booking.vendor);

    const vendorName = vendor.VendorType === "others" ? vendor.businessName : vendor.vendorName

    const subject = `A Booking Has Been Canceled | Meride Haven`;

    const htmlContent = `
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
          .details-container {
            background-color: #fff8e7;
            border: 1px solid #DAA520;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
          }
          .detail {
            margin: 5px 0;
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
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Meride Haven</div>
          <h2>Your Booking Has Been Placed</h2>
        </div>

        <p>Hi ${booking.clientName},</p>
        <p>Your booking for <strong>${vendorName}'s</strong> <strong>${booking.serviceName}</strong> has been canceled by .</p>

        <p>Here are the details of the booking</p>
        <div class="details-container">
          <p class="detail"><strong>Vendor:</strong> ${vendorName}</p>
          <p class="detail"><strong>Client:</strong> ${booking.clientName}</p>
          <p class="detail"><strong>Contact:</strong> ${booking.clientEmail} | ${booking.clientNumber}</p>
          <p class="detail"><strong>Booking ID:</strong> ${booking.bookingID}</p>
          <p class="detail"><strong>Price:</strong> ₦${booking.price}</p>
          <p class="detail"><strong>Status:</strong> ${booking.status}</p>
          <p class="detail"><strong>Reason for cancellation:</strong> ${booking.cancelReason}</p>
        </div>

        <p>The client may be expecting a refund</p>
        <a href="${process.env.FRONTEND_URL}/user/dashboard/bookings" class="button">View Booking</a>

        <div class="footer">
          <p>Need help? <a href="mailto:support@meridehaven.com">Contact our support team</a></p>
          <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject,
      html: htmlContent,

    });

    console.log("✅ Client booking email sent to:", booking.clientEmail);
  } catch (error) {
    console.error("❌ Error sending booking email to client:", error.message);
  }
};



export const sendTicketEmailToAdmin = async (ticketId) => {
  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) throw new Error("Ticket not found");

    const subject = `New Support Ticket Created`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          background-color: #fafafa;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 25px;
        }
        .logo {
          font-size: 22px;
          font-weight: bold;
          color: #DAA520;
        }
        .details-container {
          background-color: #fff8e7;
          border: 1px solid #DAA520;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .detail {
          margin: 5px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #777;
          margin-top: 30px;
        }
        a {
          color: #DAA520;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Meride Haven</div>
        <h2>New Support Ticket Created</h2>
      </div>

      <p>Hi Admin,</p>
      <p>A new support ticket has been submitted by <strong>${ticket.clientName}</strong>.</p>

      <div class="details-container">
        <p class="detail"><strong>Ticket ID:</strong> ${ticket.ticketID}</p>
        <p class="detail"><strong>Booking ID:</strong> ${ticket.bookingID}</p>
        <p class="detail"><strong>Client:</strong> ${ticket.clientName} (${ticket.clientEmail} | ${ticket.clientPhone})</p>
        <p class="detail"><strong>Vendor:</strong> ${ticket.vendorName} (${ticket.vendorEmail} | ${ticket.vendorPhone})</p>
        <p class="detail"><strong>Service:</strong> ${ticket.serviceName} (${ticket.serviceType})</p>
        <p class="detail"><strong>Status:</strong> ${ticket.status}</p>
      </div>

      <p><strong>Conflict Details:</strong></p>
      <p>${ticket.conflict}</p>

      ${ticket.images?.length
        ? `<p><strong>Attached Images:</strong></p>
             ${ticket.images
          .map(
            (img) =>
              `<a href="${img.url}" target="_blank">${img.url}</a><br/>`
          )
          .join("")}`
        : ""
      }

      <div class="footer">
        <p>© ${new Date().getFullYear()} Meride Haven. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"Meride Haven" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject,
      html: htmlContent,
    });

    console.log("✅ Ticket email sent to admin:", process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error("❌ Error sending ticket email to admin:", error.message);
  }
};
