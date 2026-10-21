const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      // lets the frontend pick an icon/link later if needed
      type: String,
      enum: [
        "task_assigned",
        "report_reviewed",
        "report_sent_back",
        "edit_request",
        "edit_approved",
        "edit_denied",
        "admin_review_pending",
        "admin_review_decision",
      ],
      required: true,
    },
    relatedId: {
      // e.g. the Task or Report this notification is about
      type: Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);