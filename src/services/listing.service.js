'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');
const { paginate, paginateResponse } = require('../utils/helpers');

/**
 * Searches listings with optional filters.
 */
const searchListings = async (filters = {}, page = 1, limit = 10) => {
  const { type, priceMin, priceMax, city, vendorId, isAvailable } = filters;
  const where = {};
  if (type) where.listingType = type;
  if (vendorId) where.vendorId = vendorId;
  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true' || isAvailable === true;
  if (priceMin !== undefined) where.price = { ...where.price, gte: parseFloat(priceMin) };
  if (priceMax !== undefined) where.price = { ...where.price, lte: parseFloat(priceMax) };
  if (city) where.vendor = { city: { contains: city, mode: 'insensitive' }, isActive: true };

  const { skip, take } = paginate(page, limit);
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        vendor: { select: { id: true, businessName: true, city: true, state: true, rating: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.count({ where }),
  ]);

  return paginateResponse(listings, total, page, limit);
};

/**
 * Gets a listing by ID with all images and vendor info.
 */
const getListingById = async (id) => {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }] },
      vendor: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!listing) throw new AppError('Listing not found', 404);
  return listing;
};

/**
 * Creates a new listing for a vendor.
 */
const createListing = async (vendorId, data) => {
  const vendor = await prisma.vendorProfile.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError('Vendor profile not found', 404);
  return prisma.listing.create({ data: { ...data, vendorId } });
};

/**
 * Updates a listing by ID.
 */
const updateListing = async (id, data) => {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new AppError('Listing not found', 404);
  return prisma.listing.update({ where: { id }, data });
};

/**
 * Deletes a listing by ID.
 */
const deleteListing = async (id) => {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new AppError('Listing not found', 404);
  await prisma.listing.delete({ where: { id } });
};

/**
 * Adds an image to a listing.
 */
const addListingImage = async (listingId, imageUrl, publicId, isPrimary = false) => {
  // If this image is primary, unset previous primary
  if (isPrimary) {
    await prisma.listingImage.updateMany({ where: { listingId, isPrimary: true }, data: { isPrimary: false } });
  }

  const count = await prisma.listingImage.count({ where: { listingId } });
  return prisma.listingImage.create({
    data: { listingId, imageUrl, publicId, isPrimary, displayOrder: count },
  });
};

/**
 * Removes an image from a listing.
 */
const removeListingImage = async (listingId, imageId) => {
  const image = await prisma.listingImage.findFirst({ where: { id: imageId, listingId } });
  if (!image) throw new AppError('Image not found', 404);
  await prisma.listingImage.delete({ where: { id: imageId } });
};

/**
 * Checks whether a listing is available for the given date range.
 */
const checkAvailability = async (listingId, startDate, endDate) => {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AppError('Listing not found', 404);
  if (!listing.isAvailable) return { available: false, reason: 'Listing is not available' };

  if (startDate && endDate) {
    const overlapping = await prisma.booking.count({
      where: {
        listingId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
    });
    if (overlapping > 0) return { available: false, reason: 'Already booked for the selected dates' };
  }

  return { available: true };
};

module.exports = {
  searchListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  addListingImage,
  removeListingImage,
  checkAvailability,
};
