const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

const Activity = mongoose.model("Activity", activitySchema);

exports.Activity = Activity;
