'use strict';

const { prisma } = require('../config/database');
const { sendResponse, paginate, paginateResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

// ─── Inline Review Service ────────────────────────────────────────────────────

const createReviewRecord = async (customerId, data) => {
  const { bookingId, rating, comment } = data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.customerId !== customerId) throw new AppError('You can only review your own bookings', 403);
  if (booking.status !== 'COMPLETED') throw new AppError('You can only review completed bookings', 400);

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) throw new AppError('Review already submitted for this booking', 409);

  const review = await prisma.review.create({
    data: { bookingId, customerId, vendorId: booking.vendorId, rating, comment },
  });

  // Recalculate vendor rating
  const agg = await prisma.review.aggregate({
    where: { vendorId: booking.vendorId, isVisible: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.vendorProfile.update({
    where: { id: booking.vendorId },
    data: { rating: agg._avg.rating || 0, totalReviews: agg._count.rating },
  });

  return review;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating) throw new AppError('bookingId and rating are required', 400);
    if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400);

    const review = await createReviewRecord(req.user.id, { bookingId, rating, comment });
    return sendResponse(res, 201, 'Review submitted', review);
  } catch (err) {
    return next(err);
  }
};

const listReviews = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
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

    return sendResponse(res, 200, 'Reviews retrieved', paginateResponse(reviews, total, page, limit));
  } catch (err) {
    return next(err);
  }
};

const respondToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    if (!response) throw new AppError('Response text is required', 400);

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404);

    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile || review.vendorId !== vendorProfile.id) throw new AppError('Unauthorized', 403);

    const updated = await prisma.review.update({ where: { id }, data: { vendorResponse: response } });
    return sendResponse(res, 200, 'Response added', updated);
  } catch (err) {
    return next(err);
  }
};

module.exports = { createReview, listReviews, respondToReview };
