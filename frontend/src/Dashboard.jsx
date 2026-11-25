import { useEffect, useState, useCallback } from 'react';
import { api, waLink } from './api';
import { useAuth } from './AuthContext';

const STATUSES = ['pending', 'shortlisted', 'accepted', 'rejected'];
const blankJob = { title: '', description: '', company: '', location: '', salarymin: '', salarymax: '', jobType: 'full-time', experience: '', deadline: '' };
const blankCo = { name: '', description: '', location: '', website: '' };

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

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('applications');
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [job, setJob] = useState(blankJob);
  const [co, setCo] = useState(blankCo);
  const [note, setNote] = useState(null);
  const [synced, setSynced] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadApps = useCallback(async () => {
    try {
      const res = await api('/application/received');
      setApps(res.data || []);
      setSynced(new Date());
    } catch (e) {
      setNote({ err: e.message });
    }
  }, []);

  const loadAll = useCallback(async () => {
    const currentId = user?._id || user?.id;
    if (!currentId) return;
    try {
      const [j, c] = await Promise.all([
        api('/job').catch((err) => { console.error('Jobs fetch error:', err); return { response: [] }; }),
        api('/company').catch((err) => { console.error('Companies fetch error:', err); return { company: [] }; })
      ]);
      const uid = String(currentId);
      const allJobs = j?.response || [];
      const allCompanies = c?.company || [];
      setJobs(allJobs.filter((x) => String(x.recruiter?._id || x.recruiter) === uid));
      setCompanies(allCompanies.filter((x) => String(x.recruiter?._id || x.recruiter) === uid));
    } catch (e) {
      setNote({ err: e.message });
    }
  }, [user]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadApps(), loadAll()]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadApps();
    loadAll();
    const t = setInterval(loadApps, 15000);
    return () => clearInterval(t);
  }, [loadApps, loadAll]);

  const run = async (fn, ok) => {
    try {
      await fn();
      setNote({ ok });
    } catch (e) {
      setNote({ err: e.message });
    }
  };

  const setStatus = (id, status) =>
    run(async () => {
      await api(`/application/${id}/status`, { method: 'PUT', body: { status } });
      setApps((a) => a.map((x) => (x._id === id ? { ...x, status } : x)));
    }, 'Status updated successfully');

  const postJob = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/job/apply', {
        method: 'POST',
        body: { ...job, salarymin: +job.salarymin || 0, salarymax: +job.salarymax || 0 },
      });
      setJob(blankJob);
      loadAll();
    }, 'Job opening published successfully');
  };

  const addCompany = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/company/register', { method: 'POST', body: co });
      setCo(blankCo);
      loadAll();
    }, 'Company profile registered');
  };

  const toggleJob = (j) =>
    run(async () => {
      await api(`/job/${j._id}`, { method: 'PUT', body: { status: j.status === 'open' ? 'closed' : 'open' } });
      loadAll();
    }, `Job marked as ${j.status === 'open' ? 'closed' : 'open'}`);

  const removeJob = (j) =>
    window.confirm(`Are you sure you want to delete "${j.title}"?`) &&
    run(async () => {
      await api(`/job/${j._id}`, { method: 'DELETE' });
      loadAll();
    }, 'Job deleted');

  const bind = (obj, set, k) => ({ value: obj[k], onChange: (e) => set({ ...obj, [k]: e.target.value }) });
  const count = (s) => apps.filter((a) => a.status === s).length;

  return (
    <>
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Hiring Dashboard</h1>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Welcome back, <strong>{user?.name}</strong>. Manage candidate applications and your active listings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {synced && (
            <span className="muted" style={{ fontSize: '0.82rem' }}>
              Synced {synced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="ghost" onClick={handleManualRefresh} disabled={refreshing} style={{ fontSize: '0.85rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* METRIC OVERVIEW CARDS */}
      <div className="stats">
        <div className="stat" style={{ borderLeftColor: '#3b82f6' }}>
          <b>{apps.length}</b>
          <span>Total Applications</span>
        </div>
        <div className="stat" style={{ borderLeftColor: '#f59e0b' }}>
          <b>{count('pending')}</b>
          <span>Pending Review</span>
        </div>
        <div className="stat" style={{ borderLeftColor: '#6366f1' }}>
          <b>{count('shortlisted')}</b>
          <span>Shortlisted</span>
        </div>
        <div className="stat" style={{ borderLeftColor: '#10b981' }}>
          <b>{jobs.filter((j) => j.status === 'open').length}</b>
          <span>Open Jobs</span>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button className={tab === 'applications' ? 'on' : ''} onClick={() => setTab('applications')}>
          Applications ({apps.length})
        </button>
        <button className={tab === 'jobs' ? 'on' : ''} onClick={() => setTab('jobs')}>
          My Jobs ({jobs.length})
        </button>
        <button className={tab === 'companies' ? 'on' : ''} onClick={() => setTab('companies')}>
          Companies ({companies.length})
        </button>
      </div>

      {note && (
        <div className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>
          <span>{note.err || note.ok}</span>
        </div>
      )}

      {/* TAB 1: APPLICATIONS */}
      {tab === 'applications' && (
        apps.length ? (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Contact</th>
                  <th>Resume</th>
                  <th>Applied On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const candidateName = a.applicant?.name || 'Applicant';
                  const avatar = getAvatarColor(candidateName);
                  const phoneLink = waLink(a.applicant?.phone);

                  return (
                    <tr key={a._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: avatar.bg,
                              color: avatar.text,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              flexShrink: 0,
                            }}
                          >
                            {candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{candidateName}</strong>
                            <div className="muted" style={{ fontSize: '0.8rem' }}>{a.applicant?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.92rem' }}>{a.job?.title || 'Job Unavailable'}</strong>
                      </td>
                      <td>
                        {phoneLink ? (
                          <a
                            href={phoneLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              background: '#dcfce7',
                              color: '#15803d',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {a.resume ? (
                          <a
                            href={a.resume}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.65rem',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                            }}
                          >
                            <span>View</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        ) : (
                          <span className="muted" style={{ fontSize: '0.85rem' }}>No file</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {new Date(a.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <select
                          className={`badge ${a.status}`}
                          value={a.status}
                          onChange={(e) => setStatus(a._id, e.target.value)}
                          style={{ cursor: 'pointer', paddingRight: '1.5rem' }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--subtle)', marginBottom: '0.5rem' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <h3>No applications received yet</h3>
            <p className="muted">When candidates apply for your open jobs, their profiles and resumes will appear here.</p>
          </div>
        )
      )}

      {/* TAB 2: JOBS */}
      {tab === 'jobs' && (
        <>
          {!companies.length ? (
            <div className="empty">
              <h3>Register a company first</h3>
              <p className="muted" style={{ marginBottom: '1rem' }}>
                You need at least one registered company profile before posting job openings.
              </p>
              <button className="primary" onClick={() => setTab('companies')}>
                Add Company Profile
              </button>
            </div>
          ) : (
            <form className="panel form2" onSubmit={postJob} style={{ marginBottom: '2rem' }}>
              <h2>Post a New Job Opening</h2>
              <label>
                Job Title
                <input required placeholder="e.g. Senior Full Stack Engineer" {...bind(job, setJob, 'title')} />
              </label>
              <label>
                Company
                <select required {...bind(job, setJob, 'company')}>
                  <option value="">Select registered company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Location / Work Mode
                <input required placeholder="e.g. Mumbai / Hybrid / Remote" {...bind(job, setJob, 'location')} />
              </label>
              <label>
                Job Type
                <select {...bind(job, setJob, 'jobType')}>
                  {['full-time', 'part-time', 'internship', 'remote'].map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Required Experience
                <input required placeholder="e.g. 1-3 years" {...bind(job, setJob, 'experience')} />
              </label>
              <label>
                Application Deadline
                <input type="date" required {...bind(job, setJob, 'deadline')} />
              </label>
              <label>
                Min Salary (₹)
                <input type="number" min="0" placeholder="e.g. 30000" {...bind(job, setJob, 'salarymin')} />
              </label>
              <label>
                Max Salary (₹)
                <input type="number" min="0" placeholder="e.g. 60000" {...bind(job, setJob, 'salarymax')} />
              </label>
              <label className="wide">
                Job Description & Key Responsibilities
                <textarea required rows={4} placeholder="Describe the role requirements, responsibilities, and benefits..." {...bind(job, setJob, 'description')} />
              </label>
              <button className="primary">Publish Job Opening</button>
            </form>
          )}

          <h3 style={{ margin: '1.5rem 0 0.75rem' }}>Your Published Jobs ({jobs.length})</h3>
          <div className="stack">
            {jobs.map((j) => {
              const applicantCount = apps.filter((a) => a.job?._id === j._id).length;
              return (
                <div className="card row" key={j._id} style={{ alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.2rem' }}>{j.title}</h3>
                    <p className="muted" style={{ fontSize: '0.88rem' }}>
                      {j.company?.name || 'Company'} · {j.location} · <strong>{applicantCount}</strong> applicant{applicantCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="row" style={{ gap: '0.6rem' }}>
                    <span className={`badge ${j.status === 'open' ? 'accepted' : 'rejected'}`}>
                      {j.status}
                    </span>
                    <button className="ghost" onClick={() => toggleJob(j)} style={{ fontSize: '0.85rem' }}>
                      {j.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button className="danger" onClick={() => removeJob(j)} style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 3: COMPANIES */}
      {tab === 'companies' && (
        <>
          <form className="panel form2" onSubmit={addCompany} style={{ marginBottom: '2rem' }}>
            <h2>Register a Company Profile</h2>
            <label>
              Company Name
              <input required placeholder="e.g. Acme Technologies" {...bind(co, setCo, 'name')} />
            </label>
            <label>
              Headquarters / Location
              <input required placeholder="e.g. Bangalore, India" {...bind(co, setCo, 'location')} />
            </label>
            <label>
              Company Website
              <input type="url" placeholder="https://example.com" {...bind(co, setCo, 'website')} />
            </label>
            <label className="wide">
              About the Company
              <textarea required rows={3} placeholder="Briefly describe what your company does and company culture..." {...bind(co, setCo, 'description')} />
            </label>
            <button className="primary">Save Company Profile</button>
          </form>

          <h3 style={{ margin: '1.5rem 0 0.75rem' }}>Registered Companies ({companies.length})</h3>
          <div className="grid">
            {companies.map((c) => {
              const avatar = getAvatarColor(c.name);
              return (
                <div className="card" key={c._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: avatar.bg,
                        color: avatar.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{c.name}</h3>
                      <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>{c.location || 'Location not specified'}</p>
                    </div>
                  </div>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'inline-block', marginBottom: '0.5rem' }}>
                      🌐 {c.website}
                    </a>
                  )}
                  {c.description && (
                    <p className="muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                      {c.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
