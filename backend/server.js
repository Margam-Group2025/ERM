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

// all routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/templates", require("./routes/templateRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});