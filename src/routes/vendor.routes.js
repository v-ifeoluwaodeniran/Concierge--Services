'use strict';

const { Router } = require('express');
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createVendorSchema, updateVendorSchema, operatingHoursSchema } = require('../validators/vendor.validator');

const router = Router();

// Public
router.get('/', vendorController.listVendors);
router.get('/:id', vendorController.getVendor);
router.get('/:id/listings', vendorController.getVendorListings);
router.get('/:id/reviews', vendorController.getVendorReviews);

// Protected – vendor only
router.post('/', authenticate, authorize('VENDOR'), validate(createVendorSchema), vendorController.createVendor);
router.put('/me', authenticate, authorize('VENDOR'), validate(updateVendorSchema), vendorController.updateVendor);
router.put('/me/hours', authenticate, authorize('VENDOR'), validate(operatingHoursSchema), vendorController.updateOperatingHours);

module.exports = router;
