const mongoose = require("mongoose");

async function connectToDb(mongoUri) {
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error", err);
  });

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB disconnected");
  });

  // Works with MongoDB Atlas/Compass connection strings (mongodb+srv://...).
  await mongoose.connect(mongoUri, { autoIndex: true });

  // Graceful shutdown (Render / local dev).
  process.once("SIGINT", async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  process.once("SIGTERM", async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}

module.exports = { connectToDb };

