-- Sample Data for SDA Church Kiserian Main

-- Insert sample users
INSERT INTO users (id, first_name, last_name, username, email, phone_number, password_hash, is_active, created_at) VALUES
('admin-id', 'Admin', 'User', 'admin', 'admin@sda.org', '+254700000000', '$2b$10$rQZ8ZG5Q5Q5Q5Q5Q5Q5Q5OZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ', true, NOW()),
('pastor-id', 'Pastor', 'John', 'pastor', 'pastor@sda.org', '+254700000001', '$2b$10$rQZ8ZG5Q5Q5Q5Q5Q5Q5Q5OZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', true, NOW()),
('member-id', 'Church', 'Member', 'member', 'member@sda.org', '+254700000002', '$2b$10$rQZ8ZG5Q5Q5Q5Q5Q5Q5Q5OZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', true, NOW());

-- Insert user roles
INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
('admin-id', 'super-admin-id', NOW()),
('pastor-id', 'pastor-id', NOW()),
('member-id', 'member-id', NOW());

-- Insert sample announcements
INSERT INTO announcements (id, title, content, announcement_type, author_id, priority, is_public, created_at) VALUES
('announce-1', 'Welcome to Our Church Website', 'We are excited to launch our new church website! This platform will help us better connect with our members and the community. Please explore the features and let us know your feedback.', 'general', 'admin-id', 'high', true, NOW()),
('announce-2', 'Sabbath School This Saturday', 'Join us this Saturday for Sabbath School at 9:00 AM. We have classes for all ages from children to adults. This week we will be studying the Book of Romans.', 'general', 'pastor-id', 'normal', true, NOW()),
('announce-3', 'Prayer Meeting Wednesday Evening', 'Please join us for our mid-week prayer meeting every Wednesday at 7:00 PM. This is a special time of fellowship and prayer together as a church family.', 'general', 'pastor-id', 'normal', true, NOW()),
('announce-4', 'Community Outreach Program', 'Our church is organizing a community outreach program next weekend. We will be visiting homes in the Kiserian area to share the good news and provide assistance where needed.', 'general', 'admin-id', 'high', true, NOW()),
('announce-5', 'Youth Fellowship Meeting', 'All youth are invited to our fellowship meeting this Friday at 6:00 PM. We will have games, worship, and a special discussion on faith in modern times.', 'department', 'admin-id', 'normal', true, NOW());

-- Insert sample departments
INSERT INTO departments (id, name, description, head_user_id, created_at) VALUES
('dept-sabbath', 'Sabbath School', 'Bible study and spiritual education for all ages', 'pastor-id', NOW()),
('dept-youth', 'Youth Ministry', 'Programs and activities for young adults', 'admin-id', NOW()),
('dept-music', 'Music Ministry', 'Choir and worship music coordination', 'admin-id', NOW()),
('dept-outreach', 'Community Outreach', 'Evangelism and community service programs', 'pastor-id', NOW());

-- Insert department memberships
INSERT INTO department_memberships (user_id, department_id, role_in_department, joined_at) VALUES
('pastor-id', 'dept-sabbath', 'Superintendent', NOW()),
('pastor-id', 'dept-outreach', 'Director', NOW()),
('admin-id', 'dept-youth', 'Leader', NOW()),
('member-id', 'dept-sabbath', 'Member', NOW());

-- Insert sample payment categories
INSERT INTO payment_categories (id, name, description, is_active, created_at) VALUES
('cat-tithe', 'Tithe', 'Return your tithe to God', true, NOW()),
('cat-offering', 'Church Offering', 'General church offering', true, NOW()),
('cat-mission', 'Mission Offering', 'Support for mission work', true, NOW()),
('cat-building', 'Building Fund', 'Church building and maintenance', true, NOW()),
('cat-education', 'Education Fund', 'Support for church education programs', true, NOW());

-- Insert sample events
INSERT INTO events (id, title, description, event_type, start_datetime, end_datetime, location, is_public, created_at) VALUES
('event-1', 'Divine Service', 'Weekly divine worship service', 'worship', '2024-12-07 09:00:00', '2024-12-07 11:30:00', 'Main Sanctuary', true, NOW()),
('event-2', 'Sabbath School', 'Weekly Bible study classes', 'education', '2024-12-07 07:00:00', '2024-12-07 08:45:00', 'Various Classrooms', true, NOW()),
('event-3', 'Prayer Meeting', 'Mid-week prayer and fellowship', 'fellowship', '2024-12-04 19:00:00', '2024-12-04 20:30:00', 'Church Hall', true, NOW()),
('event-4', 'Youth Fellowship', 'Youth gathering and activities', 'fellowship', '2024-12-06 18:00:00', '2024-12-06 20:00:00', 'Youth Room', true, NOW());
