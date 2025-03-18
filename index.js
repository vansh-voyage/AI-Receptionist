import Fastify from "fastify";
import { registerInboundRoutes } from "./src/routes/inboundRoutes.js";
import { MONGODB_URI } from "./src/config/env.js"; // Remove PORT if not defined in env.js
import mongoose from "mongoose";

const fastify = Fastify();

// Default route for testing
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Welcome to Inzint AI Receptionist" });
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("[DB] Connected to MongoDB"))
  .catch(err => console.error("[DB] Connection Error:", err));

// Register routes
registerInboundRoutes(fastify);

// Use PORT from environment or fallback to 3000
const PORT = process.env.PORT || 3000;

// Start the server
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`🚀 Server running at ${address}`);
});