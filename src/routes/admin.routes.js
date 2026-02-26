'use strict';

const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/vendors', adminController.listVendors);
router.patch('/vendors/:id/verify', adminController.verifyVendor);
router.patch('/vendors/:id/commission', adminController.setCommission);
router.get('/bookings', adminController.listBookings);
router.get('/transactions', adminController.listTransactions);
router.get('/payouts', adminController.listPayouts);

module.exports = router;
