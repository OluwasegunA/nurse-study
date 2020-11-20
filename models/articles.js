const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    created_by: {
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
    category: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    created_on: {
        type: Date,
        default: Date.now,
    }
});

const Article = mongoose.model('Article', articleSchema);

exports.Article = Article;