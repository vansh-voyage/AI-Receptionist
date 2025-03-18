import mongoose from "mongoose";

const callTranscriptSchema = new mongoose.Schema({
  streamSid: String,
  transcript: [{ sender: String, message: String, timestamp: Date }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("CallTranscript", callTranscriptSchema);