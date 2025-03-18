import Fastify from "fastify";
import { registerInboundRoutes } from "./routes/inboundRoutes.js";
import { MONGODB_URI, PORT } from "./config/env.js";
import mongoose from "mongoose";

const fastify = Fastify();

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("[DB] Connected to MongoDB"))
  .catch(err => console.error("[DB] Connection Error:", err));

// Register routes
registerInboundRoutes(fastify);

// Start the server
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`🚀 Server running at ${address}`);
});