const kopokopoService = require('../services/kopokopo');
const Payment = require('../models/Payment');
const Member = require('../models/Member');

class PaymentController {
  // Initiate M-Pesa payment via KopoKopo STK Push
  async initiatePayment(req, res) {
    try {
      const { amount, phoneNumber, category, memberId, description } = req.body;

      // Validate input
      if (!amount || !phoneNumber || !category) {
        return res.status(400).json({
          success: false,
          error: 'Amount, phone number, and category are required',
        });
      }

      // Validate phone number format
      if (!/^2547\d{8}$/.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Use 2547XXXXXXXX',
        });
      }

      // Create payment record
      const payment = new Payment({
        memberId,
        phoneNumber,
        amount,
        category,
        description: description || `${category} payment`,
        method: 'M-Pesa',
        status: 'pending',
        initiatedBy: req.user.id,
      });

      await payment.save();

      // Initiate STK Push
      const paymentResult = await kopokopoService.initiateSTKPush({
        phoneNumber,
        amount,
        reference: `SDA-${payment._id}`,
        description: payment.description,
      });

      if (!paymentResult.success) {
        payment.status = 'failed';
        payment.failureReason = paymentResult.error;
        await payment.save();

        return res.status(400).json({
          success: false,
          error: paymentResult.error,
        });
      }

      // Update payment with transaction details
      payment.transactionId = paymentResult.transactionId;
      payment.checkoutRequestID = paymentResult.checkoutRequestID;
      payment.merchantRequestID = paymentResult.merchantRequestID;
      await payment.save();

      res.json({
        success: true,
        message: 'Payment initiated. Please check your phone for M-Pesa prompt.',
        data: {
          paymentId: payment._id,
          transactionId: paymentResult.transactionId,
          checkoutRequestID: paymentResult.checkoutRequestID,
        },
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment initiation failed',
      });
    }
  }

  // Generate payment link
  async generatePaymentLink(req, res) {
    try {
      const { amount, category, memberId, description, eventId } = req.body;

      const payment = new Payment({
        memberId,
        amount,
        category,
        description: description || `${category} payment`,
        method: 'M-Pesa',
        status: 'pending',
        initiatedBy: req.user.id,
        eventId,
      });

      await payment.save();

      const linkResult = await kopokopoService.generatePaymentLink({
        amount,
        description: payment.description,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/success/${payment._id}`,
        memberId,
        category,
        eventId,
      });

      if (!linkResult.success) {
        payment.status = 'failed';
        payment.failureReason = linkResult.error;
        await payment.save();

        return res.status(400).json({
          success: false,
          error: linkResult.error,
        });
      }

      payment.paymentUrl = linkResult.paymentUrl;
      payment.linkId = linkResult.linkId;
      await payment.save();

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          paymentUrl: linkResult.paymentUrl,
          expiresAt: linkResult.expiresAt,
        },
      });
    } catch (error) {
      console.error('Payment link generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment link generation failed',
      });
    }
  }

  // Generate QR code for payments
  async generateQRCode(req, res) {
    try {
      const { amount, category, memberId, description, eventId } = req.body;

      const payment = new Payment({
        memberId,
        amount,
        category,
        description: description || `${category} payment`,
        method: 'M-Pesa',
        status: 'pending',
        initiatedBy: req.user.id,
        eventId,
      });

      await payment.save();

      const qrResult = await kopokopoService.generateQRCode({
        amount,
        description: payment.description,
        memberId,
        category,
      });

      if (!qrResult.success) {
        payment.status = 'failed';
        payment.failureReason = qrResult.error;
        await payment.save();

        return res.status(400).json({
          success: false,
          error: qrResult.error,
        });
      }

      payment.qrCodeData = qrResult.qrCodeData;
      payment.qrId = qrResult.qrId;
      await payment.save();

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          qrCodeData: qrResult.qrCodeData,
          qrCodeImage: qrResult.qrCodeImage,
          qrId: qrResult.qrId,
        },
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      res.status(500).json({
        success: false,
        error: 'QR code generation failed',
      });
    }
  }

  // Check payment status
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      // If payment is still pending, check with KopoKopo
      if (payment.status === 'pending' && payment.transactionId) {
        const statusResult = await kopokopoService.checkTransactionStatus(
          payment.transactionId
        );

        if (statusResult.success && statusResult.status !== 'pending') {
          payment.status = statusResult.status;
          payment.completedAt = new Date();
          await payment.save();
        }
      }

      res.json({
        success: true,
        data: {
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          category: payment.category,
          phoneNumber: payment.phoneNumber,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          mpesaReceipt: payment.mpesaReceipt,
          failureReason: payment.failureReason,
        },
      });
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment status check failed',
      });
    }
  }

  // Get payment history for a member
  async getPaymentHistory(req, res) {
    try {
      const { memberId } = req.params;
      const { page = 1, limit = 20, category, startDate, endDate } = req.query;

      const query = { memberId };
      
      if (category) query.category = category;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('memberId', 'firstName lastName email');

      const total = await Payment.countDocuments(query);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Payment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history',
      });
    }
  }

  // Get all payments (admin)
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 20, category, status, startDate, endDate } = req.query;

      const query = {};
      
      if (category) query.category = category;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('memberId', 'firstName lastName email phoneNumber');

      const total = await Payment.countDocuments(query);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payments',
      });
    }
  }

  // Process KopoKopo webhook
  async processWebhook(req, res) {
    try {
      const signature = req.headers['x-k2-signature'];
      const payload = req.body;

      if (!signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing signature',
        });
      }

      await kopokopoService.processWebhook(payload, signature);

      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Get analytics from KopoKopo
      const kopokopoAnalytics = await kopokopoService.getPaymentAnalytics(
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate || new Date()
      );

      // Get local analytics
      const localAnalytics = await Payment.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: {
              $gte: new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
              $lte: new Date(endDate || Date.now()),
            },
          },
        },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
            averageAmount: { $avg: '$amount' },
          },
        },
        {
          $sort: { totalAmount: -1 },
        },
      ]);

      res.json({
        success: true,
        data: {
          kopokopo: kopokopoAnalytics.analytics || {},
          local: localAnalytics,
        },
      });
    } catch (error) {
      console.error('Payment analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment analytics',
      });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Only completed payments can be refunded',
        });
      }

      const refundResult = await kopokopoService.refundPayment(
        payment.transactionId,
        { amount: amount || payment.amount, reason }
      );

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          error: refundResult.error,
        });
      }

      // Create refund record
      const refund = new Refund({
        paymentId: payment._id,
        amount: amount || payment.amount,
        reason,
        refundId: refundResult.refundId,
        status: refundResult.status,
        initiatedBy: req.user.id,
      });

      await refund.save();

      res.json({
        success: true,
        message: 'Refund initiated successfully',
        data: refund,
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Refund initiation failed',
      });
    }
  }
}

module.exports = new PaymentController();
