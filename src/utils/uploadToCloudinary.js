const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Upload multiple images to Cloudinary automatically
 * @param {Array} files - Array of file objects from multer
 * @returns {Promise<Array>} - Array of Cloudinary URLs
 */
const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio-services',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
            { width: 800, crop: 'limit' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  });

  return Promise.all(uploadPromises);
};

module.exports = { uploadImagesToCloudinary };