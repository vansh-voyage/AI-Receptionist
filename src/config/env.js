import dotenv from "dotenv";
dotenv.config();

const {
  MONGODB_URI,
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  CALENDLY_API_KEY,
  CALENDLY_EVENT_TYPE_URI,
  PORT,
} = process.env;

if (!MONGODB_URI || !ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID || !CALENDLY_API_KEY || !CALENDLY_EVENT_TYPE_URI) {
  throw new Error("Missing required environment variables");
}

export {
  MONGODB_URI,
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  CALENDLY_API_KEY,
  CALENDLY_EVENT_TYPE_URI,
  PORT,
};