'use strict';

const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

// Webhook does not require authentication
router.post('/webhook', paymentController.handleWebhook);

router.use(authenticate);

router.post('/initialize', paymentController.initializePayment);
router.get('/verify/:reference', paymentController.verifyPayment);
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
