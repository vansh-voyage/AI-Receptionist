import axios from "axios";
import { CALENDLY_API_KEY, CALENDLY_EVENT_TYPE_URI } from "../config/env.js";

export async function scheduleCalendlyEvent(userEmail, userName) {
  try {
    const response = await axios.post(
      "https://api.calendly.com/scheduled_events",
      {
        event_type: CALENDLY_EVENT_TYPE_URI,
        invitee: {
          email: userEmail,
          name: userName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CALENDLY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error scheduling Calendly event:", error.response?.data || error.message);
    throw error;
  }
}