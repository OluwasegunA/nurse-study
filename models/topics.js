const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
    created_by: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    created_on: {
        type: Date,
        default: Date.now,
    }
});

const Topic = mongoose.model('Topic', topicSchema);

exports.Topic = Topic;