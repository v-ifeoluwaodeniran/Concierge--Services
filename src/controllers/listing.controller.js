'use strict';

const listingService = require('../services/listing.service');
const cloudinaryService = require('../services/cloudinary.service');
const { sendResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

const searchListings = async (req, res, next) => {
  try {
    const { type, priceMin, priceMax, city, vendorId, isAvailable, page = 1, limit = 10 } = req.query;
    const result = await listingService.searchListings({ type, priceMin, priceMax, city, vendorId, isAvailable }, page, limit);
    return sendResponse(res, 200, 'Listings retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const getListing = async (req, res, next) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    return sendResponse(res, 200, 'Listing retrieved', listing);
  } catch (err) {
    return next(err);
  }
};

const createListing = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found. Create a vendor profile first.', 404);
    const listing = await listingService.createListing(vendorProfile.id, req.body);
    return sendResponse(res, 201, 'Listing created', listing);
  } catch (err) {
    return next(err);
  }
};

const updateListing = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const listing = await listingService.getListingById(req.params.id);
    if (listing.vendorId !== vendorProfile.id) {
      throw new AppError('You can only update your own listings', 403);
    }

    const updated = await listingService.updateListing(req.params.id, req.body);
    return sendResponse(res, 200, 'Listing updated', updated);
  } catch (err) {
    return next(err);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const listing = await listingService.getListingById(req.params.id);
    if (listing.vendorId !== vendorProfile.id) {
      throw new AppError('You can only delete your own listings', 403);
    }

    await listingService.deleteListing(req.params.id);
    return sendResponse(res, 200, 'Listing deleted');
  } catch (err) {
    return next(err);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const { listingId } = req.params;
    const listing = await listingService.getListingById(listingId);
    if (listing.vendorId !== vendorProfile.id) {
      throw new AppError('You can only upload images to your own listings', 403);
    }

    const files = req.files;
    if (!files || files.length === 0) throw new AppError('No images provided', 400);

    const images = await Promise.all(
      files.map(async (file, index) => {
        const { imageUrl, publicId } = await cloudinaryService.uploadImage(file, 'listings');
        return listingService.addListingImage(listingId, imageUrl, publicId, index === 0);
      })
    );

    return sendResponse(res, 201, 'Images uploaded', images);
  } catch (err) {
    return next(err);
  }
};

const removeImage = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const { listingId, imageId } = req.params;
    const listing = await listingService.getListingById(listingId);
    if (listing.vendorId !== vendorProfile.id) {
      throw new AppError('You can only remove images from your own listings', 403);
    }

    await listingService.removeListingImage(listingId, imageId);
    return sendResponse(res, 200, 'Image removed');
  } catch (err) {
    return next(err);
  }
};

const checkAvailability = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await listingService.checkAvailability(req.params.id, startDate, endDate);
    return sendResponse(res, 200, 'Availability checked', result);
  } catch (err) {
    return next(err);
  }
};

module.exports = { searchListings, getListing, createListing, updateListing, deleteListing, uploadImages, removeImage, checkAvailability };
