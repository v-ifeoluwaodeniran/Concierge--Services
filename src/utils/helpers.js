'use strict';

const { v4: uuidv4 } = require('uuid');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./constants');

/**
 * Generates a unique reference string with an optional prefix.
 * @param {string} prefix - Prefix for the reference (e.g. 'BK', 'PAY')
 * @returns {string}
 */
const generateReference = (prefix = 'REF') => {
  const uid = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();
  return `${prefix}_${uid}`;
};

/**
 * Computes Prisma-compatible skip/take values for pagination.
 * @param {number|string} page
 * @param {number|string} limit
 * @returns {{ skip: number, take: number }}
 */
const paginate = (page = 1, limit = DEFAULT_PAGE_SIZE) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
  return {
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
  };
};

/**
 * Constructs a standardized pagination response envelope.
 * @param {Array} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
const paginateResponse = (data, total, page, limit) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
      hasNextPage: parsedPage * parsedLimit < total,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Calculates a fee amount from a base amount and percentage.
 * @param {number} amount
 * @param {number} percentage
 * @returns {number}
 */
const calculateServiceFee = (amount, percentage) => {
  return parseFloat(((amount * percentage) / 100).toFixed(2));
};

/**
 * Sends a standardized JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} [data]
 */
const sendResponse = (res, statusCode, message, data) => {
  const body = { success: statusCode < 400, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

module.exports = { generateReference, paginate, paginateResponse, calculateServiceFee, sendResponse };
