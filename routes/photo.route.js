// const express = require('express');
// const axios = require('axios');
// const Image = require('../models/Image.model');
// const router = express.Router();
// const exifr = require('exifr');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const { getImageStatsByMonth, syncImages, getPhotos, getImagesByUploadedBy, getFirstEmailImage, getSecondEmailImage, getThirdEmailImage } = require('../controllers/photo.controller');

// // ✅ SYNC IMAGES AND SAVE IN DB
// router.get('/sync-images', syncImages);

// // ✅ GET PHOTOS
// router.get('/get-photos', getPhotos);

// router.get('/get-image-by-month', getImageStatsByMonth)

// router.get('/getImages/:uploadedBy', getImagesByUploadedBy);

// router.get('/get1stEmailPhotos', getFirstEmailImage)

// router.get('/get2ndEmailPhotos', getSecondEmailImage)

// router.get('/get3rdEmailPhotos', getThirdEmailImage)

// module.exports = router;



const express = require('express');
const router = express.Router();

// ✅ Import all necessary controller functions
const {
  syncImages,
  getPhotos,
  getImageDataById, // ✅ Import the new function
  getImageStatsByMonth,
  getImagesByUploadedBy,
  getFirstEmailImage,
  getSecondEmailImage,
  getThirdEmailImage
} = require('../controllers/photo.controller');

// ✅ SYNC IMAGES FROM DRIVE AND SAVE IN DB
router.get('/sync-images', syncImages);

// ✅ GET ALL PHOTO METADATA (without the image data)
router.get('/get-photos', getPhotos);

// ✅ NEW: GET IMAGE BINARY DATA BY ID (for use in <img> src attribute)
router.get('/image-data/:id', getImageDataById);

// ✅ STATS AND OTHER ROUTES
router.get('/get-image-by-month', getImageStatsByMonth);
router.get('/getImages/:uploadedBy', getImagesByUploadedBy);
router.get('/get1stEmailPhotos', getFirstEmailImage);
router.get('/get2ndEmailPhotos', getSecondEmailImage);
router.get('/get3rdEmailPhotos', getThirdEmailImage);

module.exports = router;