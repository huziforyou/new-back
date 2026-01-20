// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    statusaccess: {
      type: String,
      enum: ['approved', 'denied', 'pending'],
      default: 'pending',
    },
    permissions: {
      type: [String],
      default: [], // 🚀 no access by default
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
