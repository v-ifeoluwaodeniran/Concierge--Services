'use strict';

const Joi = require('joi');

const createListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().max(2000).optional().allow(''),
  listingType: Joi.string().valid('RESTAURANT', 'CLUB', 'CAR_RENTAL', 'BOAT_RENTAL').required(),
  priceType: Joi.string().valid('FIXED', 'PER_HOUR', 'PER_DAY', 'FREE').required(),
  price: Joi.number().min(0).default(0),
  priceUnit: Joi.string().trim().max(50).optional().allow(''),
  capacity: Joi.number().integer().min(1).optional(),
  vehicleMake: Joi.string().trim().max(50).optional().allow(''),
  vehicleModel: Joi.string().trim().max(50).optional().allow(''),
  vehicleYear: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
  isAvailable: Joi.boolean().default(true),
});

const updateListingSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).optional(),
  description: Joi.string().trim().max(2000).optional().allow(''),
  priceType: Joi.string().valid('FIXED', 'PER_HOUR', 'PER_DAY', 'FREE').optional(),
  price: Joi.number().min(0).optional(),
  priceUnit: Joi.string().trim().max(50).optional().allow(''),
  capacity: Joi.number().integer().min(1).optional(),
  vehicleMake: Joi.string().trim().max(50).optional().allow(''),
  vehicleModel: Joi.string().trim().max(50).optional().allow(''),
  vehicleYear: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
  isAvailable: Joi.boolean().optional(),
});

module.exports = { createListingSchema, updateListingSchema };
