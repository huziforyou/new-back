const mongoose = require('mongoose');

const allowedEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    addedBy: {
        type: String, // Email of the admin who added this
        default: 'System'
    }
}, { timestamps: true });

module.exports = mongoose.model('AllowedEmail', allowedEmailSchema);
