const db = require('../config/database');

// Department Controller - Adapted from Ubuntu HRMS for Church Departments
class DepartmentController {
  // Get all departments for current user
  static async getUserDepartments(req, res) {
    try {
      const userId = req.user.id;
      
      const departments = await db.query(`
        SELECT 
          d.id,
          d.name,
          d.description,
          d.category,
          d.leader_name,
          d.leader_contact,
          dm.role,
          dm.joined_at,
          CASE 
            WHEN dm.role = 'Leader' THEN true
            WHEN dm.role = 'Assistant' THEN true
            WHEN dm.role = 'Secretary' THEN true
            ELSE false
          END as can_manage
        FROM departments d
        JOIN department_members dm ON d.id = dm.department_id
        WHERE dm.user_id = $1 AND dm.is_active = true AND d.is_active = true
        ORDER BY d.category, d.name
      `, [userId]);
      
      res.json({
        success: true,
        data: departments.rows
      });
      
    } catch (error) {
      console.error('Error fetching user departments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch departments',
        details: error.message
      });
    }
  }

  // Get department dashboard with metrics
  static async getDepartmentDashboard(req, res) {
    try {
      const { departmentId } = req.params;
      const userId = req.user.id;
      
      // Verify user has access to this department
      const accessCheck = await db.query(`
        SELECT dm.role, d.name as department_name, d.category
        FROM department_members dm
        JOIN departments d ON dm.department_id = d.id
        WHERE dm.department_id = $1 AND dm.user_id = $2 AND dm.is_active = true
      `, [departmentId, userId]);
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this department'
        });
      }
      
      const userRole = accessCheck.rows[0].role;
      const departmentName = accessCheck.rows[0].name;
      const departmentCategory = accessCheck.rows[0].category;
      
      // Get department metrics
      const metrics = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM department_members WHERE department_id = $1 AND is_active = true) as total_members,
          (SELECT COUNT(*) FROM department_communications WHERE department_id = $1 AND sent_at >= CURRENT_DATE - INTERVAL '30 days') as communications_this_month,
          (SELECT COUNT(*) FROM department_meetings WHERE department_id = $1 AND meeting_date >= CURRENT_DATE - INTERVAL '30 days') as meetings_this_month,
          (SELECT COUNT(*) FROM department_tasks WHERE department_id = $1 AND status != 'completed') as pending_tasks,
          (SELECT COUNT(*) FROM department_reports WHERE department_id = $1 AND submission_date >= CURRENT_DATE - INTERVAL '30 days') as reports_this_month,
          (SELECT COUNT(*) FROM department_resources WHERE department_id = $1 AND uploaded_at >= CURRENT_DATE - INTERVAL '30 days') as resources_added_this_month
      `, [departmentId]);
      
      // Get recent activities
      const recentActivities = await db.query(`
        SELECT 
          'communication' as type,
          dc.title,
          dc.sent_at as date,
          CONCAT(u.first_name, ' ', u.last_name) as author
        FROM department_communications dc
        JOIN users u ON dc.sender_id = u.id
        WHERE dc.department_id = $1
        UNION ALL
        SELECT 
          'meeting' as type,
          dm.title,
          dm.meeting_date as date,
          CONCAT(u.first_name, ' ', u.last_name) as author
        FROM department_meetings dm
        JOIN users u ON dm.organizer_id = u.id
        WHERE dm.department_id = $1
        UNION ALL
        SELECT 
          'task' as type,
          dt.title,
          dt.created_at as date,
          CONCAT(u.first_name, ' ', u.last_name) as author
        FROM department_tasks dt
        JOIN users u ON dt.assigned_by = u.id
        WHERE dt.department_id = $1
        ORDER BY date DESC
        LIMIT 10
      `, [departmentId]);
      
      // Get upcoming meetings
      const upcomingMeetings = await db.query(`
        SELECT 
          id,
          title,
          description,
          meeting_date,
          duration,
          location,
          status
        FROM department_meetings
        WHERE department_id = $1 AND meeting_date >= CURRENT_DATE
        ORDER BY meeting_date ASC
        LIMIT 5
      `, [departmentId]);
      
      // Get pending tasks
      const pendingTasks = await db.query(`
        SELECT 
          dt.id,
          dt.title,
          dt.description,
          dt.due_date,
          dt.priority,
          CONCAT(u.first_name, ' ', u.last_name) as assigned_to_name,
          CONCAT(ua.first_name, ' ', ua.last_name) as assigned_by_name
        FROM department_tasks dt
        JOIN users u ON dt.assigned_to = u.id
        JOIN users ua ON dt.assigned_by = ua.id
        WHERE dt.department_id = $1 AND dt.status = 'pending'
        ORDER BY dt.due_date ASC
        LIMIT 10
      `, [departmentId]);
      
      const dashboard = {
        department: {
          id: departmentId,
          name: departmentName,
          category: departmentCategory,
          userRole: userRole
        },
        metrics: metrics.rows[0] || {},
        recentActivities: recentActivities.rows,
        upcomingMeetings: upcomingMeetings.rows,
        pendingTasks: pendingTasks.rows
      };
      
      res.json({
        success: true,
        data: dashboard
      });
      
    } catch (error) {
      console.error('Error fetching department dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch department dashboard',
        details: error.message
      });
    }
  }

  // Create department communication
  static async createCommunication(req, res) {
    try {
      const { departmentId } = req.params;
      const { title, message, type, priority, expiresAt } = req.body;
      const senderId = req.user.id;
      
      // Verify user can create communications for this department
      const accessCheck = await db.query(`
        SELECT role FROM department_members 
        WHERE department_id = $1 AND user_id = $2 AND is_active = true
      `, [departmentId, senderId]);
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this department'
        });
      }
      
      const result = await db.query(`
        INSERT INTO department_communications 
        (department_id, title, message, type, priority, sender_id, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [departmentId, title, message, type, priority || 'normal', senderId, expiresAt]);
      
      // Notify department members (in real implementation, this would send notifications)
      await this.notifyDepartmentMembers(departmentId, 'communication', result.rows[0]);
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Communication created successfully'
      });
      
    } catch (error) {
      console.error('Error creating communication:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create communication',
        details: error.message
      });
    }
  }

  // Get department communications
  static async getCommunications(req, res) {
    try {
      const { departmentId } = req.params;
      const { page = 1, limit = 20, type, priority } = req.query;
      const userId = req.user.id;
      
      // Verify user has access
      const accessCheck = await db.query(`
        SELECT 1 FROM department_members 
        WHERE department_id = $1 AND user_id = $2 AND is_active = true
      `, [departmentId, userId]);
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this department'
        });
      }
      
      let query = `
        SELECT 
          dc.*,
          CONCAT(u.first_name, ' ', u.last_name) as sender_name,
          u.email as sender_email
        FROM department_communications dc
        JOIN users u ON dc.sender_id = u.id
        WHERE dc.department_id = $1 AND dc.is_active = true
      `;
      
      const params = [departmentId];
      let paramIndex = 2;
      
      if (type) {
        query += ` AND dc.type = $${paramIndex++}`;
        params.push(type);
      }
      
      if (priority) {
        query += ` AND dc.priority = $${paramIndex++}`;
        params.push(priority);
      }
      
      query += ` ORDER BY dc.sent_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      const limitNum = parseInt(limit);
      const offset = (parseInt(page) - 1) * limitNum;
      params.push(limitNum, offset);
      
      const communications = await db.query(query, params);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM department_communications 
        WHERE department_id = $1 AND is_active = true
      `;
      const countResult = await db.query(countQuery, [departmentId]);
      
      res.json({
        success: true,
        data: communications.rows,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limitNum)
        }
      });
      
    } catch (error) {
      console.error('Error fetching communications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch communications',
        details: error.message
      });
    }
  }

  // Create department meeting
  static async createMeeting(req, res) {
    try {
      const { departmentId } = req.params;
      const { title, description, meetingDate, duration, location } = req.body;
      const organizerId = req.user.id;
      
      // Verify user can create meetings
      const accessCheck = await db.query(`
        SELECT role FROM department_members 
        WHERE department_id = $1 AND user_id = $2 AND is_active = true
      `, [departmentId, organizerId]);
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this department'
        });
      }
      
      const result = await db.query(`
        INSERT INTO department_meetings 
        (department_id, title, description, meeting_date, duration, location, organizer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [departmentId, title, description, meetingDate, duration, location, organizerId]);
      
      // Auto-add all department members as attendees
      await db.query(`
        INSERT INTO department_meeting_attendees (meeting_id, member_id)
        SELECT $1, user_id
        FROM department_members 
        WHERE department_id = $2 AND is_active = true
        ON CONFLICT (meeting_id, member_id) DO NOTHING
      `, [result.rows[0].id, departmentId]);
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Meeting created successfully'
      });
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create meeting',
        details: error.message
      });
    }
  }

  // Get department members
  static async getDepartmentMembers(req, res) {
    try {
      const { departmentId } = req.params;
      const userId = req.user.id;
      
      // Verify user has access
      const accessCheck = await db.query(`
        SELECT role FROM department_members 
        WHERE department_id = $1 AND user_id = $2 AND is_active = true
      `, [departmentId, userId]);
      
      if (accessCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this department'
        });
      }
      
      const members = await db.query(`
        SELECT 
          dm.role,
          dm.joined_at,
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.phone_number,
          u.is_active as user_active
        FROM department_members dm
        JOIN users u ON dm.user_id = u.id
        WHERE dm.department_id = $1 AND dm.is_active = true
        ORDER BY dm.role, u.first_name, u.last_name
      `, [departmentId]);
      
      res.json({
        success: true,
        data: members.rows
      });
      
    } catch (error) {
      console.error('Error fetching department members:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch department members',
        details: error.message
      });
    }
  }

  // Helper function to notify department members (placeholder for notification system)
  static async notifyDepartmentMembers(departmentId, type, data) {
    try {
      // In a real implementation, this would send notifications via:
      // - Email notifications
      // - Push notifications for mobile app
      // - SMS notifications
      // - In-app notifications
      
      console.log(`Notifying department ${departmentId} about ${type}:`, data);
      
      // For now, just log the notification
      return true;
    } catch (error) {
      console.error('Error notifying department members:', error);
      return false;
    }
  }
}

module.exports = new DepartmentController();
