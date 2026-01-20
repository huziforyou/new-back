
const axios = require('axios');
const exifr = require('exifr');

const Image = require('../models/Image.model');
const AllowedEmail = require('../models/AllowedEmail.model');

// ✅ MODIFIED: Downloads a file from Google Drive directly into a memory buffer.
const downloadFileToBuffer = async (fileId, accessToken) => {
  const response = await axios.get(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'arraybuffer' // Crucial: tells axios to receive binary data as a buffer
    }
  );
  return Buffer.from(response.data, 'binary');
};

// ✅ Reverse Geocoding via Google API (No changes needed)
const getPlaceDetails = async (lat, lng) => {
  try {
    const res = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: { latlng: `${lat},${lng}`, key: process.env.GOOGLE_GEOCODING_API_KEY }
    });

    if (res.data.status === "OK" && res.data.results.length > 0) {
      const components = res.data.results[0].address_components;
      const extract = (type) => components.find((c) => c.types.includes(type))?.long_name || "";

      return {
        district: extract("administrative_area_level_2") || extract("administrative_area_level_1") || "",
        tehsil: extract("administrative_area_level_3") || extract("sublocality_level_1") || "",
        village: extract("locality") || extract("sublocality") || extract("neighborhood") || "",
        country: extract("country") || ""
      };
    }
    return { district: "", tehsil: "", village: "", country: "" };
  } catch (err) {
    console.error("❌ Geocode error:", err.message);
    return { district: "", tehsil: "", village: "", country: "" };
  }
};

// ✅ MODIFIED: Syncs Google Drive images directly to the database.
const syncImages = async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send('Not authenticated');
  const accessToken = req.user.accessToken;
  // Check for custom redirect URL in query
  const redirectUrl = req.query.redirect || `${process.env.FRONTEND_URL}/home`;

  try {
    let files = [];
    let nextPageToken = null;

    do {
      const driveResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          q: "mimeType contains 'image/' and trashed=false",
          fields: 'nextPageToken, files(id, name, mimeType, createdTime)',
          pageToken: nextPageToken
        }
      });

      files.push(...(driveResponse.data.files || []));
      nextPageToken = driveResponse.data.nextPageToken;
    } while (nextPageToken);

    console.log(`✅ Total files fetched: ${files.length}`);

    // Get allowed emails from DB
    const allowedEmailDocs = await AllowedEmail.find();
    const allowedEmailsList = allowedEmailDocs.map(doc => doc.email.toLowerCase());

    const uploaderEmail = req.user.email.toLowerCase();

    // Optional: Strictly enforce allowed list (Uncomment if needed)
    // if (!allowedEmailsList.includes(uploaderEmail)) {
    //    console.log(`User ${uploaderEmail} is not in allowed list.`);
    // }

    for (const file of files) {
      try {
        const exists = await Image.findOne({ fileId: file.id });
        if (exists) continue;

        // Download image from Google Drive into a buffer
        const imageBuffer = await downloadFileToBuffer(file.id, accessToken);

        let latitude = null, longitude = null;
        let timestamp = new Date(file.createdTime || Date.now());

        try {
          if (['image/jpeg', 'image/jpg', 'image/tiff'].includes(file.mimeType)) {
            // Parse EXIF data directly from the buffer
            const exifData = await exifr.parse(imageBuffer);
            if (exifData) {
              latitude = exifData.latitude || null;
              longitude = exifData.longitude || null;
              if (exifData.DateTimeOriginal) {
                timestamp = new Date(exifData.DateTimeOriginal);
              }
            }
          }
        } catch (err) {
          console.warn(`⚠️ EXIF error for ${file.name}:`, err.message);
        }

        let placeDetails = { district: "", tehsil: "", village: "", country: "" };
        if (latitude && longitude) {
          placeDetails = await getPlaceDetails(latitude, longitude);
        }

        // Create a new document in the database with the image data
        await Image.create({
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          imageData: imageBuffer, // ✅ Save the image buffer directly
          latitude,
          longitude,
          timestamp,
          uploadedBy: uploaderEmail, // ✅ Store as lowercase
          lastCheckedAt: new Date(),
          ...placeDetails
        });
      } catch (fileErr) {
        console.error(`❌ Error processing file ${file.name}:`, fileErr.message);
      }
    }

    res.redirect(redirectUrl);
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).send('Failed to sync images');
  }
};

// ✅ Get all photo metadata (excluding the large image buffer for performance)
const getPhotos = async (req, res) => {
  try {
    const photos = await Image.find().select('-imageData').sort({ createdAt: -1 });
    res.status(200).json({ photos });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// ✅ NEW: Get a single image's binary data by its database ID
const getImageDataById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image || !image.imageData) {
      return res.status(404).send('Image not found');
    }
    // Set the correct content-type header and send the binary data
    res.set('Content-Type', image.mimeType);
    res.send(image.imageData);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};


// --- STATS AND OTHER HELPERS (No major changes needed below) ---


// ✅ Monthly Stats (month + uploader + count)
const getImageStatsByMonth = async (req, res) => {
  try {
    const monthlyStats = await Image.aggregate([
      { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$timestamp" } }, uploadedBy: "$uploadedBy" }, count: { $sum: 1 } } },
      { $project: { month: "$_id.month", uploadedBy: "$_id.uploadedBy", count: 1, _id: 0 } },
      { $sort: { month: 1 } }
    ]);
    const uniqueUploaders = [...new Set(monthlyStats.map((s) => s.uploadedBy).filter(Boolean))];
    res.status(200).json({ stats: monthlyStats, uniqueUploaders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get monthly stats', error: err.message });
  }
};

// ✅ Yearly Stats
const getImageStatsByYear = async (req, res) => {
  try {
    const yearlyStats = await Image.aggregate([
      { $group: { _id: { year: { $dateToString: { format: "%Y", date: "$timestamp" } }, uploadedBy: "$uploadedBy" }, count: { $sum: 1 } } },
      { $project: { year: "$_id.year", uploadedBy: "$_id.uploadedBy", count: 1, _id: 0 } },
      { $sort: { year: 1 } }
    ]);
    res.status(200).json({ stats: yearlyStats });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get yearly stats', error: err.message });
  }
};

// ✅ Daily Stats
const getImageStatsByDay = async (req, res) => {
  try {
    const dailyStats = await Image.aggregate([
      { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, uploadedBy: "$uploadedBy" }, count: { $sum: 1 } } },
      { $project: { date: "$_id.date", uploadedBy: "$_id.uploadedBy", count: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);
    res.status(200).json({ stats: dailyStats });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get daily stats', error: err.message });
  }
};

// ✅ Other helpers
const getImagesByUploadedBy = async (req, res) => {
  try {
    const { uploadedBy } = req.params;
    const photos = await Image.find({ uploadedBy }).select('-imageData');
    res.status(200).json({ photos });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ Deprecated static email functions. Use getImagesByUploadedBy instead.
// I am keeping the generic one and removing the hardcoded ones.


module.exports = {
  syncImages,
  getPhotos,
  getImageDataById, // Make sure to export the new function
  getImageStatsByMonth,
  getImageStatsByYear,
  getImageStatsByDay,
  getImagesByUploadedBy
};
