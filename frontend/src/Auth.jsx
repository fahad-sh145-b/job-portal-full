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
    <div className="auth-card" style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>{isLogin ? 'Log in' : 'Create Account'}</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isLogin && (
          <>
            <div>
              <label>Full Name</label>
              <input type="text" name="name" value={form.name} onChange={onChange} required style={{ width: '100%', padding: 8 }} />
            </div>
            <div>
              <label>I want to</label>
              <select name="role" value={form.role} onChange={onChange} style={{ width: '100%', padding: 8 }}>
                <option value="jobseeker">Find a job</option>
                <option value="employer">Hire people</option>
              </select>
            </div>
            {form.role === 'jobseeker' && (
              <div>
                <label>WhatsApp Phone (with country code)</label>
                <input type="text" name="phone" placeholder="919876543210" value={form.phone} onChange={onChange} style={{ width: '100%', padding: 8 }} />
              </div>
            )}
          </>
        )}
        <div>
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={onChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={onChange} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={loading} style={{ padding: 10, cursor: 'pointer', background: '#0066cc', color: '#fff', border: 'none', borderRadius: 4 }}>
          {loading ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {isLogin ? (
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
        ) : (
          <p>Already have an account? <Link to="/login">Log in</Link></p>
        )}
      </div>
    </div>
  );
}
