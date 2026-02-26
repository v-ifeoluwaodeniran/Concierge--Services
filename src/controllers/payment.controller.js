'use strict';

const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');
const { sendResponse } = require('../utils/helpers');
const { prisma } = require('../config/database');
const crypto = require('crypto');

const initializePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const result = await paymentService.initializePayment(bookingId, req.user.id);
    return sendResponse(res, 200, 'Payment initialized', result);
  } catch (err) {
    return next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const result = await paymentService.verifyPayment(reference);

    if (result.paid) {
      const booking = await prisma.booking.findFirst({ where: { paymentReference: reference } });
      if (booking) notificationService.sendPaymentConfirmation(booking);
    }

    return sendResponse(res, 200, 'Payment verification complete', result);
  } catch (err) {
    return next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    await paymentService.handleWebhook(req.body);
    return res.sendStatus(200);
  } catch (err) {
    return next(err);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await paymentService.getPaymentHistory(req.user.id, page, limit);
    return sendResponse(res, 200, 'Payment history retrieved', result);
  } catch (err) {
    return next(err);
  }
};

module.exports = { initializePayment, verifyPayment, handleWebhook, getPaymentHistory };
