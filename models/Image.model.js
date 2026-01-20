// const mongoose = require('mongoose');

// const imageSchema = new mongoose.Schema({
//   ImageURL: {
//     type: String,
//     default: null,
//   },
//   fileId: {
//     type: String,
//     unique: true,
//     required: true,
//   },
//   name: String,
//   mimeType: String,
//   latitude: Number,
//   longitude: Number,
//   uploadedBy: String,
//   lastCheckedAt: {
//     type: Date,
//     default: null,
//   },
//   district: String,
//   village: String,
//   tehsil: String,
//   country: String,
//   timestamp: {
//     type: Date,
//     required: true,
//     index: true,
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('Image', imageSchema);


// const mongoose = require('mongoose');

// const imageSchema = new mongoose.Schema({
//   ImageURL: { type: String, default: null },
//   fileId: { type: String, unique: true, required: true },
//   name: String,
//   mimeType: String,
//   latitude: Number,
//   longitude: Number,
//   uploadedBy: String,
//   lastCheckedAt: { type: Date, default: null },
//   district: String,
//   village: String,
//   tehsil: String,
//   country: String,
//   timestamp: { type: Date, required: true, index: true }
// }, { timestamps: true });

// module.exports = mongoose.model('Image', imageSchema);



const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  fileId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mimeType: { type: String, required: true },
  //  Store image data directly in the database as a Buffer
  imageData: { type: Buffer, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  timestamp: { type: Date },
  uploadedBy: { type: String },
  lastCheckedAt: { type: Date },
  // district: { type: String },
  // tehsil: { type: String },
  // village: { type: String },
  // country: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);
