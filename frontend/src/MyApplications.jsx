import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './api';

function getAvatarColor(name = '') {
  const colors = [
    { bg: '#ede9fe', text: '#6d28d9' },
    { bg: '#dbeafe', text: '#1d4ed8' },
    { bg: '#dcfce7', text: '#15803d' },
    { bg: '#fef3c7', text: '#b45309' },
    { bg: '#fce7f3', text: '#be185d' },
    { bg: '#ccfbf1', text: '#0f766e' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MyApplications() {
  const [apps, setApps] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [m, j] = await Promise.all([api('/application/my'), api('/job')]);
        const byId = Object.fromEntries((j?.response || []).map((x) => [x._id, x]));
        setApps((m?.data || []).map((a) => ({ ...a, full: byId[a.job?._id] })));
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>My Applications</h1>
        <p>Track the real-time review status of jobs you have applied for.</p>
      </div>

      {err && <div className="msg err">{err}</div>}

      {apps && !apps.length && (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--subtle)', marginBottom: '0.75rem' }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h3>You haven't applied to any jobs yet</h3>
          <p className="muted" style={{ marginBottom: '1.25rem' }}>
            Explore open roles from top companies and submit your application with a single click.
          </p>
          <Link to="/jobs">
            <button className="primary">Browse Open Jobs</button>
          </Link>
        </div>
      )}

      <div className="stack">
        {apps?.map((a) => {
          const companyName = a.full?.company?.name || 'Company';
          const avatar = getAvatarColor(companyName);

          return (
            <div className="card row" key={a._id} style={{ alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: avatar.bg,
                    color: avatar.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{a.job?.title || 'Job Listing'}</h3>
                  <p className="muted" style={{ fontSize: '0.88rem', margin: '0.15rem 0 0' }}>
                    {companyName} · Applied on {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${a.status}`} style={{ fontSize: '0.88rem', padding: '0.3rem 0.85rem' }}>
                  {a.status === 'pending' && '⏳ '}
                  {a.status === 'shortlisted' && '⭐ '}
                  {a.status === 'accepted' && '🎉 '}
                  {a.status === 'rejected' && '✕ '}
                  {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
