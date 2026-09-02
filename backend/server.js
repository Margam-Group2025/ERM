require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// connect to MongoDB
connectDB();

// middleware
// allow any localhost port during development (Vite shifts ports if 5173
// is busy), plus the deployed frontend URL in production
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman/server-to-server calls
      if (origin.startsWith("http://localhost:")) return callback(null, true);
      if (origin === process.env.FRONTEND_URL) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
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
app.use("/api/uploads", require("./routes/uploadRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});