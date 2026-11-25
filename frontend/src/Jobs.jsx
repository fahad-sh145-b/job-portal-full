import { useEffect, useState } from 'react';
import { api, money } from './api';
import { useAuth } from './AuthContext';

// Generates a consistent pleasant color based on company name
function getAvatarColor(name = '') {
  const colors = [
    { bg: '#ede9fe', text: '#6d28d9' }, // Violet
    { bg: '#dbeafe', text: '#1d4ed8' }, // Blue
    { bg: '#dcfce7', text: '#15803d' }, // Green
    { bg: '#fef3c7', text: '#b45309' }, // Amber
    { bg: '#fce7f3', text: '#be185d' }, // Pink
    { bg: '#e0e7ff', text: '#4338ca' }, // Indigo
    { bg: '#ccfbf1', text: '#0f766e' }, // Teal
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applied, setApplied] = useState(new Set());
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ resume: user?.resume || '', coverletter: '' });
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [j, m] = await Promise.all([api('/job'), api('/application/my')]);
        setJobs(j?.response || []);
        setApplied(new Set((m?.data || []).map((a) => a.job?._id)));
      } catch (e) {
        setNote({ err: e.message });
      }
    })();
  }, []);

  const today = new Date(new Date().toDateString());
  const list = jobs.filter(
    (j) =>
      j.status === 'open' &&
      new Date(j.deadline) >= today &&
      (!type || j.jobType === type) &&
      `${j.title} ${j.company?.name || ''} ${j.location || ''}`.toLowerCase().includes(q.toLowerCase())
  );

  const apply = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api(`/application/apply/${target._id}`, { method: 'POST', body: form });
      setApplied(new Set(applied).add(target._id));
      setTarget(null);
      setNote({ ok: r.message || '🎉 Application submitted successfully! The recruiter will review your profile.' });
    } catch (x) {
      setNote({ err: x.message });
    }
    setBusy(false);
  };

  return (
    <>
      <div className="page-header">
        <h1>Explore Opportunities</h1>
        <p>Find and apply to curated jobs from verified companies and fast-growing teams.</p>
      </div>

      <div className="filters" style={{ background: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            placeholder="Search by job title, company, or city..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: '2.4rem' }}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Job Types</option>
          {['full-time', 'part-time', 'internship', 'remote'].map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {note && (
        <div className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>
          <span>{note.err || note.ok}</span>
        </div>
      )}

      {!list.length && (
        <div className="empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--subtle)', marginBottom: '0.75rem' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 style={{ margin: '0 0 0.25rem' }}>No matching jobs found</h3>
          <p className="muted" style={{ margin: 0 }}>Try clearing your filters or searching for different keywords.</p>
        </div>
      )}

      <div className="grid">
        {list.map((j) => {
          const companyName = j.company?.name || 'Company';
          const avatar = getAvatarColor(companyName);
          const isApplied = applied.has(j._id);

          return (
            <article className="card" key={j._id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{j.title}</h3>
                    <p className="muted" style={{ fontSize: '0.88rem', margin: '0.15rem 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{companyName}</span>
                      <span>·</span>
                      <span>{j.location || 'Remote'}</span>
                    </p>
                  </div>
                </div>

                <div className="tags">
                  <span style={{ background: '#dbeafe', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                    {j.jobType}
                  </span>
                  <span>{j.experience || 'Fresher'}</span>
                  {money(j) && (
                    <span style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0', fontWeight: 600 }}>
                      {money(j)}
                    </span>
                  )}
                </div>

                <p className="desc">{j.description}</p>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--line)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <small style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Apply by {new Date(j.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </small>

                {isApplied ? (
                  <span className="badge accepted">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Applied
                  </span>
                ) : (
                  <button className="primary" onClick={() => setTarget(j)} style={{ padding: '0.45rem 0.95rem', fontSize: '0.88rem' }}>
                    Apply Now
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {target && (
        <div className="overlay" onClick={() => setTarget(null)}>
          <form className="panel modal" onClick={(e) => e.stopPropagation()} onSubmit={apply} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span className="muted" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  Job Application
                </span>
                <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.4rem' }}>{target.title}</h2>
                <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                  at {target.company?.name || 'Company'} · {target.location}
                </p>
              </div>
              <button type="button" className="ghost" onClick={() => setTarget(null)} style={{ padding: '0.4rem', borderRadius: '50%' }}>
                ✕
              </button>
            </div>

            <label>
              Resume Link
              <input
                type="url"
                required
                placeholder="Google Drive, Dropbox, or Portfolio URL"
                value={form.resume}
                onChange={(e) => setForm({ ...form, resume: e.target.value })}
              />
              <small>Make sure link permissions are set to "Anyone with the link can view"</small>
            </label>

            <label>
              Cover Letter / Brief Intro (Optional)
              <textarea
                rows={4}
                placeholder="Why are you a great fit for this position?"
                value={form.coverletter}
                onChange={(e) => setForm({ ...form, coverletter: e.target.value })}
              />
            </label>

            <div className="row" style={{ marginTop: '0.5rem' }}>
              <button type="button" className="ghost" onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button className="primary" disabled={busy}>
                {busy ? 'Submitting Application...' : 'Confirm & Apply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
