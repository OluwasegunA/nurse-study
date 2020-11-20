const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    created_by: {
        type: String,
        required: true,
    },
    section_id: {
        type: String,
        required: true
    },
    questions: {
        type: Array,
        default: [],
        required: true,
    },
    created_on: {
        type: Date,
        default: Date.now,
    }
});

const Quiz = mongoose.model('Quiz', quizSchema);

exports.Quiz = Quiz;