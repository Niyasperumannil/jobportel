// src/pages/Login.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  /**
   * Determine API base URL:
   * - If REACT_APP_API_BASE_URL is set (in .env.*), use it.
   * - Otherwise, use hostname check for fallback:
   *   - localhost → http://localhost:7000
   *   - otherwise → https://jobportel-4.onrender.com
   */
  const getApiBase = () => {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:7000';
    }
    return 'https://jobportel-4.onrender.com';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const base = getApiBase();

    try {
      const res = await axios.post(`${base}/api/auth/login`, {
        email,
        password
      });

      const { token, role } = res.data;
      localStorage.setItem('token', token);

      if (role === 'job_seeker') {
        navigate('/jobseeker');
      } else if (role === 'employer') {
        navigate('/employer');
      } else {
        setError('Unknown role. Please contact support.');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email or password.');
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.card}>
        <img
          src="./download.png"
          alt="Indeed Logo"
          style={styles.logo}
        />
        <h2 style={styles.title}>Sign In</h2>
        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" style={styles.button}>
            Sign In
          </button>
        </form>
        <p style={styles.register}>
          Don’t have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#f3f2f1',
  },
  card: {
    background: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  logo: {
    height: '30px',
    marginBottom: '20px',
    display: 'block',
    margin: '0 auto',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '24px',
    color: '#2d2d2d',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2557a7',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  register: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#555',
  },
  link: {
    color: '#2557a7',
    textDecoration: 'none',
    fontWeight: 500,
  },
  error: {
    backgroundColor: '#ffe6e6',
    color: '#cc0000',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '6px',
    fontSize: '14px',
  },
};
