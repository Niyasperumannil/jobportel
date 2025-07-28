const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const jobCtrl = require('../controllers/jobController');

// Public routes
router.get('/', jobCtrl.listJobs);

// Employer only routes
router.get('/myjobs', auth, authorize(['employer']), jobCtrl.getJobsByEmployer);
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      company: req.user.company,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});
// This must be **after** /myjobs so :id does not catch 'myjobs'
router.get('/:id', jobCtrl.getJobById);

router.post('/', auth, authorize(['employer']), jobCtrl.createJob);
router.put('/:id', auth, authorize(['employer']), jobCtrl.updateJob);
router.delete('/:id', auth, authorize(['employer']), jobCtrl.deleteJob);

module.exports = router;
