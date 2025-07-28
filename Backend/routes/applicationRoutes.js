// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authenticate = require('../middleware/auth');

// ✅ Job Seeker: Apply to a job
router.post('/apply/:jobId', authenticate, applicationController.applyToJob);

// ✅ Employer: List applications for a specific job
router.get(
  '/job/:jobId/applications',
  authenticate,
  applicationController.listApplications
);

// ✅ Employer: Update status of an application
router.put(
  '/application/:applicationId/status',
  authenticate,
  applicationController.updateApplicationStatus
);

// ✅ Job Seeker: List all applications made by the user
router.get('/my-applications', authenticate, applicationController.listMyApplications);

// ✅ Job Seeker: List saved/bookmarked jobs
router.get('/saved-jobs', authenticate, applicationController.listSavedJobs);

// ✅ Job Seeker: Save/bookmark a job
router.post('/save/:jobId', authenticate, applicationController.saveJob);
router.delete('/unsave/:jobId', authenticate, applicationController.unsaveJob);

module.exports = router;
