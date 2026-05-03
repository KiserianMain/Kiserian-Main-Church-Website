const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/announcements.controller');
const { authenticateToken, requireRole, requireDepartmentAccess } = require('../middleware/auth');

// Get public announcements (no authentication required)
router.get('/public', AnnouncementController.getPublic);

// Get all announcements (public and user's department announcements)
router.get('/', authenticateToken, AnnouncementController.getAll);

// Get single announcement
router.get('/:id', authenticateToken, AnnouncementController.getById);

// Create announcement (authenticated users)
router.post('/', 
  authenticateToken, 
  [
    require('express-validator').body('title').trim().notEmpty().withMessage('Title is required'),
    require('express-validator').body('content').trim().notEmpty().withMessage('Content is required'),
    require('express-validator').body('announcement_type').optional().isIn(['general', 'department', 'emergency']),
    require('express-validator').body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    require('express-validator').body('is_public').optional().isBoolean(),
    require('express-validator').body('department_id').optional().isUUID()
  ], 
  AnnouncementController.create
);

// Update announcement (author or admin)
router.put('/:id', 
  authenticateToken, 
  [
    require('express-validator').body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    require('express-validator').body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
    require('express-validator').body('announcement_type').optional().isIn(['general', 'department', 'emergency']),
    require('express-validator').body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    require('express-validator').body('is_public').optional().isBoolean(),
    require('express-validator').body('department_id').optional().isUUID()
  ], 
  AnnouncementController.update
);

// Delete announcement (author or admin)
router.delete('/:id', authenticateToken, AnnouncementController.delete);

module.exports = router;
