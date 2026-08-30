const mongoose = require("mongoose");
const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Backend Team", "Field Sales"
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    teamLead: {
      type: Schema.Types.ObjectId,
      ref: "User", // will point to a User with role "teamlead"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);