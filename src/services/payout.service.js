'use strict';

const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');
const { generateReference, paginate, paginateResponse } = require('../utils/helpers');

/**
 * Lists paginated payouts for a vendor.
 */
const getPayouts = async (vendorId, page = 1, limit = 10) => {
  const { skip, take } = paginate(page, limit);
  const where = { vendorId };

  const [payouts, total] = await Promise.all([
    prisma.vendorPayout.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.vendorPayout.count({ where }),
  ]);

  return paginateResponse(payouts, total, page, limit);
};

/**
 * Calculates the available balance for a vendor.
 * Balance = sum of commission amounts from completed bookings - total completed/processing payouts.
 */
const getBalance = async (vendorId) => {
  const earningsAgg = await prisma.booking.aggregate({
    where: { vendorId, status: 'COMPLETED', paymentStatus: 'PAID' },
    _sum: { commissionAmount: true },
  });

  const payoutsAgg = await prisma.vendorPayout.aggregate({
    where: { vendorId, status: { in: ['COMPLETED', 'PROCESSING'] } },
    _sum: { amount: true },
  });

  // Revenue = subtotal - commission
  const revenueAgg = await prisma.booking.aggregate({
    where: { vendorId, status: 'COMPLETED', paymentStatus: 'PAID' },
    _sum: { subtotal: true },
  });

  const totalEarnings = (revenueAgg._sum.subtotal || 0) - (earningsAgg._sum.commissionAmount || 0);
  const totalPaidOut = payoutsAgg._sum.amount || 0;
  const availableBalance = Math.max(0, totalEarnings - totalPaidOut);

  return { totalEarnings, totalPaidOut, availableBalance };
};

/**
 * Requests a payout for a vendor.
 */
const requestPayout = async (vendorId, bankAccountId, amount) => {
  const { availableBalance } = await getBalance(vendorId);
  if (amount > availableBalance) throw new AppError('Insufficient balance for payout', 400);

  const bankAccount = await prisma.vendorBankAccount.findFirst({
    where: { id: bankAccountId, vendorId },
  });
  if (!bankAccount) throw new AppError('Bank account not found', 404);

  return prisma.vendorPayout.create({
    data: {
      vendorId,
      amount,
      bankName: bankAccount.bankName,
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      status: 'PENDING',
      payoutReference: generateReference('PO'),
    },
  });
};

/**
 * Adds a bank account for a vendor.
 */
const addBankAccount = async (vendorId, data) => {
  const { bankName, bankCode, accountNumber, accountName, isDefault } = data;

  if (isDefault) {
    await prisma.vendorBankAccount.updateMany({ where: { vendorId }, data: { isDefault: false } });
  }

  return prisma.vendorBankAccount.create({
    data: { vendorId, bankName, bankCode, accountNumber, accountName, isDefault: isDefault || false },
  });
};

/**
 * Gets all bank accounts for a vendor.
 */
const getBankAccounts = async (vendorId) => {
  return prisma.vendorBankAccount.findMany({ where: { vendorId }, orderBy: { isDefault: 'desc' } });
};

module.exports = { getPayouts, getBalance, requestPayout, addBankAccount, getBankAccounts };
