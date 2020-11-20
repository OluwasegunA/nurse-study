const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    created_by: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        unique: true
    },
    image_link: {
        type: String,
        required: true,
        unique: true
    },
    created_on: {
        type: Date,
        default: Date.now,
    }
});

const Section = mongoose.model('Section', sectionSchema);

exports.Section = Section;