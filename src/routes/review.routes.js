'use strict';

const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// List reviews for a vendor (public)
router.get('/vendor/:vendorId', reviewController.listReviews);

// Create review – customer only
router.post('/', authenticate, authorize('CUSTOMER'), reviewController.createReview);

// Vendor responds to review
router.post('/:id/respond', authenticate, authorize('VENDOR'), reviewController.respondToReview);

module.exports = router;
