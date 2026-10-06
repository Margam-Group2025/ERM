const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    reportTemplate: {
      type: Schema.Types.ObjectId,
      ref: "ReportTemplate",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    data: {
      // dynamic key-value pairs matching the template's fields
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "sent_back"],
      default: "draft",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewComment: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    attachment: {
      type: new Schema(
        {
          url: String,
          filename: String,
        },
        { _id: false }
      ),
      default: undefined,
    },
    // employee needs their Team Lead's approval to edit; Team Lead needs
    // Admin's approval. "approved" is single-use — consumed on the next save.
    editRequest: {
      type: new Schema(
        {
          status: {
            type: String,
            enum: ["none", "pending", "approved", "denied"],
            default: "none",
          },
          requestedAt: Date,
          respondedAt: Date,
          respondedBy: { type: Schema.Types.ObjectId, ref: "User" },
        },
        { _id: false }
      ),
      default: () => ({ status: "none" }),
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedFields: {
      // keys (from `data`) whose value has been changed since first submission
      type: [String],
      default: [],
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// speeds up Admin/Team Lead filtering
reportSchema.index({ department: 1, reportType: 1, reportDate: -1 });
reportSchema.index({ employee: 1, reportDate: -1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model("Report", reportSchema);