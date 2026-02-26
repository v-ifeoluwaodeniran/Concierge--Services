'use strict';

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { AppError } = require('../utils/errors');

/**
 * Verifies Bearer JWT token and attaches user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication token is required', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        isActive: true,
        vendorProfile: { select: { id: true } },
      },
    });

    if (!user) return next(new AppError('User not found', 401));
    if (!user.isActive) return next(new AppError('Account is deactivated', 401));

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Restricts access to specified user roles.
 * @param  {...string} roles - Allowed UserType values
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!roles.includes(req.user.userType)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };
};

/**
 * Authenticates token if present but does not fail if missing.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isVerified: true,
        isActive: true,
        vendorProfile: { select: { id: true } },
      },
    });

    if (user && user.isActive) req.user = user;
    return next();
  } catch {
    // Ignore token errors for optional auth
    return next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };
