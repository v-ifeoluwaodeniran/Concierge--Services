'use strict';

const { prisma } = require('../config/database');
const { sendResponse, paginate, paginateResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');

const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalVendors, totalBookings, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.vendorProfile.count(),
      prisma.booking.count(),
      prisma.booking.aggregate({
        where: { status: 'COMPLETED', paymentStatus: 'PAID' },
        _sum: { commissionAmount: true },
      }),
    ]);

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return sendResponse(res, 200, 'Dashboard data retrieved', {
      totalUsers,
      totalVendors,
      totalBookings,
      totalCommissionEarned: totalRevenue._sum.commissionAmount || 0,
      bookingsByStatus: bookingsByStatus.reduce((acc, b) => {
        acc[b.status] = b._count.status;
        return acc;
      }, {}),
    });
  } catch (err) {
    return next(err);
  }
};

const listVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isVerified } = req.query;
    const { skip, take } = paginate(page, limit);
    const where = isVerified !== undefined ? { isVerified: isVerified === 'true' } : {};

    const [vendors, total] = await Promise.all([
      prisma.vendorProfile.findMany({
        where,
        skip,
        take,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendorProfile.count({ where }),
    ]);

    return sendResponse(res, 200, 'Vendors retrieved', paginateResponse(vendors, total, page, limit));
  } catch (err) {
    return next(err);
  }
};

const verifyVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendorProfile.findUnique({ where: { id } });
    if (!vendor) throw new AppError('Vendor not found', 404);

    const updated = await prisma.vendorProfile.update({ where: { id }, data: { isVerified: true } });
    return sendResponse(res, 200, 'Vendor verified', updated);
  } catch (err) {
    return next(err);
  }
};

const setCommission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { commissionPercentage } = req.body;
    if (commissionPercentage === undefined || commissionPercentage < 0 || commissionPercentage > 100) {
      throw new AppError('Commission percentage must be between 0 and 100', 400);
    }

    const updated = await prisma.vendorProfile.update({ where: { id }, data: { commissionPercentage } });
    return sendResponse(res, 200, 'Commission updated', updated);
  } catch (err) {
    return next(err);
  }
};

const listBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = paginate(page, limit);
    const where = status ? { status } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          vendor: { select: { businessName: true } },
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return sendResponse(res, 200, 'Bookings retrieved', paginateResponse(bookings, total, page, limit));
  } catch (err) {
    return next(err);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, take } = paginate(page, limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take,
        include: { booking: { select: { bookingReference: true, customer: { select: { email: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count(),
    ]);

    return sendResponse(res, 200, 'Transactions retrieved', paginateResponse(transactions, total, page, limit));
  } catch (err) {
    return next(err);
  }
};

const listPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, take } = paginate(page, limit);
    const where = status ? { status } : {};

    const [payouts, total] = await Promise.all([
      prisma.vendorPayout.findMany({
        where,
        skip,
        take,
        include: { vendor: { select: { businessName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendorPayout.count({ where }),
    ]);

    return sendResponse(res, 200, 'Payouts retrieved', paginateResponse(payouts, total, page, limit));
  } catch (err) {
    return next(err);
  }
};

module.exports = { getDashboard, listVendors, verifyVendor, setCommission, listBookings, listTransactions, listPayouts };
