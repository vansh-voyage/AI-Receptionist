// import axios from "axios";
// import { CALENDLY_API_KEY, CALENDLY_EVENT_TYPE_URI } from "../config/env.js";

// export async function scheduleCalendlyEvent(userEmail, userName) {
//   try {
//     const response = await axios.post(
//       "https://api.calendly.com/scheduled_events",
//       {
//         event_type: CALENDLY_EVENT_TYPE_URI, // e.g., "https://api.calendly.com/event_types/abc123"
//         invitee: {
//           email: userEmail,
//           name: userName,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${CALENDLY_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error scheduling Calendly event:", error.response?.data || error.message);
//     throw new Error("Failed to schedule event: " + (error.response?.data?.message || error.message));
//   }
// }
import axios from "axios";
import { CALENDLY_API_KEY, CALENDLY_EVENT_TYPE_URI, EMAIL_USER, EMAIL_PASS } from "../config/env.js";
import nodemailer from "nodemailer";

export async function getSchedulingUrl() {
  return "https://calendly.com/vanshbhardwaj920/30min";
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function scheduleCalendlyEvent(userEmail, userName) {
  try {
    const schedulingUrl = await getSchedulingUrl();
    const mailOptions = {
      from: EMAIL_USER,
      to: userEmail,
      subject: `Schedule Your 30-Minute Meeting with ${userName}`,
      text: `Hi ${userName},\n\nPlease book your 30-minute meeting here: ${schedulingUrl}\n\nBest regards,\nVansh Bhardwaj`,
      html: `<p>Hi ${userName},</p><p>Please book your 30-minute meeting here: <a href="${schedulingUrl}">${schedulingUrl}</a></p><p>Best regards,<br>Vansh Bhardwaj</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}: ${info.messageId}`);
    return { message: "Scheduling URL sent via email", url: schedulingUrl, email: userEmail };
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send scheduling URL: " + error.message);
  }
}