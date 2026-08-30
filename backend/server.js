require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// connect to MongoDB
connectDB();

// middleware
// allow requests only from your deployed frontend (and localhost for local dev)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // set this in Render's env vars after Vercel deploy
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json()); // lets us read req.body in JSON

// simple test route to confirm the server is alive
app.get("/", (req, res) => {
  res.send("API is running...");
});

// routes will be added here later, e.g.:
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/reports", require("./routes/reportRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});