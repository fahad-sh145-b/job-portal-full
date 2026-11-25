import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'jobseeker',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api('/user/login', {
          method: 'POST',
          body: { email: form.email, password: form.password },
        });
        login({ user: res.user, token: res.token });
        navigate(res.user.role === 'employer' ? '/dashboard' : '/jobs');
      } else {
        const res = await api('/user/register', {
          method: 'POST',
          body: form,
        });
        const userObj = res.response || res.user;
        login({ user: userObj, token: res.token });
        navigate(userObj.role === 'employer' ? '/dashboard' : '/jobs');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="panel" style={{ padding: '2.25rem 2rem', borderRadius: '18px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="logo-badge" style={{ width: 44, height: 44, margin: '0 auto 0.75rem', borderRadius: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="3" ry="3"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.35rem' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="muted" style={{ fontSize: '0.92rem' }}>
            {isLogin
              ? 'Enter your credentials to access your portal'
              : 'Join thousands of candidates & top companies today'}
          </p>
        </div>

        {error && (
          <div className="msg err" onClick={() => setError('')} style={{ marginBottom: '1.25rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {!isLogin && (
            <>
              <div>
                <label>I want to</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'jobseeker' })}
                    style={{
                      background: form.role === 'jobseeker' ? 'var(--primary-light)' : '#fff',
                      color: form.role === 'jobseeker' ? 'var(--primary)' : 'var(--muted)',
                      borderColor: form.role === 'jobseeker' ? 'var(--primary)' : 'var(--line)',
                      fontWeight: form.role === 'jobseeker' ? 700 : 500,
                      padding: '0.65rem 0.5rem',
                      fontSize: '0.88rem'
                    }}
                  >
                    🔍 Find a Job
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'employer' })}
                    style={{
                      background: form.role === 'employer' ? 'var(--primary-light)' : '#fff',
                      color: form.role === 'employer' ? 'var(--primary)' : 'var(--muted)',
                      borderColor: form.role === 'employer' ? 'var(--primary)' : 'var(--line)',
                      fontWeight: form.role === 'employer' ? 700 : 500,
                      padding: '0.65rem 0.5rem',
                      fontSize: '0.88rem'
                    }}
                  >
                    🏢 Hire Talent
                  </button>
                </div>
              </div>

              <div>
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Rahul Sharma"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>

              {form.role === 'jobseeker' && (
                <div>
                  <label>WhatsApp Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 919876543210 (with country code)"
                    value={form.phone}
                    onChange={onChange}
                  />
                  <small style={{ color: 'var(--muted)', marginTop: '0.25rem', display: 'block', fontSize: '0.8rem' }}>
                    Employers can contact you directly on WhatsApp
                  </small>
                </div>
              )}
            </>
          )}

          <div>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <button
            type="submit"
            className="primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.98rem' }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In to Portal' : 'Create My Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: '0.92rem' }}>
          {isLogin ? (
            <span className="muted">
              Don't have an account?{' '}
              <Link to="/register" style={{ fontWeight: 600 }}>Create account</Link>
            </span>
          ) : (
            <span className="muted">
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
