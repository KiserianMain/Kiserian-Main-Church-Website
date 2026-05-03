const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userQuery = `
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check user roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ error: 'Access denied - no roles found' });
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ 
        error: 'Access denied - insufficient permissions',
        required: allowedRoles,
        current: userRoles
      });
    }

    next();
  };
};

// Middleware to check department access
const requireDepartmentAccess = async (req, res, next) => {
  try {
    const departmentId = req.params.departmentId || req.body.departmentId;
    
    if (!departmentId) {
      return res.status(400).json({ error: 'Department ID required' });
    }

    // Check if user is member of the department or has admin roles
    const accessQuery = `
      SELECT 
        CASE 
          WHEN $2 = ANY(u.roles) THEN true -- Admin roles
          WHEN dm.department_id IS NOT NULL THEN true -- Department member
          ELSE false
        END as has_access
      FROM users u
      LEFT JOIN department_members dm ON u.id = dm.user_id AND dm.department_id = $1
      WHERE u.id = $3
    `;

    const result = await pool.query(accessQuery, [
      departmentId, 
      ['Super Admin', 'Pastor', 'First Elder'], 
      req.user.id
    ]);

    if (!result.rows[0].has_access) {
      return res.status(403).json({ error: 'Access denied - not a department member' });
    }

    next();
  } catch (error) {
    console.error('Department access check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireDepartmentAccess
};
