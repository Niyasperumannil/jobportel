import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Card, Button, Form, Modal, Dropdown, Spinner, Alert } from 'react-bootstrap';

const Employer = () => {
  // State for Job Management
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false); // For Create/Edit Job Modal
  const [editMode, setEditMode] = useState(false);
  const [currentJob, setCurrentJob] = useState({
    _id: null,
    title: '',
    company: '',
    location: '',
    salary: '',
    description: '',
    requirements: '', // Stored as comma-separated string for form
  });

  // State for Viewing Job Details
  const [viewedJob, setViewedJob] = useState(null);
  const [showViewJobModal, setShowViewJobModal] = useState(false);

  // State for Applications Management
  const [applicationsForJob, setApplicationsForJob] = useState([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);

  // State for Employer Info
  const [employerName, setEmployerName] = useState('');
  const [employerInfoLoading, setEmployerInfoLoading] = useState(true);
  const [employerInfoError, setEmployerInfoError] = useState(null);

  // State for Job Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  const token = localStorage.getItem('token'); // Get token from localStorage

  // --- Utility Functions ---

  const resetJobForm = useCallback(() => {
    setCurrentJob({
      _id: null,
      title: '',
      company: '',
      location: '',
      salary: '',
      description: '',
      requirements: '',
    });
  }, []);

  // --- API Calls ---

  const fetchEmployerInfo = useCallback(async () => {
    if (!token) {
      setEmployerInfoError('No authentication token found. Please log in.');
      setEmployerInfoLoading(false);
      return;
    }
    setEmployerInfoLoading(true);
    setEmployerInfoError(null);
    try {
      // Corrected: Uses /api/auth/me based on your authRoutes.js
      const res = await axios.get('http://localhost:7000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployerName(res.data.username);
    } catch (err) {
      console.error('Failed to fetch employer info:', err);
      if (err.response && err.response.status === 401) {
        setEmployerInfoError('Session expired or not authorized. Please log in again.');
        // Potentially redirect to login: window.location.href = '/login';
      } else {
        setEmployerInfoError(`Error fetching employer info: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setEmployerInfoLoading(false);
    }
  }, [token]);

  const fetchJobs = useCallback(async () => {
    if (!token) {
      setJobsError('Authentication required to view jobs.');
      setLoadingJobs(false);
      setJobs([]);
      return;
    }
    setLoadingJobs(true);
    setJobsError(null);
    try {
      const res = await axios.get('http://localhost:7000/api/jobs/myjobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
      setFilteredJobs(res.data); // Initialize filtered jobs with all jobs
    } catch (err) {
      console.error('Failed to fetch employer jobs:', err);
      if (err.response && err.response.status === 401) {
        setJobsError('Session expired or not authorized to view your jobs. Please log in.');
      } else {
        setJobsError(`Error fetching jobs: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoadingJobs(false);
    }
  }, [token]);

  const fetchApplicationsForJob = useCallback(async (jobId) => {
    setApplicationsLoading(true);
    setApplicationsError(null);
    setApplicationsForJob([]); // Clear previous applications
    if (!token) {
      setApplicationsError('Authentication required to view applications.');
      setApplicationsLoading(false);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:7000/api/applicationRoutes/job/${jobId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicationsForJob(res.data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setApplicationsError(err.response?.data?.message || 'Error fetching applications.');
    } finally {
      setApplicationsLoading(false);
    }
  }, [token]);

  // --- Job Modal Handlers ---

  const handleOpenCreateJobModal = () => {
    setEditMode(false);
    resetJobForm();
    setShowJobModal(true);
  };

  const handleOpenEditJobModal = (job) => {
    setEditMode(true);
    // Convert requirements array back to comma-separated string for the form
    setCurrentJob({
      ...job,
      requirements: job.requirements?.join(', ') || '',
    });
    setShowJobModal(true);
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    resetJobForm(); // Always reset form on close
  };

  const handleCreateOrUpdateJob = async (e) => {
    e.preventDefault();
    // Prepare payload, converting requirements string to array
    const payload = {
      ...currentJob,
      requirements: currentJob.requirements
        .split(',')
        .map((req) => req.trim())
        .filter(Boolean), // Remove empty strings
    };

    try {
      if (editMode && currentJob._id) {
        await axios.put(`http://localhost:7000/api/jobs/${currentJob._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Job updated successfully!');
      } else {
        await axios.post('http://localhost:7000/api/jobs', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Job posted successfully!');
      }
      handleCloseJobModal();
      fetchJobs(); // Refresh job list after create/update
    } catch (err) {
      console.error('Failed to submit job:', err);
      alert(`Failed to submit job: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    try {
      await axios.delete(`http://localhost:7000/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Job deleted successfully!');
      fetchJobs(); // Refresh job list after deletion
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert(`Failed to delete job: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- View Job Details Modal Handlers ---

  const handleOpenViewJobModal = (job) => {
    setViewedJob(job);
    setShowViewJobModal(true);
  };

  const handleCloseViewJobModal = () => {
    setShowViewJobModal(false);
    setViewedJob(null);
  };

  // --- Application Modal Handlers ---

  const handleOpenApplicationsModal = async (job) => {
    setSelectedJobForApplications(job);
    await fetchApplicationsForJob(job._id);
    setShowApplicationsModal(true);
  };

  const handleCloseApplicationsModal = () => {
    setShowApplicationsModal(false);
    setSelectedJobForApplications(null);
    setApplicationsForJob([]); // Clear applications on close
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to "${newStatus}"?`)) {
      return;
    }
    try {
      await axios.put(`http://localhost:7000/api/applicationRoutes/application/${applicationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Application status updated to ${newStatus}!`);
      // Refresh applications for the current job after successful update
      if (selectedJobForApplications) {
        fetchApplicationsForJob(selectedJobForApplications._id);
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
      const errorMessage = err.response?.data?.message || err.message;
      const errorStatus = err.response?.status ? ` (Status: ${err.response.status})` : '';
      alert(`Failed to update status: ${errorMessage}${errorStatus}`);
    }
  };

  // --- Search Functionality ---
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = jobs.filter(job =>
      job.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      job.company.toLowerCase().includes(lowerCaseSearchTerm) ||
      job.location.toLowerCase().includes(lowerCaseSearchTerm) ||
      job.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredJobs(results);
  }, [searchTerm, jobs]);


  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchEmployerInfo();
    fetchJobs();
  }, [fetchEmployerInfo, fetchJobs]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Your Posted Jobs</h2>
        <div>
          <small>
            Owner: {employerInfoLoading ? <Spinner animation="border" size="sm" /> : 
                     employerInfoError ? <span className="text-danger">{employerInfoError}</span> : 
                     <strong>{employerName || 'Unknown'}</strong>}
          </small>
        </div>
        <Button variant="primary" onClick={handleOpenCreateJobModal}>+ Post New Job</Button>
      </div>

      {/* Search Bar */}
      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search your jobs by title, company, location, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      {/* Job List Display */}
      {loadingJobs ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading jobs...</span>
          </Spinner>
          <p>Loading your jobs...</p>
        </div>
      ) : jobsError ? (
        <Alert variant="danger" className="text-center">
          {jobsError}
        </Alert>
      ) : filteredJobs.length === 0 ? (
        <Alert variant="info" className="text-center">
          {searchTerm ? "No jobs found matching your search criteria." : "No jobs posted yet. Click '+ Post New Job' to get started!"}
        </Alert>
      ) : (
        <div className="row">
          {filteredJobs.map((job) => (
            <div className="col-md-6 col-lg-4 mb-4" key={job._id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{job.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">{job.company}</Card.Subtitle>
                  <Card.Text className="mb-3">
                    <strong>Location:</strong> {job.location}
                    <br />
                    <strong>Salary:</strong> ₹{job.salary}
                    <br />
                    <small className="text-muted">Posted: {new Date(job.createdAt).toLocaleDateString()}</small>
                  </Card.Text>

                  <div className="mt-auto d-flex flex-column gap-2">
                    <Button variant="info" size="sm" onClick={() => handleOpenViewJobModal(job)}>
                      View Details
                    </Button>
                    <Button variant="success" size="sm" onClick={() => handleOpenApplicationsModal(job)}>
                      View Applications {/* This will now work when backend is updated */}
                    </Button>
                    <div className="d-flex justify-content-between gap-2">
                      <Button variant="secondary" size="sm" className="flex-grow-1" onClick={() => handleOpenEditJobModal(job)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" className="flex-grow-1" onClick={() => handleDeleteJob(job._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modal to create/edit job */}
      <Modal show={showJobModal} onHide={handleCloseJobModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Job' : 'Post New Job'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateOrUpdateJob}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={currentJob.title}
                onChange={(e) => setCurrentJob({ ...currentJob, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                value={currentJob.company}
                onChange={(e) => setCurrentJob({ ...currentJob, company: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                value={currentJob.location}
                onChange={(e) => setCurrentJob({ ...currentJob, location: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Salary</Form.Label>
              <Form.Control
                type="number"
                value={currentJob.salary}
                onChange={(e) => setCurrentJob({ ...currentJob, salary: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentJob.description}
                onChange={(e) => setCurrentJob({ ...currentJob, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Requirements (comma-separated)</Form.Label>
              <Form.Control
                value={currentJob.requirements}
                onChange={(e) => setCurrentJob({ ...currentJob, requirements: e.target.value })}
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {editMode ? 'Update Job' : 'Post Job'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal to view job details */}
      <Modal show={showViewJobModal} onHide={handleCloseViewJobModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Job Details: {viewedJob?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewedJob ? (
            <>
              <p><strong>Company:</strong> {viewedJob.company}</p>
              <p><strong>Location:</strong> {viewedJob.location}</p>
              <p><strong>Salary:</strong> ₹{viewedJob.salary}</p>
              <p><strong>Description:</strong> {viewedJob.description}</p>
              <p><strong>Requirements:</strong> {viewedJob.requirements?.join(', ') || 'N/A'}</p>
              <p><strong>Posted by:</strong> {viewedJob.employer?.username || 'N/A'}</p>
              <p><small className="text-muted">Posted on: {new Date(viewedJob.createdAt).toLocaleDateString()}</small></p>
            </>
          ) : (
            <p>No job selected.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewJobModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal to view applications for a specific job */}
      <Modal show={showApplicationsModal} onHide={handleCloseApplicationsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Applications for "{selectedJobForApplications?.title}"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {applicationsLoading ? (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" />
              <p className="text-info">Loading applications...</p>
            </div>
          ) : applicationsError ? (
            <Alert variant="danger" className="text-center">{applicationsError}</Alert>
          ) : applicationsForJob.length === 0 ? (
            <Alert variant="info" className="text-center">No applications found for this job yet.</Alert>
          ) : (
            <div className="row">
              {applicationsForJob.map((app) => (
                <div className="col-md-6 col-lg-4 mb-4" key={app._id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>Applicant: {app.applicant?.username || 'N/A'}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">{app.applicant?.email || 'Email not available'}</Card.Subtitle>
                      <Card.Text>
                        <strong>Cover Letter:</strong> {app.coverLetter}
                        <br />
                        <strong>Resume:</strong> <a href={app.resumeLink} target="_blank" rel="noopener noreferrer">View Resume</a>
                        <br />
                        <strong>Status:</strong> <span className={`fw-bold text-${app.status === 'Accepted' ? 'success' : app.status === 'Rejected' ? 'danger' : 'warning'}`}>{app.status}</span>
                        <br />
                        <small className="text-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</small>
                      </Card.Text>

                      <div className="mt-auto">
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-primary" id={`dropdown-status-${app._id}`} size="sm" className="w-100">
                            Update Status
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleUpdateApplicationStatus(app._id, 'pending')}>Pending</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleUpdateApplicationStatus(app._id, 'accepted')}>Accepted</Dropdown.Item>
                            <Dropdown.Item onClick={() => handleUpdateApplicationStatus(app._id, 'rejected')}>Rejected</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseApplicationsModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Employer;