'use strict';

const { Router } = require('express');
const payoutController = require('../controllers/payout.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate, authorize('VENDOR'));

router.get('/', payoutController.listPayouts);
router.get('/balance', payoutController.getBalance);
router.post('/request', payoutController.requestPayout);
router.post('/bank-accounts', payoutController.addBankAccount);

module.exports = router;
