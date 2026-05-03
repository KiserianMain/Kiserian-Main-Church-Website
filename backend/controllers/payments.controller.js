const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const MpesaService = require('../utils/mpesa');

class PaymentController {
  constructor() {
    this.mpesaService = new MpesaService();
  }

  // Create payment with multiple categories
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { phone_number, payment_items, notes } = req.body;

      // Calculate total amount
      const totalAmount = payment_items.reduce((sum, item) => sum + parseFloat(item.amount), 0);

      // Validate payment items
      if (payment_items.length === 0) {
        return res.status(400).json({ error: 'At least one payment item is required' });
      }

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create payment record
        const paymentQuery = `
          INSERT INTO payments (member_id, phone_number, amount, notes, status)
          VALUES ($1, $2, $3, $4, 'pending')
          RETURNING *
        `;

        const paymentResult = await client.query(paymentQuery, [
          req.user.id, phone_number, totalAmount, notes
        ]);
        const payment = paymentResult.rows[0];

        // Create payment items
        const paymentItems = [];
        for (const item of payment_items) {
          const itemQuery = `
            INSERT INTO payment_items (payment_id, category_id, amount)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          
          const itemResult = await client.query(itemQuery, [
            payment.id, item.category_id, item.amount
          ]);
          paymentItems.push(itemResult.rows[0]);
        }

        // Generate account reference
        const accountReference = `SDA-${payment.id.toString().slice(-8)}`;

        // Initiate M-Pesa STK push
        const stkResult = await this.mpesaService.initiateSTKPush(
          phone_number,
          totalAmount,
          accountReference,
          'SDA Church Kiserian - Offering & Tithe'
        );

        if (!stkResult.success) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'Failed to initiate payment',
            details: stkResult.error
          });
        }

        // Update payment with transaction details
        const updateQuery = `
          UPDATE payments 
          SET transaction_id = $1, mpesa_receipt_number = $2
          WHERE id = $3
          RETURNING *
        `;

        await client.query(updateQuery, [
          stkResult.data.CheckoutRequestID,
          stkResult.data.MerchantRequestID,
          payment.id
        ]);

        await client.query('COMMIT');

        res.status(201).json({
          message: 'Payment initiated successfully',
          payment: {
            id: payment.id,
            amount: totalAmount,
            phone_number,
            status: 'pending',
            transaction_id: stkResult.data.CheckoutRequestID,
            payment_items: paymentItems,
            account_reference: accountReference
          },
          stk_push: {
            checkout_request_id: stkResult.data.CheckoutRequestID,
            merchant_request_id: stkResult.data.MerchantRequestID,
            customer_message: stkResult.data.CustomerMessage
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get payment categories
  async getCategories(req, res) {
    try {
      const query = `
        SELECT * FROM payment_categories 
        WHERE is_active = true 
        ORDER BY name ASC
      `;

      const result = await pool.query(query);
      res.json({ categories: result.rows });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user's payment history
  async getUserPayments(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE p.member_id = $1';
      const params = [req.user.id];
      let paramIndex = 2;

      if (status) {
        whereClause += ` AND p.status = $${paramIndex++}`;
        params.push(status);
      }

      const query = `
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM payments p
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM payments p ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all payments (admin)
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 20, status, member_id } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND p.status = $${paramIndex++}`;
        params.push(status);
      }

      if (member_id) {
        whereClause += ` AND p.member_id = $${paramIndex++}`;
        params.push(member_id);
      }

      const query = `
        SELECT p.*, u.first_name, u.last_name, u.email,
               json_agg(
                 json_build_object(
                   'category_name', pc.name,
                   'amount', pi.amount
                 )
               ) as payment_items
        FROM payments p
        LEFT JOIN users u ON p.member_id = u.id
        LEFT JOIN payment_items pi ON p.id = pi.payment_id
        LEFT JOIN payment_categories pc ON pi.category_id = pc.id
        ${whereClause}
        GROUP BY p.id, u.first_name, u.last_name, u.email
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total FROM payments p ${whereClause}
      `;
      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // M-Pesa callback endpoint
  async mpesaCallback(req, res) {
    try {
      const callbackResult = this.mpesaService.processCallback(req.body);
      
      const { checkoutRequestID, success, metadata } = callbackResult;

      // Update payment status
      const updateQuery = `
        UPDATE payments 
        SET status = $1, payment_date = CURRENT_TIMESTAMP, mpesa_receipt_number = $2
        WHERE transaction_id = $3
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        success ? 'completed' : 'failed',
        metadata.MpesaReceiptNumber || null,
        checkoutRequestID
      ]);

      if (result.rows.length === 0) {
        console.error('Payment not found for checkout request ID:', checkoutRequestID);
        return res.status(404).json({ error: 'Payment not found' });
      }

      console.log('Payment updated:', result.rows[0]);

      // Send confirmation SMS (if payment was successful)
      if (success && metadata.MpesaReceiptNumber) {
        // TODO: Implement SMS notification
        console.log('Payment successful, SMS notification would be sent here');
      }

      res.json({ success: true });
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Query payment status
  async queryPaymentStatus(req, res) {
    try {
      const { transaction_id } = req.params;

      // Get payment from database
      const paymentQuery = 'SELECT * FROM payments WHERE transaction_id = $1';
      const paymentResult = await pool.query(paymentQuery, [transaction_id]);

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = paymentResult.rows[0];

      // If still pending, query M-Pesa status
      if (payment.status === 'pending') {
        const stkResult = await this.mpesaService.querySTKStatus(transaction_id);
        
        if (stkResult.success) {
          const { ResultCode, ResultDesc } = stkResult.data;
          
          if (ResultCode === '0') {
            // Payment successful
            await pool.query(
              'UPDATE payments SET status = $1 WHERE id = $2',
              ['completed', payment.id]
            );
            payment.status = 'completed';
          } else if (ResultCode === '1032') {
            // Request cancelled by user
            await pool.query(
              'UPDATE payments SET status = $1 WHERE id = $2',
              ['cancelled', payment.id]
            );
            payment.status = 'cancelled';
          }
        }
      }

      res.json({ payment });
    } catch (error) {
      console.error('Query payment status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PaymentController();
