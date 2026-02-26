'use strict';

const bookingService = require('../services/booking.service');
const notificationService = require('../services/notification.service');
const { sendResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.user.id, req.body);
    notificationService.sendBookingConfirmation(booking);
    return sendResponse(res, 201, 'Booking created', booking);
  } catch (err) {
    return next(err);
  }
};

const listBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await bookingService.listBookings(req.user.id, req.user.userType, page, limit);
    return sendResponse(res, 200, 'Bookings retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    // Access control: customer, vendor, or admin
    const isCustomer = booking.customerId === req.user.id;
    const isVendor = booking.vendor && req.user.vendorProfile && booking.vendorId === req.user.vendorProfile.id;
    const isAdmin = req.user.userType === 'ADMIN';
    if (!isCustomer && !isVendor && !isAdmin) throw new AppError('Access denied', 403);

    return sendResponse(res, 200, 'Booking retrieved', booking);
  } catch (err) {
    return next(err);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);
    const booking = await bookingService.confirmBooking(req.params.id, vendorProfile.id);
    return sendResponse(res, 200, 'Booking confirmed', booking);
  } catch (err) {
    return next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id, reason);
    notificationService.sendBookingCancellation(booking);
    return sendResponse(res, 200, 'Booking cancelled', booking);
  } catch (err) {
    return next(err);
  }
};

const completeBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.completeBooking(req.params.id);
    return sendResponse(res, 200, 'Booking completed', booking);
  } catch (err) {
    return next(err);
  }
};

const reportBill = async (req, res, next) => {
  try {
    const { billAmount } = req.body;
    const booking = await bookingService.reportBill(req.params.id, billAmount);
    return sendResponse(res, 200, 'Bill reported and booking completed', booking);
  } catch (err) {
    return next(err);
  }
};

module.exports = { createBooking, listBookings, getBooking, confirmBooking, cancelBooking, completeBooking, reportBill };
