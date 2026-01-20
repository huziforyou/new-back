// utils/googleDrive.js
const axios = require('axios');

async function getFreshThumbnail(fileId, accessToken) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.thumbnailLink;
  } catch (error) {
    console.error(`❌ Error refreshing thumbnail for ${fileId}:`, error?.response?.data || error.message);
    return null;
  }
}

module.exports = { getFreshThumbnail };
