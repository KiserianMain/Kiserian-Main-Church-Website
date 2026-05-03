const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payments.controller');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get payment categories
router.get('/categories', authenticateToken, paymentController.getCategories);

// Create payment
router.post('/', 
  authenticateToken,
  [
    require('express-validator').body('phone_number').isMobilePhone().withMessage('Valid phone number required'),
    require('express-validator').body('payment_items').isArray({ min: 1 }).withMessage('At least one payment item is required'),
    require('express-validator').body('payment_items.*.category_id').isUUID().withMessage('Valid category ID required'),
    require('express-validator').body('payment_items.*.amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    require('express-validator').body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  paymentController.create
);

// Get user's payment history
router.get('/my-payments', authenticateToken, paymentController.getUserPayments);

// Query payment status
router.get('/status/:transaction_id', authenticateToken, paymentController.queryPaymentStatus);

// M-Pesa callback (no auth required)
router.post('/mpesa/callback', paymentController.mpesaCallback);

// Admin routes
router.get('/all', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder']), paymentController.getAllPayments);

module.exports = router;
