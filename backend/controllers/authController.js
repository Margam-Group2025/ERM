const jwt = require("jsonwebtoken");
const User = require("../models/User");

// helper: creates a JWT that stores the user's id and role
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// @route  POST /api/auth/register
// @desc   Create a new user (Admin will normally do this for teamlead/employee)
const registerUser = async (req, res) => {
  try {
    const { employeeId, name, email, password, role, department, team } = req.body;

    if (!employeeId || !name || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ employeeId });
    if (existingUser) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    // password gets hashed automatically by the pre-save hook in User.js
    const user = await User.create({
      employeeId,
      name,
      email,
      password,
      role,
      department,
      team,
    });

    res.status(201).json({
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department,
      team: user.team,
      token: generateToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  POST /api/auth/login
// @desc   Login with employeeId + password
const loginUser = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: "Employee ID and password required" });
    }

    const user = await User.findOne({ employeeId });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      _id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      department: user.department,
      team: user.team,
      token: generateToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser };