import React, { useState } from 'react';
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

const UploadResume = ({ token, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setError('');
    const selected = e.target.files[0];
    if (selected && selected.size <= 2 * 1024 * 1024) {
      setFile(selected);
    } else {
      setError('Only images under 2MB allowed');
      setFile(null);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) {
      setError('Please select a resume image first.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const apiBase = getApiBase();
      const response = await axios.post(
        `${apiBase}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      onUploadSuccess(response.data.url);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Upload Resume Image:
          <input type="file" accept="image/*" onChange={handleChange} />
        </label>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={!file || uploading}>
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  );
};

export default UploadResume;
