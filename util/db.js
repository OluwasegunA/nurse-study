const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
    console.log("starting db connection");
    const uri = process.env.DB_URI;

    mongoose.set("useCreateIndex", true);

    return mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
}

module.exports = connectDB