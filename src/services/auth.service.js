'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');

/**
 * Generates access and refresh JWT tokens for a user.
 * @param {{ id: string, email: string, userType: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = (user) => {
  const payload = { userId: user.id, email: user.email, userType: user.userType };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
};

/**
 * Registers a new user.
 * @param {{ email, phone, password, firstName, lastName, userType }} data
 */
const register = async (data) => {
  const { email, phone, password, firstName, lastName, userType } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email is already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, phone, passwordHash, firstName, lastName, userType: userType || 'CUSTOMER' },
    select: { id: true, email: true, firstName: true, lastName: true, userType: true, isVerified: true },
  });

  const tokens = generateTokens(user);
  return { user, ...tokens };
};

/**
 * Authenticates a user and returns tokens.
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Account is deactivated', 401);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const safeUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    isVerified: user.isVerified,
  };

  const tokens = generateTokens(safeUser);
  return { user: safeUser, ...tokens };
};

/**
 * Verifies a refresh token and returns new token pair.
 * @param {string} token
 */
const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, userType: true, isActive: true },
  });

  if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

  return generateTokens(user);
};

/**
 * Initiates a password reset flow (stub – no email delivery).
 * @param {string} email
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid user enumeration
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };
  // TODO: generate token and send email in production
  return { message: 'If that email exists, a reset link has been sent.' };
};

/**
 * Resets a user's password using a token (stub).
 * @param {string} token
 * @param {string} password
 */
const resetPassword = async (token, password) => {
  // Stub: In production, validate token, find user, update password
  if (!token || !password) throw new AppError('Token and password are required', 400);
  return { message: 'Password has been reset successfully.' };
};

/**
 * Marks a user's phone as verified via OTP (stub).
 * @param {string} phone
 * @param {string} otp
 */
const verifyOtp = async (phone, otp) => {
  if (!otp || otp.length !== 6) throw new AppError('Invalid OTP', 400);

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('User not found', 404);

  await prisma.user.update({ where: { phone }, data: { isVerified: true } });
  return { message: 'Phone number verified successfully.' };
};

module.exports = { register, login, generateTokens, refreshToken, forgotPassword, resetPassword, verifyOtp };
