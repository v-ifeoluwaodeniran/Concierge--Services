'use strict';

const axios = require('axios');

const paystackConfig = {
  baseURL: 'https://api.paystack.co',
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
};

const paystackAxios = axios.create({
  baseURL: paystackConfig.baseURL,
  headers: {
    Authorization: `Bearer ${paystackConfig.secretKey}`,
    'Content-Type': 'application/json',
  },
});

module.exports = { paystackConfig, paystackAxios };
