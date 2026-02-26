'use strict';

const logger = require('../utils/logger');

/**
 * Stub notification service. Logs all notifications – no actual delivery.
 */

/**
 * Logs a booking confirmation notification.
 * @param {object} booking
 */
const sendBookingConfirmation = (booking) => {
  logger.info(`[Notification] Booking confirmation for ref: ${booking.bookingReference}`, {
    customerId: booking.customerId,
    vendorId: booking.vendorId,
  });
};

/**
 * Logs a booking cancellation notification.
 * @param {object} booking
 */
const sendBookingCancellation = (booking) => {
  logger.info(`[Notification] Booking cancellation for ref: ${booking.bookingReference}`, {
    customerId: booking.customerId,
    vendorId: booking.vendorId,
    reason: booking.cancellationReason,
  });
};

/**
 * Logs a payment confirmation notification.
 * @param {object} booking
 */
const sendPaymentConfirmation = (booking) => {
  logger.info(`[Notification] Payment confirmed for ref: ${booking.bookingReference}`, {
    customerId: booking.customerId,
    amount: booking.totalAmount,
  });
};

module.exports = { sendBookingConfirmation, sendBookingCancellation, sendPaymentConfirmation };
