const Application = require('../models/Application');
const Job = require('../models/Job');

// ✅ Apply to a Job (Job Seeker Only)
exports.applyToJob = async (req, res) => {
  try {
    const { coverLetter, resumeLink } = req.body;
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const application = new Application({
      job: job._id,
      applicant: req.user.id,
      coverLetter,
      resumeLink,
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    console.error('ApplyToJob Error:', err);
    res.status(500).json({ message: 'Server error while applying' });
  }
};

// ✅ Employer: Get All Applications for a Specific Job
exports.listApplications = async (req, res) => {
  try {
    const apps = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'username email role company');
    res.json(apps);
  } catch (err) {
    console.error('ListApplications Error:', err);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

// ✅ Employer: Update Application Status (Pending, Accepted, Rejected)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Application.findById(req.params.applicationId);

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    app.status = status;
    await app.save();
    res.json({ message: 'Application status updated', application: app });
  } catch (err) {
    console.error('UpdateApplicationStatus Error:', err);
    res.status(500).json({ message: 'Error updating status' });
  }
};

// ✅ Job Seeker: Get All Their Applications
exports.listMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user.id })
      .populate('job', 'title company location salary');
    res.json(apps);
  } catch (err) {
    console.error('ListMyApplications Error:', err);
    res.status(500).json({ message: 'Error fetching your applications' });
  }
};

// ✅ Job Seeker: List All Saved Jobs
exports.listSavedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ savedBy: req.user.id })
      .populate('employer', 'username company');
    res.json(jobs);
  } catch (err) {
    console.error('ListSavedJobs Error:', err);
    res.status(500).json({ message: 'Error fetching saved jobs' });
  }
};

// ✅ Job Seeker: Save or Bookmark a Job
exports.saveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.savedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    job.savedBy.push(req.user.id);
    await job.save();
    res.json({ message: 'Job bookmarked successfully', jobId: job._id });
  } catch (err) {
    console.error('SaveJob Error:', err);
    res.status(500).json({ message: 'Error saving job' });
  }
};
// ✅ Job Seeker: Unsave or Remove a Bookmarked Job
exports.unsaveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check if the job is actually saved
    const index = job.savedBy.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({ message: 'Job not bookmarked' });
    }

    // Remove user ID from savedBy array
    job.savedBy.splice(index, 1);
    await job.save();

    res.json({ message: 'Job removed from saved list', jobId: job._id });
  } catch (err) {
    console.error('UnsaveJob Error:', err);
    res.status(500).json({ message: 'Error unsaving job' });
  }
};
