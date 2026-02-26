'use strict';

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const buildStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `concierge-services/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

/**
 * Returns multer middleware for single-file upload.
 * @param {string} field - Form field name
 * @param {string} [folder='general'] - Cloudinary folder
 */
const uploadSingle = (field, folder = 'general') =>
  multer({ storage: buildStorage(folder), limits: { fileSize: 5 * 1024 * 1024 } }).single(field);

/**
 * Returns multer middleware for multiple-file upload.
 * @param {string} field - Form field name
 * @param {number} [max=5] - Maximum number of files
 * @param {string} [folder='general'] - Cloudinary folder
 */
const uploadMultiple = (field, max = 5, folder = 'general') =>
  multer({ storage: buildStorage(folder), limits: { fileSize: 5 * 1024 * 1024 } }).array(field, max);

module.exports = { uploadSingle, uploadMultiple };
