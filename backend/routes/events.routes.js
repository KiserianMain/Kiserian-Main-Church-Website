const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, department_id, is_public } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Add filters
    if (department_id) {
      whereClause += ` AND e.department_id = $${paramIndex++}`;
      params.push(department_id);
    }

    if (is_public !== undefined) {
      whereClause += ` AND e.is_public = $${paramIndex++}`;
      params.push(is_public === 'true');
    }

    // For non-admin users, only show public events or their department's
    if (!req.user.roles.includes('Super Admin') && !req.user.roles.includes('Pastor') && !req.user.roles.includes('First Elder')) {
      whereClause += ` AND (e.is_public = true OR e.department_id IN (
        SELECT department_id FROM department_members WHERE user_id = $${paramIndex++}
      ))`;
      params.push(req.user.id);
    }

    const query = `
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name,
             d.name as department_name, 
             COUNT(ea.id) as attendee_count
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN event_attendance ea ON e.id = ea.event_id
      ${whereClause}
      GROUP BY e.id, u.first_name, u.last_name, d.name
      ORDER BY e.event_date ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM events e ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      events: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT e.*, u.first_name as organizer_first_name, u.last_name as organizer_last_name,
             d.name as department_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = result.rows[0];

    // Check access permissions
    if (!event.is_public && 
        !req.user.roles.includes('Super Admin') && 
        !req.user.roles.includes('Pastor') && 
        !req.user.roles.includes('First Elder')) {
      
      // Check if user is member of the department
      const deptMemberQuery = `
        SELECT 1 FROM department_members 
        WHERE user_id = $1 AND department_id = $2
      `;
      const deptMemberResult = await pool.query(deptMemberQuery, [req.user.id, event.department_id]);
      
      if (deptMemberResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Get attendees
    const attendeesQuery = `
      SELECT u.id, u.first_name, u.last_name, u.email, ea.registered_at, ea.attended
      FROM event_attendance ea
      INNER JOIN users u ON ea.member_id = u.id
      WHERE ea.event_id = $1
      ORDER BY ea.registered_at ASC
    `;

    const attendeesResult = await pool.query(attendeesQuery, [id]);

    res.json({ 
      event: {
        ...event,
        attendees: attendeesResult.rows
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create event
router.post('/', 
  authenticateToken, 
  [
    body('title').trim().notEmpty().withMessage('Event title is required'),
    body('description').trim().notEmpty().withMessage('Event description is required'),
    body('event_date').isISO8601().withMessage('Valid event date is required'),
    body('location').trim().notEmpty().withMessage('Event location is required'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be positive'),
    body('is_public').optional().isBoolean().withMessage('Is public must be boolean')
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

      const { title, description, event_date, location, department_id, max_attendees, is_public = true } = req.body;

      const query = `
        INSERT INTO events (title, description, event_date, location, department_id, organizer_id, max_attendees, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        title, description, event_date, location, department_id, req.user.id, max_attendees, is_public
      ]);

      res.status(201).json({
        message: 'Event created successfully',
        event: result.rows[0]
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update event
router.put('/:id', 
  authenticateToken,
  [
    body('title').optional().trim().notEmpty().withMessage('Event title cannot be empty'),
    body('description').optional().trim().notEmpty().withMessage('Event description cannot be empty'),
    body('event_date').optional().isISO8601().withMessage('Valid event date is required'),
    body('location').optional().trim().notEmpty().withMessage('Event location cannot be empty'),
    body('department_id').optional().isUUID().withMessage('Valid department ID required'),
    body('max_attendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be positive'),
    body('is_public').optional().isBoolean().withMessage('Is public must be boolean')
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
      const { title, description, event_date, location, department_id, max_attendees, is_public } = req.body;

      // Check if event exists and user has permission
      const checkQuery = `
        SELECT e.*, 
               CASE 
                 WHEN e.organizer_id = $1 THEN true
                 WHEN $2 = ANY($3) THEN true
                 ELSE false
               END as can_edit
        FROM events e
        WHERE e.id = $4
      `;

      const checkResult = await pool.query(checkQuery, [
        req.user.id, 
        'Super Admin', 
        ['Super Admin', 'Pastor', 'First Elder'], 
        id
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!checkResult.rows[0].can_edit) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updateQuery = `
        UPDATE events 
        SET title = COALESCE($1, title), 
            description = COALESCE($2, description), 
            event_date = COALESCE($3, event_date), 
            location = COALESCE($4, location), 
            department_id = COALESCE($5, department_id), 
            max_attendees = COALESCE($6, max_attendees), 
            is_public = COALESCE($7, is_public),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        title, description, event_date, location, department_id, max_attendees, is_public, id
      ]);

      res.json({
        message: 'Event updated successfully',
        event: result.rows[0]
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and is accessible
    const eventQuery = `
      SELECT e.*, 
             CASE 
               WHEN e.is_public = true THEN true
               WHEN e.department_id IN (
                 SELECT department_id FROM department_members WHERE user_id = $1
               ) THEN true
               ELSE false
             END as can_access
      FROM events e
      WHERE e.id = $2
    `;

    const eventResult = await pool.query(eventQuery, [req.user.id, id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    if (!event.can_access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if event has max attendees limit
    if (event.max_attendees) {
      const countQuery = 'SELECT COUNT(*) as count FROM event_attendance WHERE event_id = $1';
      const countResult = await pool.query(countQuery, [id]);
      
      if (parseInt(countResult.rows[0].count) >= event.max_attendees) {
        return res.status(400).json({ error: 'Event is fully booked' });
      }
    }

    // Register for event
    const registerQuery = `
      INSERT INTO event_attendance (event_id, member_id)
      VALUES ($1, $2)
      ON CONFLICT (event_id, member_id) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(registerQuery, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    res.status(201).json({
      message: 'Successfully registered for event',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel event registration
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM event_attendance WHERE event_id = $1 AND member_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance (organizer or admin)
router.patch('/:id/attendance/:userId', 
  authenticateToken,
  [
    body('attended').isBoolean().withMessage('Attended status must be boolean')
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

      const { id, userId } = req.params;
      const { attended } = req.body;

      // Check if user has permission to mark attendance
      const eventQuery = 'SELECT organizer_id FROM events WHERE id = $1';
      const eventResult = await pool.query(eventQuery, [id]);

      if (eventResult.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const hasPermission = req.user.id === eventResult.rows[0].organizer_id ||
        req.user.roles.some(role => ['Super Admin', 'Pastor', 'First Elder'].includes(role));

      if (!hasPermission) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const result = await pool.query(
        'UPDATE event_attendance SET attended = $1 WHERE event_id = $2 AND member_id = $3 RETURNING *',
        [attended, id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      res.json({
        message: 'Attendance marked successfully',
        attendance: result.rows[0]
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete event (organizer or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and user has permission
    const checkQuery = `
      SELECT e.*, 
             CASE 
               WHEN e.organizer_id = $1 THEN true
               WHEN $2 = ANY($3) THEN true
               ELSE false
               END as can_delete
      FROM events e
      WHERE e.id = $4
    `;

    const checkResult = await pool.query(checkQuery, [
      req.user.id, 
      'Super Admin', 
      ['Super Admin', 'Pastor', 'First Elder'], 
      id
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!checkResult.rows[0].can_delete) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
