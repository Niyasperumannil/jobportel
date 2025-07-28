const Job = require('../models/Job');
const Application = require('../models/Application');

// List jobs (with pagination)
exports.listJobs = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const jobs = await Job.find()
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('employer', 'username company');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list jobs', error: err.message });
  }
};

// Get job by ID with applications nested
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'username company')
      .populate({
        path: 'applications',
        populate: { path: 'applicant', select: 'username email role company' }
      });

    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get job', error: err.message });
  }
};

// Get jobs posted by logged-in employer only
exports.getJobsByEmployer = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id }).populate('employer', 'username company');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get employer jobs', error: err.message });
  }
};

// Create a new job, employer is from auth middleware (req.user.id)
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({
      ...req.body,
      employer: req.user.id,
    });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job', error: err.message });
  }
};

// Update job (only owner)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own jobs' });
    }

    Object.assign(job, req.body);
    await job.save();

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job', error: err.message });
  }
};

// Delete job (only owner)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own jobs' });
    }

    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job', error: err.message });
  }
};
