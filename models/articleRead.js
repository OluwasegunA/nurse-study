const mongoose = require("mongoose");

const readSchema = new mongoose.Schema({
  user_id:{
    type: String,
    required: true,
  },
  read: {
    type: Array
  }
});

const ReadArticle = mongoose.model('Read', readSchema);

exports.ReadArticle = ReadArticle;