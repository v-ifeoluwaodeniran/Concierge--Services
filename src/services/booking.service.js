'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');
const { generateReference, paginate, paginateResponse, calculateServiceFee } = require('../utils/helpers');
const { SERVICE_FEE_PERCENTAGE } = require('../utils/constants');

/**
 * Creates a new booking after validating the listing and calculating fees.
 */
const createBooking = async (customerId, data) => {
  const { listingId, bookingType, startDate, endDate, startTime, endTime, guestCount, specialRequests, subtotal } = data;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { vendor: true },
  });
  if (!listing) throw new AppError('Listing not found', 404);
  if (!listing.isAvailable) throw new AppError('This listing is not currently available', 400);

  // Check for overlapping confirmed bookings (rentals)
  if (bookingType === 'RENTAL' && endDate) {
    const overlap = await prisma.booking.count({
      where: {
        listingId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
    });
    if (overlap > 0) throw new AppError('Listing is not available for the selected dates', 409);
  }

  let bookingSubtotal = subtotal || 0;
  let serviceFee = 0;
  let commissionAmount = 0;
  let totalAmount = 0;

  if (bookingType === 'RENTAL') {
    // Calculate rental price based on days if not provided
    if (!bookingSubtotal && listing.price && endDate) {
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      bookingSubtotal = listing.price * days;
    }
    serviceFee = calculateServiceFee(bookingSubtotal, SERVICE_FEE_PERCENTAGE);
    commissionAmount = calculateServiceFee(bookingSubtotal, listing.vendor.commissionPercentage);
    totalAmount = bookingSubtotal + serviceFee;
  } else {
    // RESERVATION (restaurant/club): no upfront payment, commission applied after bill
    bookingSubtotal = 0;
    serviceFee = 0;
    commissionAmount = 0;
    totalAmount = 0;
  }

  const booking = await prisma.booking.create({
    data: {
      bookingReference: generateReference('BK'),
      customerId,
      vendorId: listing.vendorId,
      listingId,
      bookingType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      startTime,
      endTime,
      guestCount,
      specialRequests,
      subtotal: bookingSubtotal,
      serviceFee,
      commissionAmount,
      totalAmount,
      paymentStatus: 'PENDING',
      status: 'PENDING',
    },
    include: {
      listing: { select: { title: true, listingType: true } },
      vendor: { select: { businessName: true } },
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return booking;
};

/**
 * Lists bookings based on user type (customer sees own, vendor sees their listings').
 */
const listBookings = async (userId, userType, page = 1, limit = 10) => {
  const { skip, take } = paginate(page, limit);
  let where = {};

  if (userType === 'CUSTOMER') {
    where = { customerId: userId };
  } else if (userType === 'VENDOR') {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new AppError('Vendor profile not found', 404);
    where = { vendorId: vendor.id };
  } else {
    // ADMIN: all bookings
    where = {};
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take,
      include: {
        listing: { select: { title: true, listingType: true } },
        customer: { select: { firstName: true, lastName: true } },
        vendor: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);

  return paginateResponse(bookings, total, page, limit);
};

/**
 * Gets a booking by ID.
 */
const getBookingById = async (id) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      vendor: { select: { businessName: true, address: true, city: true } },
      transactions: true,
      review: true,
    },
  });

  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
};

/**
 * Vendor confirms a booking.
 */
const confirmBooking = async (bookingId, vendorId) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.vendorId !== vendorId) throw new AppError('Unauthorized', 403);
  if (booking.status !== 'PENDING') throw new AppError(`Booking cannot be confirmed (status: ${booking.status})`, 400);

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
  });
};

/**
 * Cancels a booking.
 */
const cancelBooking = async (bookingId, userId, reason) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vendor: true },
  });
  if (!booking) throw new AppError('Booking not found', 404);

  const isCustomer = booking.customerId === userId;
  const isVendor = booking.vendor.userId === userId;
  if (!isCustomer && !isVendor) throw new AppError('Unauthorized', 403);
  if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    throw new AppError(`Booking cannot be cancelled (status: ${booking.status})`, 400);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason || null },
  });
};

/**
 * Marks a booking as completed.
 */
const completeBooking = async (bookingId) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.status !== 'CONFIRMED') throw new AppError('Only confirmed bookings can be completed', 400);

  return prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
};

/**
 * Reports the final bill for a restaurant/club reservation and calculates commission.
 */
const reportBill = async (bookingId, billAmount) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vendor: true },
  });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.bookingType !== 'RESERVATION') throw new AppError('Bill reporting is only for reservations', 400);
  if (booking.status !== 'CONFIRMED') throw new AppError('Booking must be confirmed before reporting bill', 400);

  const commissionAmount = calculateServiceFee(billAmount, booking.vendor.commissionPercentage);

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      subtotal: billAmount,
      commissionAmount,
      totalAmount: billAmount,
      status: 'COMPLETED',
    },
  });
};

module.exports = { createBooking, listBookings, getBookingById, confirmBooking, cancelBooking, completeBooking, reportBill };
