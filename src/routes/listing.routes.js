'use strict';

const { Router } = require('express');
const listingController = require('../controllers/listing.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadMultiple } = require('../middleware/upload');
const { createListingSchema, updateListingSchema } = require('../validators/listing.validator');

const router = Router();

// Public
router.get('/', listingController.searchListings);
router.get('/:id', listingController.getListing);
router.get('/:id/availability', listingController.checkAvailability);

// Protected – vendor only
router.post('/', authenticate, authorize('VENDOR'), validate(createListingSchema), listingController.createListing);
router.put('/:id', authenticate, authorize('VENDOR'), validate(updateListingSchema), listingController.updateListing);
router.delete('/:id', authenticate, authorize('VENDOR'), listingController.deleteListing);

// Image upload
router.post(
  '/:listingId/images',
  authenticate,
  authorize('VENDOR'),
  uploadMultiple('images', 5, 'listings'),
  listingController.uploadImages
);
router.delete('/:listingId/images/:imageId', authenticate, authorize('VENDOR'), listingController.removeImage);

module.exports = router;
