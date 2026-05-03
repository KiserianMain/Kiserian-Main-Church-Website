const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// SMS service class
class SMSService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
    this.senderId = process.env.SMS_SENDER_ID || 'SDAKiserian';
  }

  async sendSMS(recipients, message, options = {}) {
    try {
      // This is a mock implementation - replace with actual SMS provider
      console.log('SMS Service - Sending message:', {
        recipients,
        message,
        senderId: this.senderId,
        ...options
      });

      // Log the SMS
      for (const recipient of recipients) {
        await this.logSMS(recipient, message, options.sender_id || null, options.template_id || null);
      }

      return { success: true, messageId: `SMS_${Date.now()}` };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }

  async logSMS(recipient, message, sender_id, template_id) {
    const query = `
      INSERT INTO sms_logs (recipient_phone, message, sender_id, template_id, status)
      VALUES ($1, $2, $3, $4, 'sent')
      RETURNING *
    `;
    
    return await pool.query(query, [recipient, message, sender_id, template_id]);
  }
}

const smsService = new SMSService();

// Get SMS templates
router.get('/templates', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder']), async (req, res) => {
  try {
    const query = 'SELECT * FROM sms_templates ORDER BY name ASC';
    const result = await pool.query(query);
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Get SMS templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create SMS template
router.post('/templates', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder']),
  [
    body('name').trim().notEmpty().withMessage('Template name is required'),
    body('content').trim().notEmpty().withMessage('Template content is required'),
    body('template_type').isIn(['announcement', 'reminder', 'alert']).withMessage('Invalid template type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { name, content, template_type } = req.body;

      const query = `
        INSERT INTO sms_templates (name, content, template_type)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await pool.query(query, [name, content, template_type]);

      res.status(201).json({
        message: 'SMS template created successfully',
        template: result.rows[0]
      });
    } catch (error) {
      console.error('Create SMS template error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Send bulk SMS
router.post('/send', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Department Head']),
  [
    body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('template_id').optional().isUUID().withMessage('Valid template ID required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { recipients, message, template_id } = req.body;

      // Validate recipients are phone numbers
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      for (const recipient of recipients) {
        if (!phoneRegex.test(recipient)) {
          return res.status(400).json({ 
            error: `Invalid phone number format: ${recipient}` 
          });
        }
      }

      const result = await smsService.sendSMS(recipients, message, {
        sender_id: req.user.id,
        template_id
      });

      res.json({
        message: 'SMS sent successfully',
        messageId: result.messageId,
        recipientsCount: recipients.length
      });
    } catch (error) {
      console.error('Send SMS error:', error);
      res.status(500).json({ error: 'Failed to send SMS' });
    }
  }
);

// Get SMS logs
router.get('/logs', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder']), async (req, res) => {
  try {
    const { page = 1, limit = 50, status, recipient } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND sl.status = $${paramIndex++}`;
      params.push(status);
    }

    if (recipient) {
      whereClause += ` AND sl.recipient_phone ILIKE $${paramIndex++}`;
      params.push(`%${recipient}%`);
    }

    const query = `
      SELECT sl.*, u.first_name, u.last_name, st.name as template_name
      FROM sms_logs sl
      LEFT JOIN users u ON sl.sender_id = u.id
      LEFT JOIN sms_templates st ON sl.template_id = st.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM sms_logs sl ${whereClause}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      logs: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get SMS logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get phone numbers for department members
router.get('/department/:id/phones', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder', 'Department Head']),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user has access to this department
      const hasAccess = req.user.roles.some(role => 
        ['Super Admin', 'Pastor', 'First Elder'].includes(role)
      );

      if (!hasAccess) {
        // Check if user is department head
        const deptQuery = 'SELECT head_id FROM departments WHERE id = $1';
        const deptResult = await pool.query(deptQuery, [id]);
        
        if (deptResult.rows.length === 0 || deptResult.rows[0].head_id !== req.user.id) {
          return res.status(403).json({ error: 'Permission denied' });
        }
      }

      const query = `
        SELECT DISTINCT u.phone_number, u.first_name, u.last_name
        FROM users u
        INNER JOIN department_members dm ON u.id = dm.user_id
        WHERE dm.department_id = $1 AND u.is_active = true AND u.phone_number IS NOT NULL
        ORDER BY u.last_name, u.first_name
      `;

      const result = await pool.query(query, [id]);

      const phoneNumbers = result.rows.map(row => ({
        phone: row.phone_number,
        name: `${row.first_name} ${row.last_name}`
      }));

      res.json({ phoneNumbers });
    } catch (error) {
      console.error('Get department phones error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Send SMS to all members
router.post('/send-all', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder']),
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('include_inactive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { message, include_inactive = false } = req.body;

      const query = `
        SELECT phone_number FROM users 
        WHERE phone_number IS NOT NULL 
        ${include_inactive ? '' : 'AND is_active = true'}
      `;

      const result = await pool.query(query);
      const phoneNumbers = result.rows.map(row => row.phone_number);

      if (phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'No phone numbers found' });
      }

      const smsResult = await smsService.sendSMS(phoneNumbers, message, {
        sender_id: req.user.id
      });

      res.json({
        message: 'SMS sent to all members successfully',
        messageId: smsResult.messageId,
        recipientsCount: phoneNumbers.length
      });
    } catch (error) {
      console.error('Send SMS to all error:', error);
      res.status(500).json({ error: 'Failed to send SMS' });
    }
  }
);

module.exports = router;
