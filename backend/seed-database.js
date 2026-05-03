const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Generate UUIDs
    const superAdminId = uuidv4();
    const pastorId = uuidv4();
    const elderId = uuidv4();
    const deptHeadId = uuidv4();
    const memberId = uuidv4();

    const adminUserId = uuidv4();
    const pastorUserId = uuidv4();
    const memberUserId = uuidv4();

    // Insert sample roles
    await pool.query(`
      INSERT INTO roles (id, name, description, created_at) VALUES
      ($1, 'Super Admin', 'Full system administration', NOW()),
      ($2, 'Pastor', 'Church pastor with full oversight', NOW()),
      ($3, 'Elder', 'Church elder with oversight responsibilities', NOW()),
      ($4, 'Department Head', 'Head of a church department', NOW()),
      ($5, 'Member', 'Regular church member', NOW())
      ON CONFLICT (id) DO NOTHING
    `, [superAdminId, pastorId, elderId, deptHeadId, memberId]);

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const pastorPassword = await bcrypt.hash('pastor123', 10);
    const memberPassword = await bcrypt.hash('member123', 10);

    // Insert sample users
    await pool.query(`
      INSERT INTO users (id, first_name, last_name, username, email, phone_number, password_hash, is_active, created_at) VALUES
      ($1, 'Admin', 'User', 'admin', 'admin@sda.org', '+254700000000', $2, true, NOW()),
      ($3, 'Pastor', 'John', 'pastor', 'pastor@sda.org', '+254700000001', $4, true, NOW()),
      ($5, 'Church', 'Member', 'member', 'member@sda.org', '+254700000002', $6, true, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [adminUserId, adminPassword, pastorUserId, pastorPassword, memberUserId, memberPassword]);

    // Insert user roles
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
      ($1, $2, NOW()),
      ($3, $4, NOW()),
      ($5, $6, NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [adminUserId, superAdminId, pastorUserId, pastorId, memberUserId, memberId]);

    // Generate department UUIDs
    const sabbathDeptId = uuidv4();
    const youthDeptId = uuidv4();
    const musicDeptId = uuidv4();
    const outreachDeptId = uuidv4();

    // Insert sample departments
    await pool.query(`
      INSERT INTO departments (id, name, description, head_user_id, created_at) VALUES
      ($1, 'Sabbath School', 'Bible study and spiritual education for all ages', $2, NOW()),
      ($3, 'Youth Ministry', 'Programs and activities for young adults', $4, NOW()),
      ($5, 'Music Ministry', 'Choir and worship music coordination', $6, NOW()),
      ($7, 'Community Outreach', 'Evangelism and community service programs', $8, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [sabbathDeptId, pastorUserId, youthDeptId, adminUserId, musicDeptId, adminUserId, outreachDeptId, pastorUserId]);

    // Insert department memberships
    await pool.query(`
      INSERT INTO department_memberships (user_id, department_id, role_in_department, joined_at) VALUES
      ($1, $2, 'Superintendent', NOW()),
      ($3, $4, 'Director', NOW()),
      ($5, $6, 'Leader', NOW()),
      ($7, $8, 'Member', NOW())
      ON CONFLICT (user_id, department_id) DO NOTHING
    `, [pastorUserId, sabbathDeptId, pastorUserId, outreachDeptId, adminUserId, youthDeptId, memberUserId, sabbathDeptId]);

    // Generate payment category UUIDs
    const titheCatId = uuidv4();
    const offeringCatId = uuidv4();
    const missionCatId = uuidv4();
    const buildingCatId = uuidv4();
    const educationCatId = uuidv4();

    // Insert sample payment categories
    await pool.query(`
      INSERT INTO payment_categories (id, name, description, is_active, created_at) VALUES
      ($1, 'Tithe', 'Return your tithe to God', true, NOW()),
      ($2, 'Church Offering', 'General church offering', true, NOW()),
      ($3, 'Mission Offering', 'Support for mission work', true, NOW()),
      ($4, 'Building Fund', 'Church building and maintenance', true, NOW()),
      ($5, 'Education Fund', 'Support for church education programs', true, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [titheCatId, offeringCatId, missionCatId, buildingCatId, educationCatId]);

    // Generate announcement UUIDs
    const announce1Id = uuidv4();
    const announce2Id = uuidv4();
    const announce3Id = uuidv4();
    const announce4Id = uuidv4();
    const announce5Id = uuidv4();

    // Insert sample announcements
    await pool.query(`
      INSERT INTO announcements (id, title, content, announcement_type, author_id, priority, is_public, created_at) VALUES
      ($1, 'Welcome to Our Church Website', 'We are excited to launch our new church website! This platform will help us better connect with our members and the community. Please explore the features and let us know your feedback.', 'general', $2, 'high', true, NOW()),
      ($3, 'Sabbath School This Saturday', 'Join us this Saturday for Sabbath School at 9:00 AM. We have classes for all ages from children to adults. This week we will be studying the Book of Romans.', 'general', $4, 'normal', true, NOW()),
      ($5, 'Prayer Meeting Wednesday Evening', 'Please join us for our mid-week prayer meeting every Wednesday at 7:00 PM. This is a special time of fellowship and prayer together as a church family.', 'general', $6, 'normal', true, NOW()),
      ($7, 'Community Outreach Program', 'Our church is organizing a community outreach program next weekend. We will be visiting homes in the Kiserian area to share the good news and provide assistance where needed.', 'general', $8, 'high', true, NOW()),
      ($9, 'Youth Fellowship Meeting', 'All youth are invited to our fellowship meeting this Friday at 6:00 PM. We will have games, worship, and a special discussion on faith in modern times.', 'department', $10, 'normal', true, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [announce1Id, adminUserId, announce2Id, pastorUserId, announce3Id, pastorUserId, announce4Id, adminUserId, announce5Id, adminUserId]);

    // Generate event UUIDs
    const event1Id = uuidv4();
    const event2Id = uuidv4();
    const event3Id = uuidv4();
    const event4Id = uuidv4();

    // Insert sample events
    await pool.query(`
      INSERT INTO events (id, title, description, event_type, start_datetime, end_datetime, location, is_public, created_at) VALUES
      ($1, 'Divine Service', 'Weekly divine worship service', 'worship', '2024-12-07 09:00:00', '2024-12-07 11:30:00', 'Main Sanctuary', true, NOW()),
      ($2, 'Sabbath School', 'Weekly Bible study classes', 'education', '2024-12-07 07:00:00', '2024-12-07 08:45:00', 'Various Classrooms', true, NOW()),
      ($3, 'Prayer Meeting', 'Mid-week prayer and fellowship', 'fellowship', '2024-12-04 19:00:00', '2024-12-04 20:30:00', 'Church Hall', true, NOW()),
      ($4, 'Youth Fellowship', 'Youth gathering and activities', 'fellowship', '2024-12-06 18:00:00', '2024-12-06 20:00:00', 'Youth Room', true, NOW())
      ON CONFLICT (id) DO NOTHING
    `, [event1Id, event2Id, event3Id, event4Id]);

    console.log('Database seeded successfully!');
    console.log('Sample users created:');
    console.log('  Admin: admin@sda.org / admin123');
    console.log('  Pastor: pastor@sda.org / pastor123');
    console.log('  Member: member@sda.org / member123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
