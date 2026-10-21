const Department = require("../models/Department");
const Team = require("../models/Team");

// @route  POST /api/departments
// @desc   Admin creates a new department
const createDepartment = async (req, res) => {
  try {
    const { name, description, hasGroups } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = await Department.create({
      name,
      description,
      hasGroups: !!hasGroups,
    });
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  GET /api/departments
// @desc   Everyone (logged in) can view the list of departments
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  PUT /api/departments/:id
// @desc   Admin updates a department
const updateDepartment = async (req, res) => {
  try {
    const { name, description, hasGroups } = req.body;

    // Turning groups OFF while groups exist would silently widen every Team
    // Leader's access to the whole department, so it's blocked.
    if (hasGroups === false) {
      const groupCount = await Team.countDocuments({ department: req.params.id });
      if (groupCount > 0) {
        return res.status(400).json({
          message:
            "Is department mein groups bane hue hain. Groups OFF karne se pehle unhe delete karo — warna Team Leaders poori department ki reports dekhne lagenge.",
        });
      }
    }

    const updateData = { name, description };
    if (hasGroups !== undefined) updateData.hasGroups = !!hasGroups;

    const department = await Department.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route  DELETE /api/departments/:id
// @desc   Admin deletes a department
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};