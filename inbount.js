// import fastifyFormBody from "@fastify/formbody";
// import fastifyWs from "@fastify/websocket";
// import dotenv from "dotenv";
// import Fastify from "fastify";
// import Twilio from "twilio";
// import WebSocket from "ws";
// import { MongoClient } from "mongodb";
// import mongoose from "mongoose";
// dotenv.config();


// const fastify = Fastify();


// // MongoDB Setup
// const { MONGODB_URI, ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID } = process.env;

// if (!MONGODB_URI || !ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
//   console.error("Missing required environment variables");
//   throw new Error("Missing MONGODB_URI, ELEVENLABS_API_KEY, or ELEVENLABS_AGENT_ID");
// }

// mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("[DB] Connected to MongoDB"))
//   .catch(err => console.error("[DB] Connection Error:", err));

// // Define Call Transcript Schema
// const CallTranscript = mongoose.model("CallTranscript", new mongoose.Schema({
//   streamSid: String,
//   transcript: [{ sender: String, message: String, timestamp: Date }],
//   createdAt: { type: Date, default: Date.now }
// }));

// export function registerInboundRoutes(fastify) {

//   // Helper function to get signed URL
//   async function getSignedUrl() {
//     try {
//       const response = await fetch(
//         `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
//         {
//           method: 'GET',
//           headers: { 'xi-api-key': ELEVENLABS_API_KEY }
//         }
//       );
//       if (!response.ok) throw new Error(`Failed to get signed URL: ${response.statusText}`);
//       return (await response.json()).signed_url;
//     } catch (error) {
//       console.error("Error getting signed URL:", error);
//       throw error;
//     }
//   }

//   // Route to handle incoming Twilio calls
//   fastify.all("/incoming-call-eleven", async (request, reply) => {
//     const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
//       <Response>
//         <Connect>
//           <Stream url="wss://${request.headers.host}/media-stream" />
//         </Connect>
//       </Response>`;
//     reply.type("text/xml").send(twimlResponse);
//   });

//   // WebSocket route for handling media streams
//   fastify.register(async (fastifyInstance) => {
//     fastifyInstance.get("/media-stream", { websocket: true }, async (connection, req) => {
//       console.info("[Server] Twilio connected to media stream.");

//       let streamSid = null;
//       let elevenLabsWs = null;
//       let transcript = [];

//       try {
//         const signedUrl = await getSignedUrl();
//         elevenLabsWs = new WebSocket(signedUrl);

//         elevenLabsWs.on("open", () => {
//           console.log("[II] Connected to Conversational AI.");
//           const initialConfig = {
//             type: "conversation_initiation_client_data",
//             conversation_config_override: {
//               agent: {
//                 prompt: { prompt: `You are Inzint AI Receptionist, a professional and courteous virtual assistant responsible for answering inbound calls on behalf of Inzint. Your primary objective is to greet callers warmly, understand their intent, and provide helpful, structured responses. Follow these guidelines:

// Greeting & Identification:

// Answer the call promptly and politely.
// Greet the caller based on the time of day:
// "Good morning/afternoon/evening! Thank you for calling Inzint. My name is Sophie, the virtual receptionist. How may I assist you today?"
// Understanding Caller Intent:

// Listen carefully and identify the reason for the call.
// If unclear, ask: "Could you please provide a little more detail so I can assist you better?"
// Handling Common Inquiries:

// General Information: Provide company details, business hours, and location if requested.
// Customer Support: Collect relevant details and direct to the appropriate department.
// Sales & Services Inquiry: Ask for the caller’s requirements and offer to schedule a follow-up with a sales representative.
// Job Applications: Direct applicants to the careers page or HR contact.
// Handling Call Transfers & Follow-Ups:

// If a call needs to be forwarded, provide the estimated wait time and connect the caller.
// If no immediate assistance is available, offer to take a message:
// "I’ll ensure the right team member reaches out to you. May I have your name, contact details, and a brief message?"
// Ending the Call Gracefully:

// Confirm that all questions were addressed.
// End with a professional and warm closing:
// "Thank you for calling Inzint! Have a great day!"
// Error Handling & Adaptability:

// If the caller is difficult to understand or unresponsive, politely ask them to repeat.
// If an unusual request is made, acknowledge it and assure the caller you’ll find the best way to help.`},
//                 first_message: "Hello there! I am Sophie How can I assist you today?",
//               },
//             }
//           };
//           elevenLabsWs.send(JSON.stringify(initialConfig));
//         });

//         elevenLabsWs.on("message", (data) => {
//           try {
//             const message = JSON.parse(data);
//             handleElevenLabsMessage(message, connection);
//           } catch (error) {
//             console.error("[II] Error parsing message:", error);
//           }
//         });

//         const handleElevenLabsMessage = (message, connection) => {
//           switch (message.type) {
//             case "audio":
//               if (message.audio_event?.audio_base_64) {
//                 connection.send(JSON.stringify({
//                   event: "media",
//                   streamSid,
//                   media: { payload: message.audio_event.audio_base_64 }
//                 }));
//               }
//               break;
//             case "interruption":
//               connection.send(JSON.stringify({ event: "clear", streamSid }));
//               break;
//             case "text":
//               transcript.push({ sender: "AI", message: message.text, timestamp: new Date() });
//               break;
//           }
//         };

//         connection.on("message", async (message) => {
//           try {
//             const data = JSON.parse(message);
//             switch (data.event) {
//               case "start":
//                 streamSid = data.start.streamSid;
//                 console.log(`[Twilio] Stream started with ID: ${streamSid}`);
//                 break;
//               case "media":
//                 if (elevenLabsWs.readyState === WebSocket.OPEN) {
//                   const audioMessage = {
//                     user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64"),
//                   };
//                   elevenLabsWs.send(JSON.stringify(audioMessage));
//                 }
//                 break;
//               case "text":
//                 transcript.push({ sender: "User", message: data.text, timestamp: new Date() });
//                 break;
//               case "stop":
//                 await CallTranscript.create({ streamSid, transcript });
//                 console.log("[DB] Call transcript saved.");
//                 elevenLabsWs.close();
//                 break;
//               default:
//                 console.log(`[Twilio] Received unhandled event: ${data.event}`);
//             }
//           } catch (error) {
//             console.error("[Twilio] Error processing message:", error);
//           }
//         });

//         connection.on("close", () => {
//           elevenLabsWs.close();
//           console.log("[Twilio] Client disconnected");
//         });

//         elevenLabsWs.on("error", (error) => {
//           console.error("[II] WebSocket error:", error);
//         });

//         connection.on("error", (error) => {
//           console.error("[Twilio] WebSocket error:", error);
//           elevenLabsWs.close();
//         });
//       } catch (error) {
//         console.error("[Server] Error initializing conversation:", error);
//         if (elevenLabsWs) {
//           elevenLabsWs.close();
//         }
//       }
//     });
//   });
// }
