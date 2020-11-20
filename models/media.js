const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    added_by: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    section_id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    added_on: {
        type: Date,
        default: Date.now,
    }
});

const Media = mongoose.model('Media', mediaSchema);

exports.Media = Media;