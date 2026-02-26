'use strict';

const Joi = require('joi');

const createBookingSchema = Joi.object({
  listingId: Joi.string().required(),
  bookingType: Joi.string().valid('RESERVATION', 'RENTAL').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  guestCount: Joi.number().integer().min(1).optional(),
  specialRequests: Joi.string().trim().max(500).optional().allow(''),
  subtotal: Joi.number().min(0).optional(),
});

const reportBillSchema = Joi.object({
  billAmount: Joi.number().min(0).required(),
});

const cancelBookingSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional().allow(''),
});

module.exports = { createBookingSchema, reportBillSchema, cancelBookingSchema };
