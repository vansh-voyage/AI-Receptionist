import { getSignedUrl, createElevenLabsWebSocket } from "../services/elevenLabsService.js";
import { scheduleCalendlyEvent } from "../services/calendlyService.js";
import { extractUserDetails } from "../utils/extractUserDetails.js";
import CallTranscript from "../models/CallTranscript.js";

export function registerInboundRoutes(fastify) {
  fastify.all("/incoming-call-eleven", async (request, reply) => {
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Connect>
          <Stream url="wss://${request.headers.host}/media-stream" />
        </Connect>
      </Response>`;
    reply.type("text/xml").send(twimlResponse);
  });

  fastify.register(async (fastifyInstance) => {
    fastifyInstance.get("/media-stream", { websocket: true }, async (connection, req) => {
      console.info("[Server] Twilio connected to media stream.");

      let streamSid = null;
      let elevenLabsWs = null;
      let transcript = [];

      try {
        const signedUrl = await getSignedUrl();
        elevenLabsWs = createElevenLabsWebSocket(
          signedUrl,
          (data) => handleElevenLabsMessage(data, connection),
          (error) => console.error("[II] WebSocket error:", error)
        );

        connection.on("message", async (message) => {
          try {
            const data = JSON.parse(message);
            switch (data.event) {
              case "start":
                streamSid = data.start.streamSid;
                console.log(`[Twilio] Stream started with ID: ${streamSid}`);
                break;
              case "media":
                if (elevenLabsWs.readyState === WebSocket.OPEN) {
                  const audioMessage = {
                    user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64"),
                  };
                  elevenLabsWs.send(JSON.stringify(audioMessage));
                }
                break;
              case "text":
                transcript.push({ sender: "User", message: data.text, timestamp: new Date() });
                break;
              case "stop":
                await CallTranscript.create({ streamSid, transcript });
                console.log("[DB] Call transcript saved.");

                // Extract user details from the transcript
                const { userName, userEmail } = extractUserDetails(transcript);

                if (userName && userEmail) {
                  console.log(`[User Details] Name: ${userName}, Email: ${userEmail}`);

                  // Schedule a meeting using Calendly API
                  try {
                    const calendlyResponse = await scheduleCalendlyEvent(userEmail, userName);
                    console.log("[Calendly] Meeting scheduled:", calendlyResponse);
                  } catch (error) {
                    console.error("[Calendly] Failed to schedule meeting:", error);
                  }
                } else {
                  console.log("[User Details] Name or email not found in transcript.");
                }

                elevenLabsWs.close();
                break;
              default:
                console.log(`[Twilio] Received unhandled event: ${data.event}`);
            }
          } catch (error) {
            console.error("[Twilio] Error processing message:", error);
          }
        });

        connection.on("close", () => {
          elevenLabsWs.close();
          console.log("[Twilio] Client disconnected");
        });

        connection.on("error", (error) => {
          console.error("[Twilio] WebSocket error:", error);
          elevenLabsWs.close();
        });
      } catch (error) {
        console.error("[Server] Error initializing conversation:", error);
        if (elevenLabsWs) {
          elevenLabsWs.close();
        }
      }
    });
  });
}