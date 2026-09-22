import React, { useState } from 'react';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // onAuthStateChange will flip user -> app renders
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email atau kata laluan salah.'
          : err.message || 'Tidak dapat log masuk.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">🤝</div>
        <h1 className="login-title">Follow-Up CRM</h1>
        <p className="login-sub">Log masuk untuk teruskan</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="login-input"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />

          <label className="login-label" htmlFor="password">Kata Laluan</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Log masuk...' : 'Log Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
