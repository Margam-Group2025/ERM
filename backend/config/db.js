const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // stop the server if DB doesn't connect
  }
};

module.exports = connectDB;