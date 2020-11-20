const mongoose = require("mongoose");

const theorySchema = new mongoose.Schema({
  section_id: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
});

const TheoryQuestion = mongoose.model("TheoryQuestion", theorySchema);

exports.TheoryQuestion = TheoryQuestion;
