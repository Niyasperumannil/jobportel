// src/components/ApplyFormWithAPI.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

/**
 * Dynamically resolves the API base URL:
 * 1. If REACT_APP_API_BASE_URL is defined at build time → use it.
 * 2. Else:
 *    • Host is localhost/127.0.0.1 → use development backend
 *    • Otherwise → use production URL (Render)
 *
 * Note: Create React App only embeds REACT_APP_* vars at build time,
 * not at runtime. Any change after build requires a re-build and deploy. :contentReference[oaicite:0]{index=0}
 */
function getApiBase() {
  const env = process.env.REACT_APP_API_BASE_URL;
  if (env && env.trim() !== "") {
    return env;
  }

  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost
    ? 'http://localhost:7000'
    : 'https://jobportel-4.onrender.com';
}

export default function ApplyForm({ jobId, token, initialData = null }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeLink, setResumeLink] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCoverLetter(initialData.coverLetter || '');
      setResumeLink(initialData.resumeLink || '');
      setIsEditing(true);
    }
  }, [initialData]);

  const apiBase = getApiBase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const appId = initialData?._id;
    if (!jobId && !appId) {
      setStatusMessage('Error: no jobId or applicationId.');
      return;
    }

    const url = isEditing
      ? `${apiBase}/api/apply/${appId}`
      : `${apiBase}/api/apply/${jobId}`;

    try {
      await axios({
        method: isEditing ? 'put' : 'post',
        url,
        data: { coverLetter, resumeLink },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusMessage(isEditing
        ? 'Application updated successfully!'
        : 'Application submitted successfully!'
      );
    } catch (err) {
      setStatusMessage(err.response?.data?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="coverLetter">Cover Letter</label>
        <textarea
          id="coverLetter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          required
          style={{ width: '100%', height: '100px' }}
        />
      </div>

      <div>
        <label htmlFor="resumeLink">Resume Link</label>
        <input
          id="resumeLink"
          type="url"
          value={resumeLink}
          onChange={(e) => setResumeLink(e.target.value)}
          required
          style={{ width: '100%' }}
        />
      </div>

      <button type="submit" style={{ marginBottom: '0.5em' }}>
        {isEditing ? 'Update' : 'Apply'}
      </button>

      {statusMessage && (
        <div style={{ marginTop: '0.5em', color: isEditing ? 'blue':'green' }}>
          {statusMessage}
        </div>
      )}
    </form>
  );
}

ApplyForm.propTypes = {
  jobId: PropTypes.string,
  token: PropTypes.string.isRequired,
  initialData: PropTypes.shape({
    _id: PropTypes.string,
    coverLetter: PropTypes.string,
    resumeLink: PropTypes.string,
  }),
};
