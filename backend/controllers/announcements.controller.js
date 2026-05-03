const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

class AnnouncementController {
  // Create new announcement
  static async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { title, content, announcement_type = 'general', department_id, priority = 'normal', expires_at, is_public = true } = req.body;

      const query = `
        INSERT INTO announcements (title, content, announcement_type, department_id, author_id, priority, expires_at, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await pool.query(query, [
        title, content, announcement_type, department_id, req.user.id, priority, expires_at, is_public
      ]);

      // Get announcement with author details
      const announcementQuery = `
        SELECT a.*, u.first_name, u.last_name, u.email,
               d.name as department_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.id = $1
      `;

      const announcementResult = await pool.query(announcementQuery, [result.rows[0].id]);

      res.status(201).json({
        message: 'Announcement created successfully',
        announcement: announcementResult.rows[0]
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all announcements (with filtering)
  static async getAll(req, res) {
    try {
      const { page = 1, limit = 20, department_id, priority, is_public } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (department_id) {
        whereClause += ` AND a.department_id = $${paramIndex++}`;
        params.push(department_id);
      }

      if (priority) {
        whereClause += ` AND a.priority = $${paramIndex++}`;
        params.push(priority);
      }

      if (is_public !== undefined) {
        whereClause += ` AND a.is_public = $${paramIndex++}`;
        params.push(is_public === 'true');
      }

      // For non-admin users, only show public announcements or their department's
      if (!req.user.roles.includes('Super Admin') && !req.user.roles.includes('Pastor') && !req.user.roles.includes('First Elder')) {
        whereClause += ` AND (a.is_public = true OR a.department_id IN (
          SELECT department_id FROM department_members WHERE user_id = $${paramIndex++}
        ))`;
        params.push(req.user.id);
      }

      const query = `
        SELECT a.*, u.first_name, u.last_name, u.email,
               d.name as department_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM announcements a
        ${whereClause}
      `;

      const countResult = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        announcements: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single announcement
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT a.*, u.first_name, u.last_name, u.email,
               d.name as department_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      const announcement = result.rows[0];

      // Check access permissions
      if (!announcement.is_public && 
          !req.user.roles.includes('Super Admin') && 
          !req.user.roles.includes('Pastor') && 
          !req.user.roles.includes('First Elder')) {
        
        // Check if user is member of the department
        const deptMemberQuery = `
          SELECT 1 FROM department_members 
          WHERE user_id = $1 AND department_id = $2
        `;
        const deptMemberResult = await pool.query(deptMemberQuery, [req.user.id, announcement.department_id]);
        
        if (deptMemberResult.rows.length === 0) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      res.json({ announcement });
    } catch (error) {
      console.error('Get announcement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update announcement
  static async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const { title, content, announcement_type, department_id, priority, expires_at, is_public } = req.body;

      // Check if announcement exists and user has permission
      const checkQuery = `
        SELECT a.*, 
               CASE 
                 WHEN a.author_id = $1 THEN true
                 WHEN $2 = ANY($3) THEN true
                 ELSE false
               END as can_edit
        FROM announcements a
        WHERE a.id = $4
      `;

      const checkResult = await pool.query(checkQuery, [
        req.user.id, 
        'Super Admin', 
        ['Super Admin', 'Pastor', 'First Elder'], 
        id
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      if (!checkResult.rows[0].can_edit) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      const updateQuery = `
        UPDATE announcements 
        SET title = $1, content = $2, announcement_type = $3, department_id = $4, 
            priority = $5, expires_at = $6, is_public = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [
        title, content, announcement_type, department_id, priority, expires_at, is_public, id
      ]);

      res.json({
        message: 'Announcement updated successfully',
        announcement: result.rows[0]
      });
    } catch (error) {
      console.error('Update announcement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete announcement
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if announcement exists and user has permission
      const checkQuery = `
        SELECT a.*, 
               CASE 
                 WHEN a.author_id = $1 THEN true
                 WHEN $2 = ANY($3) THEN true
                 ELSE false
               END as can_delete
        FROM announcements a
        WHERE a.id = $4
      `;

      const checkResult = await pool.query(checkQuery, [
        req.user.id, 
        'Super Admin', 
        ['Super Admin', 'Pastor', 'First Elder'], 
        id
      ]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      if (!checkResult.rows[0].can_delete) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      await pool.query('DELETE FROM announcements WHERE id = $1', [id]);

      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get public announcements (no authentication required)
  static async getPublic(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const query = `
        SELECT a.*, 
               u.first_name, u.last_name,
               d.name as department_name
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN departments d ON a.department_id = d.id
        WHERE a.is_public = true 
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
        ORDER BY a.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM announcements a
        WHERE a.is_public = true 
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
      `;

      const [result, countResult] = await Promise.all([
        pool.query(query, [limit, offset]),
        pool.query(countQuery)
      ]);

      const total = parseInt(countResult.rows[0].total);
      const pages = Math.ceil(total / limit);

      res.json({
        announcements: result.rows,
        pagination: {
          current: parseInt(page),
          total: pages,
          count: result.rows.length,
          total_items: total
        }
      });
    } catch (error) {
      console.error('Get public announcements error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = AnnouncementController;
