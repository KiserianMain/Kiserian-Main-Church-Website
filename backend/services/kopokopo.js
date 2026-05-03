const axios = require('axios');
const crypto = require('crypto');

class KopoKopoService {
  constructor() {
    this.baseURL = process.env.KOPOKOPO_BASE_URL || 'https://api.kopokopo.com';
    this.apiKey = process.env.KOPOKOPO_API_KEY;
    this.apiSecret = process.env.KOPOKOPO_API_SECRET;
    this.webhookSecret = process.env.KOPOKOPO_WEBHOOK_SECRET;
  }

  // Generate signature for API requests
  generateSignature(payload) {
    const timestamp = Date.now().toString();
    const message = timestamp + JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  // Make authenticated API request
  async makeRequest(endpoint, payload = {}, method = 'POST') {
    try {
      const signature = this.generateSignature(payload);
      const timestamp = Date.now().toString();

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-K2-Signature': signature,
          'X-K2-Timestamp': timestamp,
        },
        data: payload,
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('KopoKopo API Error:', error.response?.data || error.message);
      throw new Error('Payment service unavailable');
    }
  }

  // Initiate STK Push payment
  async initiateSTKPush(paymentData) {
    const payload = {
      type: 'stk_push',
      payment_type: 'mpesa',
      phone_number: paymentData.phoneNumber,
      amount: paymentData.amount,
      account_reference: paymentData.reference || 'SDA_CHURCH',
      transaction_desc: paymentData.description || 'Church Payment',
      callback_url: `${process.env.BACKEND_URL}/api/payments/kopokopo/callback`,
    };

    try {
      const response = await this.makeRequest('/payments/stk_push', payload);
      return {
        success: true,
        transactionId: response.id,
        checkoutRequestID: response.checkout_request_id,
        merchantRequestID: response.merchant_request_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate payment link
  async generatePaymentLink(paymentData) {
    const payload = {
      type: 'payment_link',
      amount: paymentData.amount,
      currency: 'KES',
      description: paymentData.description || 'Church Payment',
      redirect_url: paymentData.redirectUrl || `${process.env.FRONTEND_URL}/payment/success`,
      callback_url: `${process.env.BACKEND_URL}/api/payments/kopokopo/callback`,
      metadata: {
        memberId: paymentData.memberId,
        paymentCategory: paymentData.category,
        churchEvent: paymentData.eventId,
      },
    };

    try {
      const response = await this.makeRequest('/payment_links', payload);
      return {
        success: true,
        paymentUrl: response.payment_url,
        linkId: response.id,
        expiresAt: response.expires_at,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate QR code for payments
  async generateQRCode(paymentData) {
    const payload = {
      type: 'qr_code',
      amount: paymentData.amount,
      currency: 'KES',
      merchant_name: 'SDA Church Kiserian Main',
      transaction_desc: paymentData.description || 'Church Payment',
      metadata: {
        memberId: paymentData.memberId,
        paymentCategory: paymentData.category,
      },
    };

    try {
      const response = await this.makeRequest('/qr_codes', payload);
      return {
        success: true,
        qrCodeData: response.qr_code_data,
        qrCodeImage: response.qr_code_image_url,
        qrId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check transaction status
  async checkTransactionStatus(transactionId) {
    try {
      const response = await this.makeRequest(`/transactions/${transactionId}`, {}, 'GET');
      return {
        success: true,
        status: response.status,
        transaction: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Process webhook callback
  async processWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      // Process the payment event
      const event = payload.event;
      
      switch (event.type) {
        case 'transaction.successful':
          return await this.handleSuccessfulPayment(event.data);
        case 'transaction.failed':
          return await this.handleFailedPayment(event.data);
        default:
          console.log('Unhandled event type:', event.type);
          return { processed: true };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handleSuccessfulPayment(transactionData) {
    try {
      // Update payment in database
      const payment = await Payment.findOneAndUpdate(
        { 
          transactionId: transactionData.id,
          status: 'pending' 
        },
        {
          status: 'completed',
          completedAt: new Date(),
          mpesaReceipt: transactionData.receipt_number,
          phoneNumber: transactionData.phone_number,
          amount: transactionData.amount,
        },
        { new: true }
      );

      if (payment) {
        // Update member's payment history
        await Member.findByIdAndUpdate(
          payment.memberId,
          {
            $push: {
              paymentHistory: {
                paymentId: payment._id,
                amount: payment.amount,
                category: payment.category,
                date: payment.completedAt,
                method: 'M-Pesa',
              },
            },
            $inc: {
              totalContributions: payment.amount,
            },
          }
        );

        // Send confirmation notification
        await this.sendPaymentConfirmation(payment);
      }

      return { processed: true, payment };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  // Handle failed payment
  async handleFailedPayment(transactionData) {
    try {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { transactionId: transactionData.id },
        {
          status: 'failed',
          failureReason: transactionData.failure_reason,
          failedAt: new Date(),
        }
      );

      return { processed: true };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      throw error;
    }
  }

  // Send payment confirmation
  async sendPaymentConfirmation(payment) {
    try {
      // Send SMS confirmation
      await smsService.sendSMS(
        payment.phoneNumber,
        `Thank you for your payment of KES ${payment.amount} to SDA Church Kiserian Main. Receipt: ${payment.mpesaReceipt}`
      );

      // Send email confirmation
      await emailService.sendPaymentReceipt(payment);

      // Send push notification (if member has app)
      if (payment.memberId) {
        await notificationService.sendPushNotification(
          payment.memberId,
          'Payment Received',
          `Your payment of KES ${payment.amount} has been received successfully.`
        );
      }
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(startDate, endDate) {
    try {
      const response = await this.makeRequest('/analytics/payments', {
        start_date: startDate,
        end_date: endDate,
        filters: {
          currency: 'KES',
          status: 'successful',
        },
      }, 'GET');

      return {
        success: true,
        analytics: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Refund payment
  async refundPayment(transactionId, refundData) {
    const payload = {
      transaction_id: transactionId,
      amount: refundData.amount,
      reason: refundData.reason,
      callback_url: `${process.env.BACKEND_URL}/api/payments/kopokopo/refund-callback`,
    };

    try {
      const response = await this.makeRequest('/refunds', payload);
      return {
        success: true,
        refundId: response.id,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new KopoKopoService();
