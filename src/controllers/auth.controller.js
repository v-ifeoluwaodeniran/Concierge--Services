'use strict';

const authService = require('../services/auth.service');
const { sendResponse } = require('../utils/helpers');
const { prisma } = require('../config/database');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendResponse(res, 201, 'Registration successful', result);
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return sendResponse(res, 200, 'Login successful', result);
  } catch (err) {
    return next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyOtp(phone, otp);
    return sendResponse(res, 200, result.message);
  } catch (err) {
    return next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return sendResponse(res, 200, result.message);
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return sendResponse(res, 200, result.message);
  } catch (err) {
    return next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const tokens = await authService.refreshToken(token);
    return sendResponse(res, 200, 'Token refreshed', tokens);
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        userType: true,
        isVerified: true,
        createdAt: true,
        vendorProfile: { select: { id: true, businessName: true, businessType: true, isVerified: true } },
      },
    });
    return sendResponse(res, 200, 'User profile retrieved', user);
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, verifyOtp, forgotPassword, resetPassword, refreshToken, getMe };
