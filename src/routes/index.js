'use strict';

const { Router } = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor.routes');
const listingRoutes = require('./listing.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const payoutRoutes = require('./payout.routes');
const reviewRoutes = require('./review.routes');
const adminRoutes = require('./admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/listings', listingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/payouts', payoutRoutes);
router.use('/reviews', reviewRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
