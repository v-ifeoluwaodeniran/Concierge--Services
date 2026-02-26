'use strict';

const cloudinary = require('../config/cloudinary');
const { AppError } = require('../utils/errors');

/**
 * Uploads an image file to Cloudinary.
 * @param {object} file - Multer file object
 * @param {string} [folder='general'] - Target Cloudinary folder
 * @returns {{ imageUrl: string, publicId: string }}
 */
const uploadImage = async (file, folder = 'general') => {
  if (!file) throw new AppError('No file provided', 400);

  // If multer-storage-cloudinary was used, file already has path/public_id
  if (file.path && file.filename) {
    return { imageUrl: file.path, publicId: file.filename };
  }

  // Fallback: upload buffer directly
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `concierge-services/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(new AppError('Image upload failed', 500));
        return resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
};

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param {string} publicId
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

module.exports = { uploadImage, deleteImage };
