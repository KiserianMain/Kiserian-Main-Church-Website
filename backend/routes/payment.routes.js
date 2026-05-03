const express = require('express');
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes (for webhooks)
router.post('/kopokopo/webhook', paymentController.processWebhook);

// Protected routes (require authentication)
router.use(auth);

// Payment initiation
router.post('/initiate', paymentController.initiatePayment);
router.post('/payment-link', paymentController.generatePaymentLink);
router.post('/qr-code', paymentController.generateQRCode);

// Payment status and history
router.get('/status/:paymentId', paymentController.checkPaymentStatus);
router.get('/history/:memberId', paymentController.getPaymentHistory);
router.get('/all', paymentController.getAllPayments);

// Analytics and reporting
router.get('/analytics', paymentController.getPaymentAnalytics);

// Refunds
router.post('/refund/:paymentId', paymentController.refundPayment);

module.exports = router;
