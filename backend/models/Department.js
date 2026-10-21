const mongoose = require("mongoose");
const { Schema } = mongoose;

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true, // e.g. "Development", "Sales", "Marketing"
    },
    description: {
      type: String,
      trim: true,
    },
    // true for departments organised into groups (e.g. CRM -> Group 1 / Group 2).
    // Existing departments stay false, so nothing about them changes.
    hasGroups: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);