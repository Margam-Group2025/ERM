const mongoose = require("mongoose");
const { Schema } = mongoose;

const fieldSchema = new Schema(
  {
    key: {
      type: String,
      required: true, // e.g. "workingHours" -> used inside Report.data
      trim: true,
    },
    label: {
      type: String,
      required: true, // e.g. "Working Hours" -> shown to the employee
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "textarea", "number", "date", "select", "checkbox", "file"],
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      // only used when type === "select"
      type: [String],
      default: undefined,
    },
    order: {
      // controls display order in the form
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const reportTemplateSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    role: {
      // which role this template is for — lets Admin define a different
      // form for Employees vs Team Leads in the same department
      type: String,
      enum: ["employee", "teamlead"],
      required: true,
      default: "employee",
    },
    fields: {
      type: [fieldSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// one active template per department + reportType + role combo
reportTemplateSchema.index(
  { department: 1, reportType: 1, role: 1 },
  { unique: true }
);

module.exports = mongoose.model("ReportTemplate", reportTemplateSchema);