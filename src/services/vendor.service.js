'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');
const { paginate, paginateResponse } = require('../utils/helpers');

/**
 * Lists vendor profiles with optional filters.
 */
const listVendors = async (filters = {}, page = 1, limit = 10) => {
  const { type, city, isVerified } = filters;
  const where = { isActive: true };
  if (type) where.businessType = type;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (isVerified !== undefined) where.isVerified = isVerified === 'true' || isVerified === true;

  const { skip, take } = paginate(page, limit);
  const [vendors, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      skip,
      take,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { rating: 'desc' },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  return paginateResponse(vendors, total, page, limit);
};

/**
 * Gets a vendor by ID, including listings and 5 most recent reviews.
 */
const getVendorById = async (id) => {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      listings: { where: { isAvailable: true }, include: { images: true } },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: { select: { firstName: true, lastName: true, profileImage: true } } },
      },
    },
  });

  if (!vendor) throw new AppError('Vendor not found', 404);
  return vendor;
};

/**
 * Creates a vendor profile for the given user.
 */
const createVendor = async (userId, data) => {
  const existing = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (existing) throw new AppError('Vendor profile already exists for this user', 409);

  return prisma.vendorProfile.create({
    data: { ...data, userId },
  });
};

/**
 * Updates a vendor profile.
 */
const updateVendor = async (id, data) => {
  const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
  if (!vendor) throw new AppError('Vendor not found', 404);
  return prisma.vendorProfile.update({ where: { id }, data });
};

/**
 * Lists paginated listings for a vendor.
 */
const getVendorListings = async (vendorId, page = 1, limit = 10) => {
  const { skip, take } = paginate(page, limit);
  const where = { vendorId };
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ where, skip, take, include: { images: true } }),
    prisma.listing.count({ where }),
  ]);
  return paginateResponse(listings, total, page, limit);
};

/**
 * Lists paginated reviews for a vendor.
 */
const getVendorReviews = async (vendorId, page = 1, limit = 10) => {
  const { skip, take } = paginate(page, limit);
  const where = { vendorId, isVisible: true };
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take,
      include: { customer: { select: { firstName: true, lastName: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);
  return paginateResponse(reviews, total, page, limit);
};

/**
 * Updates the operating hours of a vendor.
 */
const updateOperatingHours = async (vendorId, hours) => {
  const vendor = await prisma.vendorProfile.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new AppError('Vendor not found', 404);
  return prisma.vendorProfile.update({ where: { id: vendorId }, data: { operatingHours: hours } });
};

module.exports = {
  listVendors,
  getVendorById,
  createVendor,
  updateVendor,
  getVendorListings,
  getVendorReviews,
  updateOperatingHours,
};
