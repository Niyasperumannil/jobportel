import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ApplyForm component (remains the same as it's a sub-component)
function ApplyForm({ jobId, token, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeLink, setResumeLink] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(
        `${BASE_URL}/api/applicationRoutes/apply/${jobId}`,
        { coverLetter, resumeLink },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMessage('Application submitted successfully!');
      onSuccess(jobId);
    } catch (err) {
      setStatusMessage(
        err?.response?.status === 401
          ? 'Unauthorized: invalid token.'
          : err?.response?.data?.message || 'Submission failed.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.applyForm}>
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>Cover Letter</label>
        <textarea
          value={coverLetter}
          onChange={e => setCoverLetter(e.target.value)}
          required
          style={styles.formTextarea}
        />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.formLabel}>Resume Link</label>
        <input
          type="url"
          value={resumeLink}
          onChange={e => setResumeLink(e.target.value)}
          required
          style={styles.formInput}
        />
      </div>
      <button type="submit" style={styles.formSubmitButton}>Apply</button>
      {statusMessage && <p style={styles.formStatusMessage}>{statusMessage}</p>}
    </form>
  );
}

// Main JobListAndApply component
export default function JobListAndApply() {
  const [allJobs, setAllJobs] = useState([]); // Stores the original, unfiltered jobs
  const [displayedJobs, setDisplayedJobs] = useState([]); // Stores jobs after applying filters
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]); // Stores job IDs that have been applied to
  const [loadingJobs, setLoadingJobs] = useState(true); // State for jobs loading
  const [jobsError, setJobsError] = useState(null); // State for jobs error

  // State for Saved Jobs (merged from original SavedJobs.jsx)
  const [savedJobs, setSavedJobs] = useState([]); // Holds actual saved job objects
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);
  const [savedJobsError, setSavedJobsError] = useState('');

  // State for My Applications (merged from original Application.jsx)
  const [applications, setApplications] = useState([]);
  const [applicationsError, setApplicationsError] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [currentPageApplications, setCurrentPageApplications] = useState(1);
  const perPageApplications = 3; // Still 3 for 3 cards per row

  // --- New states for Search and Filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinSalary, setFilterMinSalary] = useState('');
  const [filterDatePosted, setFilterDatePosted] = useState(''); // e.g., '24h', '7d', '30d'

  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

  // --- Functions related to Applications ---
  const fetchMyApplications = useCallback(async () => {
    if (!token) {
      setApplicationsError('You are not authenticated to view applications.');
      setApplicationsLoading(false);
      return [];
    }
    setApplicationsLoading(true);
    setApplicationsError(null);
    try {
      const res = await axios.get(
        `${BASE_URL}/api/applicationRoutes/my-applications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data.applications ?? res.data;
      setApplications(data);
      const appliedIds = data.map(a => (typeof a.job === 'object' ? a.job._id : a.job));
      setAppliedJobs(appliedIds);
      return appliedIds;
    } catch (err) {
      setApplicationsError(err.response?.data?.message || 'Failed to fetch applications.');
      console.error('Fetch applications error:', err);
      return [];
    } finally {
      setApplicationsLoading(false);
    }
  }, [token]);

  const handleApplied = async (jobId) => {
    // When a job is applied, remove it from the 'allJobs' and 'displayedJobs' lists
    setAllJobs(prev => prev.filter(job => job._id !== jobId));
    setDisplayedJobs(prev => prev.filter(job => job._id !== jobId));
    setAppliedJobs(prev => [...prev, jobId]);
    setSelectedJobId(null);
    await fetchMyApplications();
  };

  // --- Functions related to Saved Jobs ---
  const fetchSavedJobs = useCallback(async () => {
    if (!token) {
      setSavedJobsError('You must be logged in to view saved jobs.');
      setSavedJobsLoading(false);
      return [];
    }
    setSavedJobsLoading(true);
    setSavedJobsError('');
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/applicationRoutes/saved-jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedJobs(data);
      return data;
    } catch (err) {
      console.error('Fetch saved jobs error:', err);
      setSavedJobsError('Failed to load saved jobs.');
      return [];
    } finally {
      setSavedJobsLoading(false);
    }
  }, [token]);

  const handleSaveJob = async (jobId) => {
    try {
      const jobToSave = allJobs.find(job => job._id === jobId) || displayedJobs.find(job => job._id === jobId);
      if (jobToSave) {
        setSavedJobs(prev => [...prev, jobToSave]);
      }

      await axios.post(
        `${BASE_URL}/api/applicationRoutes/save/${jobId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchSavedJobs();
    } catch (err) {
      console.error('Error saving job:', err);
      alert(err.response?.data?.message || 'Failed to save job.');
      await fetchSavedJobs(); // Re-fetch to ensure consistency if optimistic update failed
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));

      await axios.delete(
        `${BASE_URL}/api/applicationRoutes/unsave/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Error unsaving job:', err);
      alert(err.response?.data?.message || 'Failed to unsave job.');
      await fetchSavedJobs(); // Re-fetch to ensure consistency if optimistic update failed
    }
  };

  // --- Function to fetch ALL jobs and then apply filters ---
  const fetchAllAndFilterJobs = useCallback(async () => {
    setLoadingJobs(true);
    setJobsError(null);
    try {
      // First, fetch all jobs
      const res = await axios.get(`${BASE_URL}/api/jobs`);
      const fetchedJobs = res.data;
      setAllJobs(fetchedJobs); // Store the complete list

      // Then, fetch applied and saved jobs
      const [appliedIds, initialSavedJobsData] = await Promise.all([
        fetchMyApplications(),
        fetchSavedJobs()
      ]);

      // Apply filtering based on search terms and other criteria
      let filteredAndSearchJobs = fetchedJobs.filter(job => {
        const matchesSearchTerm = searchTerm ?
          (job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           job.description?.toLowerCase().includes(searchTerm.toLowerCase())) : true;

        const matchesLocation = filterLocation ?
          job.location?.toLowerCase().includes(filterLocation.toLowerCase()) : true;

        const matchesMinSalary = filterMinSalary ?
          job.salary >= parseFloat(filterMinSalary) : true;

        const matchesDatePosted = filterDatePosted ?
          isJobPostedWithin(job.createdAt, filterDatePosted) : true;
        
        // Also filter out jobs that have already been applied to
        const notApplied = !appliedIds.includes(job._id);

        return matchesSearchTerm && matchesLocation && matchesMinSalary && matchesDatePosted && notApplied;
      });

      setDisplayedJobs(filteredAndSearchJobs); // Set the jobs to display

    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobsError(err.response?.data?.message || 'Failed to fetch jobs.');
    } finally {
      setLoadingJobs(false);
    }
  }, [token, searchTerm, filterLocation, filterMinSalary, filterDatePosted, fetchMyApplications, fetchSavedJobs]);

  // Helper function to check if job was posted within a certain time frame
  const isJobPostedWithin = (createdAt, timeFrame) => {
    const jobDate = new Date(createdAt);
    const now = new Date();
    let cutoffDate = new Date();

    switch (timeFrame) {
      case '24h':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      default:
        return true;
    }
    return jobDate >= cutoffDate;
  };


  // --- Initial Data Load for all sections ---
  useEffect(() => {
    fetchAllAndFilterJobs();
  }, [fetchAllAndFilterJobs]); // Depend on fetchAllAndFilterJobs, which now includes filter/search terms

  const currentSavedJobIds = new Set(savedJobs.map(job => job._id));

  // --- Pagination Logic for Applications ---
  const totalPagesApplications = Math.ceil(applications.length / perPageApplications);
  const startApplications = (currentPageApplications - 1) * perPageApplications;
  const currentAppsToDisplay = applications.slice(startApplications, startApplications + perPageApplications);

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContent}>
        <h2 style={styles.sectionHeading}>Available Jobs</h2>

        {/* --- Search and Filter Section --- */}
        <div style={styles.filterContainer}>
          <input
            type="text"
            placeholder="Search by title, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.filterInput}
          />
          <input
            type="text"
            placeholder="Location (e.g., Bengaluru)"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={styles.filterInput}
          />
          <input
            type="number"
            placeholder="Minimum Salary"
            value={filterMinSalary}
            onChange={(e) => setFilterMinSalary(e.target.value)}
            style={styles.filterInput}
          />
          <select
            value={filterDatePosted}
            onChange={(e) => setFilterDatePosted(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Date Posted (Any)</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <button onClick={fetchAllAndFilterJobs} style={styles.filterButton}>Apply Filters</button>
        </div>
        {/* --- End Search and Filter Section --- */}

        {loadingJobs ? (
          <p style={styles.loadingMessage}>Loading available jobs...</p>
        ) : jobsError ? (
          <p style={styles.errorMessage}>{jobsError}</p>
        ) : displayedJobs.length > 0 ? (
          <div style={styles.jobGrid}>
            {displayedJobs.map(job => {
              const isApplied = appliedJobs.includes(job._id);
              const isSaved = currentSavedJobIds.has(job._id);
              return (
                <div key={job._id} style={styles.jobCard}>
                  <h3 style={styles.jobTitle}>{job.title}</h3>
                  <p style={styles.jobDetail}><strong>Company:</strong> {job.company}</p>
                  <p style={styles.jobDetail}><strong>Posted by:</strong> {job.employer?.username || 'Unknown'}</p>
                  <p style={styles.jobDetail}><strong>Posted at:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
                  <p style={styles.jobDetail}><strong>Location:</strong> {job.location}</p>
                  <p style={styles.jobDetail}><strong>Salary:</strong> ₹{job.salary}</p>
                  <p style={styles.jobDescription}><strong>Description:</strong> {job.description}</p>
                  <p style={styles.jobRequirementsHeading}><strong>Requirements:</strong></p>
                  <ul style={styles.jobRequirementsList}>
                    {job.requirements.map((req, idx) => <li key={idx} style={styles.jobRequirementItem}>{req}</li>)}
                  </ul>
                  <div style={styles.cardButtonContainer}>
                    <button
                      disabled={isApplied}
                      onClick={() => !isApplied && setSelectedJobId(job._id)}
                      style={isApplied ? styles.buttonDisabled : styles.buttonPrimary}
                    >
                      {isApplied ? 'Applied' : 'Apply now'}
                    </button>
                    <button
                      onClick={() => (isSaved ? handleUnsaveJob(job._id) : handleSaveJob(job._id))}
                      style={isSaved ? styles.buttonSecondaryDanger : styles.buttonSecondary}
                    >
                      {isSaved ? 'Unsave' : 'Save job'}
                    </button>
                  </div>

                  {selectedJobId === job._id && !isApplied && (
                    <div style={styles.applyFormSection}>
                      <ApplyForm jobId={job._id} token={token} onSuccess={handleApplied} />
                      <button onClick={() => setSelectedJobId(null)} style={{ ...styles.buttonSecondary, marginTop: '10px' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={styles.noResultsMessage}>No available jobs matching your criteria.</p>
        )}
      </div>

      {/* --- My Saved Jobs Section --- */}
      <div style={styles.mainContent}>
        <h2 style={styles.sectionHeading}>My Saved Jobs</h2>
        {savedJobsLoading ? (
          <p style={styles.loadingMessage}>Loading saved jobs...</p>
        ) : savedJobsError ? (
          <p style={styles.errorMessage}>{savedJobsError}</p>
        ) : savedJobs.length > 0 ? (
          <div style={styles.jobGrid}>
            {savedJobs.map(job => (
              <div key={job._id} style={styles.jobCard}>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <p style={styles.jobDetail}><strong>Company:</strong> {job.company}</p>
                <p style={styles.jobDetail}><strong>Location:</strong> {job.location}</p>
                <p style={styles.jobDetail}><strong>Posted by:</strong> {job.employer?.username || 'N/A'}</p>
                <div style={styles.cardButtonContainer}>
                  <button
                    onClick={() => handleUnsaveJob(job._id)}
                    style={styles.buttonSecondaryDanger}
                  >
                    Unsave
                  </button>
              </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noResultsMessage}>You have no jobs saved yet. 📌</p>
        )}
      </div>

      {/* --- My Applications Section --- */}
      <div style={styles.mainContent}>
        <h2 style={styles.sectionHeading}>My Applications</h2>
        {applicationsLoading ? (
          <p style={styles.loadingMessage}>Loading applications...</p>
        ) : applicationsError ? (
          <p style={styles.errorMessage}>{applicationsError}</p>
        ) : currentAppsToDisplay.length > 0 ? (
          <div style={styles.applicationGrid}>
            {currentAppsToDisplay.map((app) => (
              <div key={app._id} style={styles.applicationCard}>
                <h3 style={styles.applicationCardTitle}>{app.job?.title} @ {app.job?.company}</h3>
                <p style={styles.applicationCardDetail}><strong>Status:</strong> <span style={styles.applicationStatus}>{app.status || 'Pending'}</span></p>
                <p style={styles.applicationCardDetail}><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.noResultsMessage}>No applications found.</p>
        )}

        {applications.length > perPageApplications && (
          <div style={styles.paginationContainer}>
            <button
              onClick={() => setCurrentPageApplications(p => Math.max(p - 1, 1))}
              disabled={currentPageApplications === 1}
              style={styles.paginationButton}
            >
              Prev
            </button>
            <span style={styles.paginationText}>Page {currentPageApplications} of {totalPagesApplications}</span>
            <button
              onClick={() => setCurrentPageApplications(p => Math.min(p + 1, totalPagesApplications))}
              disabled={currentPageApplications === totalPagesApplications}
              style={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Indeed-like Combined Styles ---
const styles = {
  // Overall Page Wrapper - mimics Indeed's background and max-width
  pageWrapper: {
    backgroundColor: '#e7e7e7', // Light gray background like Indeed
    minHeight: '100vh',
    padding: '20px 0', // Vertical padding
    fontFamily: 'Arial, sans-serif',
    color: '#2d2d2d', // Dark gray text for good readability
  },
  mainContent: {
    maxWidth: '1000px', // Slightly wider than previous max-width
    margin: '30px auto', // Centered with vertical margin
    padding: '0 20px', // Horizontal padding to prevent content from touching edges
  },

  // Headings
  sectionHeading: {
    textAlign: 'center',
    fontSize: '28px', // Slightly smaller for better hierarchy
    fontWeight: 'bold',
    marginBottom: '25px',
    color: '#2d2d2d',
    paddingBottom: '10px',
    borderBottom: '1px solid #ccc', // Subtle separator
  },

  // Filter and Search Bar Styles
  filterContainer: {
    display: 'flex',
    flexWrap: 'wrap', // Allow items to wrap on smaller screens
    gap: '15px',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterInput: {
    flex: '1', // Allows inputs to grow and shrink
    minWidth: '180px', // Minimum width for inputs
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#2557a7',
    },
  },
  filterSelect: {
    flex: '1',
    minWidth: '180px',
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '15px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: '#2557a7',
    },
  },
  filterButton: {
    backgroundColor: '#2557a7',
    color: 'white',
    border: '1px solid #2557a7',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
    transition: 'background-color 0.2s, border-color 0.2s',
    ':hover': {
      backgroundColor: '#1b4a8e',
      borderColor: '#1b4a8e',
    },
  },

  // Job Grid (Available Jobs, Saved Jobs)
  jobGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Allows 2-3 columns depending on screen size
    gap: '20px',
  },
  jobCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)', // Softer shadow for cards
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #e0e0e0', // Subtle border
  },
  jobTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#2557a7', // Indeed's signature blue
  },
  jobDetail: {
    fontSize: '14px',
    lineHeight: '1.4',
    marginBottom: '5px',
  },
  jobDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    marginBottom: '10px',
    color: '#555',
  },
  jobRequirementsHeading: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  jobRequirementsList: {
    listStyleType: 'disc',
    marginLeft: '20px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#555',
  },
  jobRequirementItem: {
    marginBottom: '3px',
  },

  // Card Buttons
  cardButtonContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto', // Pushes buttons to the bottom of the card
    paddingTop: '15px',
    borderTop: '1px solid #eee', // Separator above buttons
  },
  buttonBase: { // Although not directly used for styling, useful for conceptual grouping
    padding: '10px 15px',
    borderRadius: '6px', // Slightly more rounded
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    flex: 1, // Distribute width
    textAlign: 'center',
    fontSize: '15px',
  },
  buttonPrimary: {
    backgroundColor: '#2557a7', // Indeed blue
    color: 'white',
    border: '1px solid #2557a7',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    color: '#2557a7',
    border: '1px solid #2557a7',
  },
  buttonSecondaryDanger: { // For unsave
    backgroundColor: 'white',
    color: '#d63333', // Red for danger/unsave
    border: '1px solid #d63333',
  },
  buttonDisabled: {
    backgroundColor: '#e7e7e7', // Light gray
    color: '#888',
    border: '1px solid #ccc',
    cursor: 'not-allowed',
  },

  // Apply Form Specific Styles
  applyFormSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9', // Slightly different background for the form area
    padding: '20px',
    borderRadius: '8px',
  },
  applyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  formLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  formInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box', // Include padding in width
  },
  formTextarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  formSubmitButton: {
    backgroundColor: '#2557a7',
    color: 'white',
    border: '1px solid #2557a7',
    padding: '10px 15px',
    borderRadius: '6px',
    fontWeight: 'bold',
    width: 'auto',
    alignSelf: 'flex-start',
    marginTop: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  },
  formStatusMessage: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#333',
  },


  // My Applications Section specific grid (3 cards per row)
  applicationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Adjust minmax for 3 cards
    gap: '20px',
  },
  applicationCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  applicationCardTitle: {
    fontSize: '18px', // Slightly smaller than job card title
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#2557a7',
  },
  applicationCardDetail: {
    fontSize: '14px',
    lineHeight: '1.4',
    marginBottom: '5px',
  },
  applicationStatus: {
    fontWeight: 'bold',
    color: '#0a0', // Green for status, can be adjusted based on actual status
  },

  // Pagination
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px', // Increased gap
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  paginationButton: {
    backgroundColor: 'white',
    color: '#2557a7',
    border: '1px solid #2557a7',
    padding: '8px 18px', // Slightly more padding
    fontSize: '15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  },
  paginationText: {
    fontWeight: 'normal', // Indeed usually has normal weight for pagination text
    fontSize: '16px',
    color: '#555',
  },

  // Messages (Loading, Error, No Results)
  loadingMessage: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#555',
    padding: '20px 0',
  },
  errorMessage: {
    color: '#d63333', // Red for errors
    textAlign: 'center',
    fontWeight: 'bold',
    padding: '20px 0',
  },
  noResultsMessage: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#777',
    padding: '20px 0',
    gridColumn: '1 / -1', // Span across grid columns
  },
};