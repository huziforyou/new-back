// models/User.js
const mongoose = require('mongoose');

const requestsSchema = new mongoose.Schema(
  { 
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);


module.exports = mongoose.model('Requests', requestsSchema);