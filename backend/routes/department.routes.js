const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const auth = require('../middleware/auth');

// All department routes require authentication
router.use(auth);

// Get user's departments
router.get('/user', departmentController.getUserDepartments);

// Get department dashboard
router.get('/:departmentId/dashboard', departmentController.getDepartmentDashboard);

// Department communications
router.get('/:departmentId/communications', departmentController.getCommunications);
router.post('/:departmentId/communications', departmentController.createCommunication);

// Department meetings
router.post('/:departmentId/meetings', departmentController.createMeeting);

// Department members
router.get('/:departmentId/members', departmentController.getDepartmentMembers);

module.exports = router;
