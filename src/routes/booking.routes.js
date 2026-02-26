'use strict';

const { Router } = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingSchema, reportBillSchema, cancelBookingSchema } = require('../validators/booking.validator');

const router = Router();

router.use(authenticate);

router.post('/', authorize('CUSTOMER'), validate(createBookingSchema), bookingController.createBooking);
router.get('/', bookingController.listBookings);
router.get('/:id', bookingController.getBooking);
router.post('/:id/confirm', authorize('VENDOR'), bookingController.confirmBooking);
router.post('/:id/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);
router.post('/:id/complete', authorize('VENDOR', 'ADMIN'), bookingController.completeBooking);
router.post('/:id/report-bill', authorize('VENDOR'), validate(reportBillSchema), bookingController.reportBill);

module.exports = router;
