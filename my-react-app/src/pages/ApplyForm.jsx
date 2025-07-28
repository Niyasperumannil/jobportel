import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ApplyForm({ jobId, token, initialData = null }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeLink, setResumeLink] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form fields if editing an existing application
  useEffect(() => {
    if (initialData) {
      setCoverLetter(initialData.coverLetter);
      setResumeLink(initialData.resumeLink);
      setIsEditing(true);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate jobId
    if (!jobId && !initialData?._id) {
      setStatusMessage('Job ID is missing. Cannot submit application.');
      return;
    }

    const url = isEditing
      ? `http://localhost:7000/api/apply/${initialData._id}`
      : `http://localhost:7000/api/apply/${jobId}`;
    const method = isEditing ? 'put' : 'post';

    try {
      const { data } = await axios({
        method,
        url,
        data: { coverLetter, resumeLink },
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusMessage(isEditing ? 'Application updated successfully!' : 'Application submitted successfully!');
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || 'An unexpected error occurred.');
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
        />
      </div>
      <button type="submit">{isEditing ? 'Update Application' : 'Apply'}</button>
      {statusMessage && <p>{statusMessage}</p>}
    </form>
  );
}

export default ApplyForm;
