// src/pages/Register.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'job_seeker',
    company: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Dynamically compute the API base URL:
   * - Uses REACT_APP_API_BASE_URL if defined in `.env`
   * - Falls back to localhost in dev, else points to Render URL
   */
  const getApiBase = () => {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }
    const host = window.location.hostname;
    return host.includes('localhost') || host === '127.0.0.1'
      ? 'http://localhost:7000'
      : 'https://jobportel-4.onrender.com';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const base = getApiBase();
    try {
      await axios.post(`${base}/api/auth/register`, formData);
      alert('Registration successful!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error occurred';
      alert(msg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="./download.png" alt="Indeed Logo" style={styles.logo} />
        <h2 style={styles.title}>Create your account</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="employer">Employer</option>
            </select>
          </div>
          {formData.role === 'employer' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name</label>
              <input
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          )}
          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
        <p style={styles.loginText}>
          Already have an account?{' '}
          <Link to="/" style={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#f3f2f1', height: '100vh', display: 'flex',
               justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: '40px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%',
          maxWidth: '420px', boxSizing: 'border-box' },
  logo: { height: '30px', display: 'block', margin: '0 auto 20px' },
  title: { textAlign: 'center', fontSize: '24px', marginBottom: '30px',
           color: '#2d2d2d' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px',
           fontWeight: 500, color: '#333' },
  input: { width: '100%', padding: '10px 14px', fontSize: '16px',
           borderRadius: '6px', border: '1px solid #ccc', outline: 'none',
           boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#2557a7',
            color: '#fff', border: 'none', borderRadius: '6px',
            fontSize: '16px', cursor: 'pointer', marginTop: '10px' },
  loginText: { marginTop: '20px', textAlign: 'center',
               fontSize: '14px', color: '#555' },
  link: { color: '#2557a7', textDecoration: 'none', fontWeight: 500 },
};
