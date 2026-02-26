'use strict';

const vendorService = require('../services/vendor.service');
const { sendResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

const listVendors = async (req, res, next) => {
  try {
    const { type, city, isVerified, page = 1, limit = 10 } = req.query;
    const result = await vendorService.listVendors({ type, city, isVerified }, page, limit);
    return sendResponse(res, 200, 'Vendors retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const getVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    return sendResponse(res, 200, 'Vendor retrieved', vendor);
  } catch (err) {
    return next(err);
  }
};

const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.user.id, req.body);
    return sendResponse(res, 201, 'Vendor profile created', vendor);
  } catch (err) {
    return next(err);
  }
};

const updateVendor = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);
    const updated = await vendorService.updateVendor(vendorProfile.id, req.body);
    return sendResponse(res, 200, 'Vendor profile updated', updated);
  } catch (err) {
    return next(err);
  }
};

const getVendorListings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await vendorService.getVendorListings(req.params.id, page, limit);
    return sendResponse(res, 200, 'Vendor listings retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const getVendorReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await vendorService.getVendorReviews(req.params.id, page, limit);
    return sendResponse(res, 200, 'Vendor reviews retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const updateOperatingHours = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);
    const updated = await vendorService.updateOperatingHours(vendorProfile.id, req.body);
    return sendResponse(res, 200, 'Operating hours updated', updated);
  } catch (err) {
    return next(err);
  }
};

module.exports = { listVendors, getVendor, createVendor, updateVendor, getVendorListings, getVendorReviews, updateOperatingHours };
