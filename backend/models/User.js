const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, first_name, last_name, phone_number } = userData;
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, first_name, last_name, phone_number, created_at
    `;

    try {
      const result = await pool.query(query, [
        username, email, password_hash, first_name, last_name, phone_number
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = `
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
      GROUP BY u.id
    `;

    try {
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findByUsername(username) {
    const query = `
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
      GROUP BY u.id
    `;

    try {
      const result = await pool.query(query, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async assignRole(userId, roleId) {
    const query = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;

    try {
      await pool.query(query, [userId, roleId]);
    } catch (error) {
      throw error;
    }
  }

  static async updateProfile(userId, updateData) {
    const { first_name, last_name, phone_number } = updateData;
    
    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, phone_number = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, first_name, last_name, phone_number, updated_at
    `;

    try {
      const result = await pool.query(query, [
        first_name, last_name, phone_number, userId
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.phone_number, u.is_active, u.created_at,
             array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async getDepartmentMembers(departmentId) {
    const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
             u.phone_number, dm.role_in_department, dm.joined_at,
             array_agg(r.name) as roles
      FROM users u
      INNER JOIN department_members dm ON u.id = dm.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE dm.department_id = $1 AND u.is_active = true
      GROUP BY u.id, dm.role_in_department, dm.joined_at
      ORDER BY dm.joined_at ASC
    `;

    try {
      const result = await pool.query(query, [departmentId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
