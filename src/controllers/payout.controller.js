'use strict';

const payoutService = require('../services/payout.service');
const { sendResponse } = require('../utils/helpers');
const { AppError } = require('../utils/errors');
const Joi = require('joi');

const listPayouts = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);
    const { page = 1, limit = 10 } = req.query;
    const result = await payoutService.getPayouts(vendorProfile.id, page, limit);
    return sendResponse(res, 200, 'Payouts retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const getBalance = async (req, res, next) => {
  try {
    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);
    const balance = await payoutService.getBalance(vendorProfile.id);
    return sendResponse(res, 200, 'Balance retrieved', balance);
  } catch (err) {
    return next(err);
  }
};

const requestPayout = async (req, res, next) => {
  try {
    const schema = Joi.object({
      bankAccountId: Joi.string().required(),
      amount: Joi.number().positive().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const payout = await payoutService.requestPayout(vendorProfile.id, value.bankAccountId, value.amount);
    return sendResponse(res, 201, 'Payout requested', payout);
  } catch (err) {
    return next(err);
  }
};

const addBankAccount = async (req, res, next) => {
  try {
    const schema = Joi.object({
      bankName: Joi.string().required(),
      bankCode: Joi.string().required(),
      accountNumber: Joi.string().min(10).max(10).required(),
      accountName: Joi.string().required(),
      isDefault: Joi.boolean().default(false),
    });
    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const vendorProfile = req.user.vendorProfile;
    if (!vendorProfile) throw new AppError('Vendor profile not found', 404);

    const account = await payoutService.addBankAccount(vendorProfile.id, value);
    return sendResponse(res, 201, 'Bank account added', account);
  } catch (err) {
    return next(err);
  }
};

module.exports = { listPayouts, getBalance, requestPayout, addBankAccount };
