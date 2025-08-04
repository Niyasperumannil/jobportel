// File: src/pages/Employer.jsx

import React, {
  useState,
  useEffect,
  useCallback
} from "react";
import axios from "axios";
import {
  Card,
  Button,
  Form,
  Modal,
  Dropdown,
  Spinner,
  Alert
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Employer = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentJob, setCurrentJob] = useState({
    _id: null,
    title: "",
    company: "",
    location: "",
    salary: "",
    description: "",
    requirements: ""
  });

  const [viewedJob, setViewedJob] = useState(null);
  const [showViewJobModal, setShowViewJobModal] = useState(false);

  const [applicationsForJob, setApplicationsForJob] = useState([]);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [employerName, setEmployerName] = useState("");
  const [employerInfoLoading, setEmployerInfoLoading] = useState(true);
  const [employerInfoError, setEmployerInfoError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /**
   * Returns the current base of the API:
   * - Uses REACT_APP_API_BASE_URL if defined.
   * - Otherwise, if host is localhost, uses local dev backend.
   * - Else, uses your Render URL.
   *
   * Note: Create React App only replaces process.env.REACT_APP_… at build time.
   */
  const getApiBase = () => {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1"
      ? "http://localhost:7000"
      : "https://jobportel-4.onrender.com";
  };

  const base = getApiBase();

  // --- API Handlers ---

  const fetchEmployerInfo = useCallback(async () => {
    setEmployerInfoLoading(true);
    setEmployerInfoError(null);
    if (!token) {
      setEmployerInfoError("Authentication required — please log in.");
      setEmployerInfoLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${base}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployerName(res.data.username);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setEmployerInfoError(`Error fetching profile info: ${msg}`);
    } finally {
      setEmployerInfoLoading(false);
    }
  }, [base, token]);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    if (!token) {
      setJobsError("Not authenticated — please log in.");
      setJobs([]);
      setLoadingJobs(false);
      return;
    }
    try {
      const res = await axios.get(`${base}/api/jobs/myjobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data);
      setFilteredJobs(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setJobsError(`Error loading jobs: ${msg}`);
    } finally {
      setLoadingJobs(false);
    }
  }, [base, token]);

  const fetchApplicationsForJob = useCallback(
    async (jobId) => {
      setApplicationsLoading(true);
      setApplicationsError(null);
      setApplicationsForJob([]);
      if (!token) {
        setApplicationsError("Authentication required to view applications.");
        setApplicationsLoading(false);
        return;
      }
      try {
        const res = await axios.get(
          `${base}/api/applicationRoutes/job/${jobId}/applications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setApplicationsForJob(res.data);
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setApplicationsError(`Error fetching applications: ${msg}`);
      } finally {
        setApplicationsLoading(false);
      }
    },
    [base, token]
  );

  // Handlers for creating, editing, deleting jobs & applications

  const resetJobForm = useCallback(() => {
    setCurrentJob({
      _id: null,
      title: "",
      company: "",
      location: "",
      salary: "",
      description: "",
      requirements: "",
    });
  }, []);

  const handleOpenCreateJobModal = () => {
    setEditMode(false);
    resetJobForm();
    setShowJobModal(true);
  };

  const handleOpenEditJobModal = (job) => {
    setEditMode(true);
    setCurrentJob({
      ...job,
      requirements: (job.requirements || []).join(", "),
    });
    setShowJobModal(true);
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    resetJobForm();
  };

  const handleCreateOrUpdateJob = async (e) => {
    e.preventDefault();
    const payload = {
      title: currentJob.title,
      company: currentJob.company,
      location: currentJob.location,
      salary: currentJob.salary,
      description: currentJob.description,
      requirements: currentJob.requirements
        .split(",")
        .map((req) => req.trim())
        .filter(Boolean),
    };
    try {
      if (editMode && currentJob._id) {
        await axios.put(
          `${base}/api/jobs/${currentJob._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Job updated successfully!");
      } else {
        await axios.post(
          `${base}/api/jobs`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Job posted successfully!");
      }
      handleCloseJobModal();
      fetchJobs();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert(`Failed to save job: ${msg}`);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job? This action cannot be undone.")) {
      return;
    }
    try {
      await axios.delete(`${base}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Job deleted.");
      fetchJobs();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert(`Delete failed: ${msg}`);
    }
  };

  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    if (!window.confirm(`Mark application as "${newStatus}"?`)) return;
    try {
      await axios.put(
        `${base}/api/applicationRoutes/application/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Application marked as ${newStatus}`);
      fetchApplicationsForJob(selectedJobForApplications._id);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      const code = err.response?.status ? ` (Status: ${err.response.status})` : "";
      alert(`Update status failed: ${msg}${code}`);
    }
  };

  const handleOpenApplicationsModal = async (job) => {
    setSelectedJobForApplications(job);
    await fetchApplicationsForJob(job._id);
    setShowApplicationsModal(true);
  };

  const handleCloseApplicationsModal = () => {
    setShowApplicationsModal(false);
    setSelectedJobForApplications(null);
    setApplicationsForJob([]);
  };

  const handleOpenViewJobModal = (job) => {
    setViewedJob(job);
    setShowViewJobModal(true);
  };

  const handleCloseViewJobModal = () => {
    setShowViewJobModal(false);
    setViewedJob(null);
  };

  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredJobs(
      jobs.filter((j) =>
        j.title.toLowerCase().includes(term) ||
        j.company.toLowerCase().includes(term) ||
        j.location.toLowerCase().includes(term) ||
        j.description.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, jobs]);

  // Fetch initial data
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
            {employerInfoLoading ? (
              <Spinner animation="border" size="sm" />
            ) : employerInfoError ? (
              <span className="text-danger">{employerInfoError}</span>
            ) : (
              <strong>{employerName || "Unknown"}</strong>
            )}
          </small>
        </div>
        <Button variant="primary" onClick={handleOpenCreateJobModal}>
          + Post New Job
        </Button>
      </div>

      <Form.Group className="mb-4">
        <Form.Control
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>

      {loadingJobs ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" />
          <p>Loading jobs...</p>
        </div>
      ) : jobsError ? (
        <Alert variant="danger" className="text-center">
          {jobsError}
        </Alert>
      ) : filteredJobs.length === 0 ? (
        <Alert variant="info" className="text-center">
          {searchTerm
            ? "No jobs match your search."
            : "No jobs posted yet. Click + Post New Job to begin."}
        </Alert>
      ) : (
        <div className="row">
          {filteredJobs.map((job) => (
            <div className="col-md-6 col-lg-4 mb-4" key={job._id}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{job.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {job.company}
                  </Card.Subtitle>
                  <Card.Text className="mb-3">
                    <strong>Location:</strong> {job.location}
                    <br />
                    <strong>Salary:</strong> ₹{job.salary}
                    <br />
                    <small className="text-muted">
                      Posted: {new Date(job.createdAt).toLocaleDateString()}
                    </small>
                  </Card.Text>

                  <div className="mt-auto d-flex flex-column gap-2">
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleOpenViewJobModal(job)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleOpenApplicationsModal(job)}
                    >
                      View Applications
                    </Button>
                    <div className="d-flex justify-content-between gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => handleOpenEditJobModal(job)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => handleDeleteJob(job._id)}
                      >
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

      {/* Modal for Create / Edit Job */}
      <Modal show={showJobModal} onHide={handleCloseJobModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Job" : "Post New Job"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateOrUpdateJob}>
            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={currentJob.title}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, title: e.target.value })
                }
                required
              />
            </Form.Group>
            {/* Company */}
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                value={currentJob.company}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, company: e.target.value })
                }
                required
              />
            </Form.Group>
            {/* Location */}
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                value={currentJob.location}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, location: e.target.value })
                }
              />
            </Form.Group>
            {/* Salary */}
            <Form.Group className="mb-3">
              <Form.Label>Salary</Form.Label>
              <Form.Control
                type="number"
                value={currentJob.salary}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, salary: e.target.value })
                }
              />
            </Form.Group>
            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentJob.description}
                onChange={(e) =>
                  setCurrentJob({ ...currentJob, description: e.target.value })
                }
              />
            </Form.Group>
            {/* Requirements */}
            <Form.Group className="mb-3">
              <Form.Label>Requirements</Form.Label>
              <Form.Control
                value={currentJob.requirements}
                onChange={(e) =>
                  setCurrentJob({
                    ...currentJob,
                    requirements: e.target.value
                  })
                }
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {editMode ? "Update Job" : "Post Job"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Job Details Modal */}
      <Modal show={showViewJobModal} onHide={handleCloseViewJobModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Job Details: {viewedJob?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewedJob ? (
            <>
              <p>
                <strong>Company:</strong> {viewedJob.company}
              </p>
              <p>
                <strong>Location:</strong> {viewedJob.location}
              </p>
              <p>
                <strong>Salary:</strong> ₹{viewedJob.salary}
              </p>
              <p>
                <strong>Description:</strong> {viewedJob.description}
              </p>
              <p>
                <strong>Requirements:</strong>{" "}
                {(viewedJob.requirements || []).join(", ")}
              </p>
              <p>
                <strong>Posted by:</strong>{" "}
                {viewedJob.employer?.username || "N/A"}
              </p>
              <p className="text-muted">
                Posted on:{" "}
                {new Date(viewedJob.createdAt).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p>No job selected.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewJobModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Applications Modal */}
      <Modal
        show={showApplicationsModal}
        onHide={handleCloseApplicationsModal}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Applications for "{selectedJobForApplications?.title}"
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {applicationsLoading ? (
            <div className="text-center my-3">
              <Spinner animation="border" size="sm" />
              <p className="text-info">Loading applications...</p>
            </div>
          ) : applicationsError ? (
            <Alert variant="danger" className="text-center">
              {applicationsError}
            </Alert>
          ) : applicationsForJob.length === 0 ? (
            <Alert variant="info" className="text-center">
              No applicants yet for this job
            </Alert>
          ) : (
            <div className="row">
              {applicationsForJob.map((app) => (
                <div
                  className="col-md-6 col-lg-4 mb-4"
                  key={app._id}
                >
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>
                        Applicant: {app.applicant?.username || "N/A"}
                      </Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {app.applicant?.email || "Email not available"}
                      </Card.Subtitle>
                      <Card.Text>
                        <strong>Cover Letter:</strong> {app.coverLetter}
                        <br />
                        <strong>Resume:</strong>{" "}
                        <a
                          href={app.resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resume
                        </a>
                        <br />
                        <strong>Status:</strong>{" "}
                        <span
                          className={`fw-bold text-${
                            app.status === "Accepted"
                              ? "success"
                              : app.status === "Rejected"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          {app.status}
                        </span>
                        <br />
                        <small className="text-muted">
                          Applied on: {new Date(app.createdAt).toLocaleDateString()}
                        </small>
                      </Card.Text>
                      <div className="mt-auto">
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-primary"
                            id={`dropdown-status-${app._id}`}
                            size="sm"
                            className="w-100"
                          >
                            Update Status
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() =>
                                handleUpdateApplicationStatus(app._id, "pending")
                              }
                            >
                              Pending
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleUpdateApplicationStatus(app._id, "accepted")
                              }
                            >
                              Accepted
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                handleUpdateApplicationStatus(app._id, "rejected")
                              }
                            >
                              Rejected
                            </Dropdown.Item>
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
          <Button variant="secondary" onClick={handleCloseApplicationsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Employer;
