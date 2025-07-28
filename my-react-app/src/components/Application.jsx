import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Application.css';

export default function Application({ token }) {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 4; // adjust as needed for two cards per row, two rows (2x2)

  useEffect(() => {
    if (!token) {
      setError('You are not authenticated.');
      setLoading(false);
      return;
    }
    async function fetchMyApplications() {
      try {
        const res = await axios.get(
          'http://localhost:7000/api/applicationRoutes/my-applications',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.applications ?? res.data;
        setApplications(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch applications.');
      } finally {
        setLoading(false);
      }
    }
    fetchMyApplications();
  }, [token]);

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!applications.length) return <p>No applications found.</p>;

  const totalPages = Math.ceil(applications.length / perPage);
  const start = (currentPage - 1) * perPage;
  const currentApps = applications.slice(start, start + perPage);

  return (
    <div className="applications-container">
      <h2>My Applications</h2>
      <div className="cards-container">
        {currentApps.map((app) => (
          <div key={app._id} className="application-card">
            <h3>{app.job?.title} @ {app.job?.company}</h3>
            <p><strong>Status:</strong> {app.status || 'Pending'}</p>
            <p><strong>Applied On:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
