'use strict';

const { prisma } = require('../config/database');
const { paystackAxios } = require('../config/paystack');
const { AppError } = require('../utils/errors');
const { generateReference, paginate, paginateResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Initializes a Paystack payment for a booking.
 */
const initializePayment = async (bookingId, customerId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  });

  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.customerId !== customerId) throw new AppError('Unauthorized', 403);
  if (booking.paymentStatus === 'PAID') throw new AppError('Booking is already paid', 400);
  if (booking.totalAmount <= 0) throw new AppError('No payment required for this booking', 400);

  const reference = generateReference('PAY');
  const amountKobo = Math.round(booking.totalAmount * 100); // Paystack uses kobo

  const response = await paystackAxios.post('/transaction/initialize', {
    email: booking.customer.email,
    amount: amountKobo,
    reference,
    metadata: { bookingId: booking.id, bookingReference: booking.bookingReference },
  });

  if (!response.data.status) throw new AppError('Payment initialization failed', 502);

  // Record the transaction
  await prisma.transaction.create({
    data: {
      bookingId,
      transactionType: 'PAYMENT',
      amount: booking.totalAmount,
      currency: 'NGN',
      gateway: 'paystack',
      gatewayReference: reference,
      status: 'PENDING',
    },
  });

  // Save reference on booking
  await prisma.booking.update({ where: { id: bookingId }, data: { paymentReference: reference } });

  return { authorizationUrl: response.data.data.authorization_url, reference };
};

/**
 * Verifies a Paystack payment by reference.
 */
const verifyPayment = async (reference) => {
  const response = await paystackAxios.get(`/transaction/verify/${reference}`);
  if (!response.data.status) throw new AppError('Payment verification failed', 502);

  const txData = response.data.data;
  const isPaid = txData.status === 'success';

  // Update transaction record
  await prisma.transaction.updateMany({
    where: { gatewayReference: reference },
    data: {
      status: isPaid ? 'SUCCESS' : 'FAILED',
      gatewayResponse: txData,
    },
  });

  if (isPaid) {
    // Update booking payment status
    await prisma.booking.updateMany({
      where: { paymentReference: reference },
      data: { paymentStatus: 'PAID', paymentMethod: 'paystack', status: 'CONFIRMED' },
    });
  }

  return { paid: isPaid, data: txData };
};

/**
 * Handles incoming Paystack webhook events.
 */
const handleWebhook = async (event) => {
  const { event: eventType, data } = event;
  logger.info(`Paystack webhook received: ${eventType}`);

  if (eventType === 'charge.success') {
    const reference = data.reference;
    await prisma.transaction.updateMany({
      where: { gatewayReference: reference },
      data: { status: 'SUCCESS', gatewayResponse: data },
    });
    await prisma.booking.updateMany({
      where: { paymentReference: reference },
      data: { paymentStatus: 'PAID', paymentMethod: 'paystack', status: 'CONFIRMED' },
    });
  }
};

/**
 * Gets paginated payment transactions for a user.
 */
const getPaymentHistory = async (userId, page = 1, limit = 10) => {
  const { skip, take } = paginate(page, limit);
  const where = { booking: { customerId: userId } };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take,
      include: { booking: { select: { bookingReference: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  return paginateResponse(transactions, total, page, limit);
};

module.exports = { initializePayment, verifyPayment, handleWebhook, getPaymentHistory };
