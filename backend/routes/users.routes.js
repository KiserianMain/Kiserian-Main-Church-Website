const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['Super Admin', 'Pastor', 'First Elder']), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, department } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE u.is_active = true';
    const params = [];
    let paramIndex = 1;

    if (role) {
      whereClause += ` AND $${paramIndex} = ANY(u.roles)`;
      params.push(role);
      paramIndex++;
    }

    if (department) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.user_id = u.id AND dm.department_id = $${paramIndex}
      )`;
      params.push(department);
      paramIndex++;
    }

    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.phone_number, u.is_active, u.created_at,
             u.roles
      FROM (
        SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
               u.phone_number, u.is_active, u.created_at,
               array_agg(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id
      ) u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT u.id
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.is_active = true
        ${role ? ` AND $1 = ANY(array_agg(r.name))` : ''}
        ${department ? ` AND EXISTS (
          SELECT 1 FROM department_members dm 
          WHERE dm.user_id = u.id AND dm.department_id = $2
        )` : ''}
        GROUP BY u.id
      ) u
    `;

    const countParams = [];
    if (role) countParams.push(role);
    if (department) countParams.push(department);

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless they're admin
    if (req.user.id !== id && !req.user.roles.some(role => 
        ['Super Admin', 'Pastor', 'First Elder'].includes(role))) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.phone_number, u.is_active, u.created_at,
             array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's departments
    const deptQuery = `
      SELECT d.id, d.name, dm.role_in_department, dm.joined_at
      FROM departments d
      INNER JOIN department_members dm ON d.id = dm.department_id
      WHERE dm.user_id = $1
      ORDER BY dm.joined_at ASC
    `;

    const deptResult = await pool.query(deptQuery, [id]);

    const user = {
      ...result.rows[0],
      departments: deptResult.rows
    };

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:id', 
  authenticateToken,
  [
    body('first_name').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone_number').optional().isMobilePhone().withMessage('Valid phone number required'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required')
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

      const { id } = req.params;
      const { first_name, last_name, phone_number, email } = req.body;

      // Users can only update their own profile unless they're admin
      if (req.user.id !== id && !req.user.roles.some(role => 
          ['Super Admin', 'Pastor', 'First Elder'].includes(role))) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updateQuery = `
        UPDATE users 
        SET first_name = COALESCE($1, first_name), 
            last_name = COALESCE($2, last_name), 
            phone_number = COALESCE($3, phone_number),
            email = COALESCE($4, email),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, username, email, first_name, last_name, phone_number, updated_at
      `;

      const result = await pool.query(updateQuery, [
        first_name, last_name, phone_number, email, id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User updated successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Assign role to user (admin only)
router.post('/:id/roles', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder']),
  [
    body('role_id').isUUID().withMessage('Valid role ID required')
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

      const { id } = req.params;
      const { role_id } = req.body;

      const query = `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
        RETURNING *
      `;

      const result = await pool.query(query, [id, role_id]);

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'User already has this role' });
      }

      res.status(201).json({
        message: 'Role assigned successfully',
        user_role: result.rows[0]
      });
    } catch (error) {
      console.error('Assign role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Remove role from user (admin only)
router.delete('/:id/roles/:roleId', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder']),
  async (req, res) => {
    try {
      const { id, roleId } = req.params;

      const result = await pool.query(
        'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *',
        [id, roleId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Role assignment not found' });
      }

      res.json({ message: 'Role removed successfully' });
    } catch (error) {
      console.error('Remove role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Deactivate user (admin only)
router.patch('/:id/deactivate', 
  authenticateToken, 
  requireRole(['Super Admin']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'User deactivated successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
