'use strict';

const Joi = require('joi');

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const operatingHoursSchema = Joi.object(
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].reduce((acc, day) => {
    acc[day] = Joi.object({
      open: Joi.string().pattern(timePattern).required(),
      close: Joi.string().pattern(timePattern).required(),
    }).optional();
    return acc;
  }, {})
);

const createVendorSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(100).required(),
  businessType: Joi.string().valid('RESTAURANT', 'CLUB', 'CAR_RENTAL', 'BOAT_RENTAL').required(),
  description: Joi.string().trim().max(1000).optional(),
  address: Joi.string().trim().max(200).required(),
  city: Joi.string().trim().max(100).required(),
  state: Joi.string().trim().max(100).required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  operatingHours: operatingHoursSchema.optional(),
});

const updateVendorSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(1000).optional().allow(''),
  address: Joi.string().trim().max(200).optional(),
  city: Joi.string().trim().max(100).optional(),
  state: Joi.string().trim().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  operatingHours: operatingHoursSchema.optional(),
});

module.exports = { createVendorSchema, updateVendorSchema, operatingHoursSchema };
