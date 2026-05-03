const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT d.*, u.first_name as head_first_name, u.last_name as head_last_name,
             COUNT(dm.user_id) as member_count
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      LEFT JOIN department_members dm ON d.id = dm.department_id
      GROUP BY d.id, u.first_name, u.last_name
      ORDER BY d.name ASC
    `;

    const result = await pool.query(query);
    res.json({ departments: result.rows });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single department
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT d.*, u.first_name as head_first_name, u.last_name as head_last_name
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ department: result.rows[0] });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get department members
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone_number,
             dm.role_in_department, dm.joined_at, array_agg(r.name) as roles
      FROM users u
      INNER JOIN department_members dm ON u.id = dm.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE dm.department_id = $1 AND u.is_active = true
      GROUP BY u.id, dm.role_in_department, dm.joined_at
      ORDER BY dm.joined_at ASC
    `;

    const result = await pool.query(query, [id]);
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get department members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create department (admin only)
router.post('/', 
  authenticateToken, 
  requireRole(['Super Admin', 'Pastor', 'First Elder']),
  [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('description').optional().trim(),
    body('head_id').optional().isUUID().withMessage('Valid head ID required')
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

      const { name, description, head_id } = req.body;

      const query = `
        INSERT INTO departments (name, description, head_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const result = await pool.query(query, [name, description, head_id]);

      res.status(201).json({
        message: 'Department created successfully',
        department: result.rows[0]
      });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update department (admin or department head)
router.put('/:id', 
  authenticateToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Department name cannot be empty'),
    body('description').optional().trim(),
    body('head_id').optional().isUUID().withMessage('Valid head ID required')
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
      const { name, description, head_id } = req.body;

      // Check permissions
      const hasAdminRole = req.user.roles.some(role => 
        ['Super Admin', 'Pastor', 'First Elder'].includes(role)
      );

      if (!hasAdminRole) {
        // Check if user is department head
        const deptQuery = 'SELECT head_id FROM departments WHERE id = $1';
        const deptResult = await pool.query(deptQuery, [id]);
        
        if (deptResult.rows.length === 0 || deptResult.rows[0].head_id !== req.user.id) {
          return res.status(403).json({ error: 'Permission denied' });
        }
      }

      const updateQuery = `
        UPDATE departments 
        SET name = COALESCE($1, name), 
            description = COALESCE($2, description), 
            head_id = COALESCE($3, head_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [name, description, head_id, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }

      res.json({
        message: 'Department updated successfully',
        department: result.rows[0]
      });
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Add member to department (admin or department head)
router.post('/:id/members', 
  authenticateToken,
  [
    body('user_id').isUUID().withMessage('Valid user ID required'),
    body('role_in_department').optional().trim()
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
      const { user_id, role_in_department } = req.body;

      // Check permissions
      const hasAdminRole = req.user.roles.some(role => 
        ['Super Admin', 'Pastor', 'First Elder'].includes(role)
      );

      if (!hasAdminRole) {
        // Check if user is department head
        const deptQuery = 'SELECT head_id FROM departments WHERE id = $1';
        const deptResult = await pool.query(deptQuery, [id]);
        
        if (deptResult.rows.length === 0 || deptResult.rows[0].head_id !== req.user.id) {
          return res.status(403).json({ error: 'Permission denied' });
        }
      }

      const query = `
        INSERT INTO department_members (user_id, department_id, role_in_department)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, department_id) DO UPDATE
        SET role_in_department = EXCLUDED.role_in_department
        RETURNING *
      `;

      const result = await pool.query(query, [user_id, id, role_in_department]);

      res.status(201).json({
        message: 'Member added to department successfully',
        membership: result.rows[0]
      });
    } catch (error) {
      console.error('Add department member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Remove member from department (admin or department head)
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check permissions
    const hasAdminRole = req.user.roles.some(role => 
      ['Super Admin', 'Pastor', 'First Elder'].includes(role)
    );

    if (!hasAdminRole) {
      // Check if user is department head
      const deptQuery = 'SELECT head_id FROM departments WHERE id = $1';
      const deptResult = await pool.query(deptQuery, [id]);
      
      if (deptResult.rows.length === 0 || deptResult.rows[0].head_id !== req.user.id) {
        return res.status(403).json({ error: 'Permission denied' });
      }
    }

    await pool.query('DELETE FROM department_members WHERE department_id = $1 AND user_id = $2', [id, userId]);

    res.json({ message: 'Member removed from department successfully' });
  } catch (error) {
    console.error('Remove department member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
