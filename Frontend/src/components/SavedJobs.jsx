import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Dynamically resolve API base URL
function getApiBase() {
  const env = process.env.REACT_APP_API_BASE_URL;
  if (env && env.trim() !== '') {
    return env;
  }
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost
    ? 'http://localhost:7000'
    : 'https://jobportel-4.onrender.com';
}

export default function SavedJobs({ token }) {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiBase = getApiBase();

  const fetchSavedJobs = useCallback(async () => {
    if (!token) {
      setError('You must be logged in to view saved jobs.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${apiBase}/api/applicationRoutes/saved-jobs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedJobs(data);
      setError('');
    } catch (err) {
      console.error('Fetch saved jobs error:', err);
      setError('Failed to load saved jobs.');
    } finally {
      setLoading(false);
    }
  }, [token, apiBase]);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleUnsave = async (jobId) => {
    try {
      await axios.delete(
        `${apiBase}/api/applicationRoutes/unsave/${jobId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Error unsaving job:', err);
      alert('Failed to unsave the job.');
    }
  };

  if (loading) {
    return <div style={styles.container}><p>Loading...</p></div>;
  }

  if (error) {
    return <div style={styles.container}><p style={{ color: 'red' }}>{error}</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>My Saved Jobs</h2>
      {savedJobs.length > 0 ? (
        <div style={styles.grid}>
          {savedJobs.map(job => (
            <div key={job._id} style={styles.card}>
              <h3 style={styles.title}>{job.title}</h3>
              <p><strong>Company:</strong> {job.company}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Posted by:</strong> {job.employer?.username || 'N/A'}</p>
              <button
                onClick={() => handleUnsave(job._id)}
                style={styles.unsaveButton}
              >
                Unsave
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center' }}>You have no jobs saved yet. 📌</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '40px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    minHeight: '50vh',
  },
  heading: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '30px',
    color: '#333',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '22px',
    marginBottom: '10px',
    color: '#1e88e5',
  },
  unsaveButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: 'auto',
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
};
