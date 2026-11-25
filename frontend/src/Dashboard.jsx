import { useEffect, useState, useCallback, useMemo } from 'react';
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

  // Application Pipeline filtering & search
  const [statusFilter, setStatusFilter] = useState('all');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showPostJobForm, setShowPostJobForm] = useState(false);
  const [showAddCoForm, setShowAddCoForm] = useState(false);

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
    }, 'Candidate status updated');

  const postJob = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/job/apply', {
        method: 'POST',
        body: { ...job, salarymin: +job.salarymin || 0, salarymax: +job.salarymax || 0 },
      });
      setJob(blankJob);
      setShowPostJobForm(false);
      loadAll();
    }, 'New job opening published!');
  };

  const addCompany = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/company/register', { method: 'POST', body: co });
      setCo(blankCo);
      setShowAddCoForm(false);
      loadAll();
    }, 'Company profile created!');
  };

  const toggleJob = (j) =>
    run(async () => {
      await api(`/job/${j._id}`, { method: 'PUT', body: { status: j.status === 'open' ? 'closed' : 'open' } });
      loadAll();
    }, `Job status changed to ${j.status === 'open' ? 'closed' : 'open'}`);

  const removeJob = (j) =>
    window.confirm(`Are you sure you want to delete "${j.title}"?`) &&
    run(async () => {
      await api(`/job/${j._id}`, { method: 'DELETE' });
      loadAll();
    }, 'Job deleted');

  const bind = (obj, set, k) => ({ value: obj[k], onChange: (e) => set({ ...obj, [k]: e.target.value }) });
  const count = (s) => apps.filter((a) => a.status === s).length;

  // Filtered applications list
  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      const query = candidateSearch.toLowerCase();
      const matchQuery =
        !query ||
        `${a.applicant?.name || ''} ${a.applicant?.email || ''} ${a.job?.title || ''}`.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [apps, statusFilter, candidateSearch]);

  const shortlistedRate = apps.length ? Math.round((count('shortlisted') / apps.length) * 100) : 0;

  return (
    <>
      {/* 1. EXECUTIVE COMMAND CENTER HERO */}
      <div className="hero-command">
        <div className="hero-command-info">
          <div className="hero-badge-pill">
            <span className="pulse-dot"></span>
            <span>Live Recruitment Pipeline</span>
          </div>
          <h1>Recruiter Command Center</h1>
          <p>
            Welcome back, <strong>{user?.name}</strong>. Monitor candidate applications, conduct fast reviews, and orchestrate your hiring pipeline.
          </p>
        </div>

        <div className="hero-command-actions">
          <button
            className="btn-glow"
            onClick={() => {
              setTab('jobs');
              setShowPostJobForm(true);
            }}
          >
            + Post a Job
          </button>
          <button
            className="btn-glass"
            onClick={() => {
              setTab('companies');
              setShowAddCoForm(true);
            }}
          >
            + Add Company
          </button>
          <button
            className="btn-glass"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh candidate data"
            style={{ padding: '0.75rem' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 2. HIGH-END 4-KPI METRIC CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-primary">
          <div>
            <div className="kpi-label">Total Applications</div>
            <div className="kpi-number">{apps.length}</div>
            <div className="kpi-sub">Received across all roles</div>
          </div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
        </div>

        <div className="kpi-card kpi-warning">
          <div>
            <div className="kpi-label">Pending Review</div>
            <div className="kpi-number">{count('pending')}</div>
            <div className="kpi-sub">Awaiting your evaluation</div>
          </div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        <div className="kpi-card kpi-indigo">
          <div>
            <div className="kpi-label">Shortlisted</div>
            <div className="kpi-number">{count('shortlisted')}</div>
            <div className="kpi-sub">{shortlistedRate}% pass-through rate</div>
          </div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>

        <div className="kpi-card kpi-success">
          <div>
            <div className="kpi-label">Active Job Openings</div>
            <div className="kpi-number">{jobs.filter((j) => j.status === 'open').length}</div>
            <div className="kpi-sub">Accepting live applications</div>
          </div>
          <div className="kpi-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* 3. SEGMENTED TABS */}
      <div className="segmented-tabs">
        <button
          className={`segmented-tab ${tab === 'applications' ? 'active' : ''}`}
          onClick={() => setTab('applications')}
        >
          <span>Candidate Pipeline</span>
          <span className="tab-badge">{apps.length}</span>
        </button>
        <button
          className={`segmented-tab ${tab === 'jobs' ? 'active' : ''}`}
          onClick={() => setTab('jobs')}
        >
          <span>Job Postings</span>
          <span className="tab-badge">{jobs.length}</span>
        </button>
        <button
          className={`segmented-tab ${tab === 'companies' ? 'active' : ''}`}
          onClick={() => setTab('companies')}
        >
          <span>Company Profiles</span>
          <span className="tab-badge">{companies.length}</span>
        </button>
      </div>

      {note && (
        <div className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>
          <span>{note.err || note.ok}</span>
        </div>
      )}

      {/* ======================================================================
          TAB 1: CANDIDATE APPLICATIONS PIPELINE
          ====================================================================== */}
      {tab === 'applications' && (
        <>
          {/* SEARCH & STATUS FILTER PILLS */}
          <div className="pipeline-bar">
            <div className="pipeline-pills">
              <button
                className={`pill-filter ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All ({apps.length})
              </button>
              <button
                className={`pill-filter ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                ⏳ Pending ({count('pending')})
              </button>
              <button
                className={`pill-filter ${statusFilter === 'shortlisted' ? 'active' : ''}`}
                onClick={() => setStatusFilter('shortlisted')}
              >
                ⭐ Shortlisted ({count('shortlisted')})
              </button>
              <button
                className={`pill-filter ${statusFilter === 'accepted' ? 'active' : ''}`}
                onClick={() => setStatusFilter('accepted')}
              >
                🎉 Accepted ({count('accepted')})
              </button>
              <button
                className={`pill-filter ${statusFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setStatusFilter('rejected')}
              >
                ✕ Rejected ({count('rejected')})
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: 260 }}>
              <input
                type="text"
                placeholder="Search candidate or role..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                style={{
                  padding: '0.45rem 0.85rem 0.45rem 2.2rem',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-full)',
                }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {filteredApps.length ? (
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Target Role</th>
                    <th>Direct Contact</th>
                    <th>Resume</th>
                    <th>Applied Date</th>
                    <th>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((a) => {
                    const candidateName = a.applicant?.name || 'Applicant';
                    const avatar = getAvatarColor(candidateName);
                    const phoneLink = waLink(a.applicant?.phone);

                    return (
                      <tr key={a._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: avatar.bg,
                                color: avatar.text,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                flexShrink: 0,
                              }}
                            >
                              {candidateName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{candidateName}</strong>
                              <div className="muted" style={{ fontSize: '0.82rem' }}>{a.applicant?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.92rem' }}>{a.job?.title || 'Job Listing'}</strong>
                        </td>
                        <td>
                          {phoneLink ? (
                            <a
                              href={phoneLink}
                              target="_blank"
                              rel="noreferrer"
                              className="whatsapp-pill"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.42-.101.825z"></path>
                              </svg>
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
                                gap: '0.35rem',
                                padding: '0.3rem 0.75rem',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.84rem',
                                fontWeight: 600,
                              }}
                            >
                              <span>View Resume</span>
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
                            style={{ cursor: 'pointer', paddingRight: '1.5rem', fontWeight: 700 }}
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--subtle)', marginBottom: '0.75rem' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3>No candidates match this filter</h3>
              <p className="muted" style={{ margin: '0 0 1rem' }}>Try clearing your search query or selecting a different status pill above.</p>
              <button className="ghost" onClick={() => { setStatusFilter('all'); setCandidateSearch(''); }}>
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* ======================================================================
          TAB 2: JOB OPENINGS MANAGER
          ====================================================================== */}
      {tab === 'jobs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Active Job Listings</h2>
              <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                Manage your posted openings, track applications, and update status.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setShowPostJobForm(!showPostJobForm)}
            >
              {showPostJobForm ? '✕ Hide Form' : '+ Post New Job'}
            </button>
          </div>

          {showPostJobForm && (
            <form className="panel form2" onSubmit={postJob} style={{ marginBottom: '2rem', border: '2px solid var(--primary-border)' }}>
              <h2 style={{ margin: 0 }}>Create a Job Opening</h2>
              <label>
                Job Title
                <input required placeholder="e.g. Senior Backend Engineer" {...bind(job, setJob, 'title')} />
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
                Location / Mode
                <input required placeholder="e.g. Mumbai, India / Remote" {...bind(job, setJob, 'location')} />
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
                <input required placeholder="e.g. 2-4 years" {...bind(job, setJob, 'experience')} />
              </label>
              <label>
                Apply Deadline
                <input type="date" required {...bind(job, setJob, 'deadline')} />
              </label>
              <label>
                Min Salary (₹)
                <input type="number" min="0" placeholder="e.g. 40000" {...bind(job, setJob, 'salarymin')} />
              </label>
              <label>
                Max Salary (₹)
                <input type="number" min="0" placeholder="e.g. 75000" {...bind(job, setJob, 'salarymax')} />
              </label>
              <label className="wide">
                Role Description & Requirements
                <textarea required rows={4} placeholder="Key requirements, responsibilities, and team culture..." {...bind(job, setJob, 'description')} />
              </label>
              <button className="primary">Publish Job Opening</button>
            </form>
          )}

          <div className="stack">
            {jobs.map((j) => {
              const applicantCount = apps.filter((a) => a.job?._id === j._id).length;
              return (
                <div className="card row" key={j._id} style={{ alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem' }}>{j.title}</h3>
                    <p className="muted" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>{j.company?.name || 'Company'}</span>
                      <span>·</span>
                      <span>{j.location}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {applicantCount} candidate{applicantCount === 1 ? '' : 's'} applied
                      </span>
                    </p>
                  </div>
                  <div className="row" style={{ gap: '0.65rem' }}>
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

      {/* ======================================================================
          TAB 3: COMPANY PROFILES
          ====================================================================== */}
      {tab === 'companies' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Registered Companies</h2>
              <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                Your registered business profiles associated with job postings.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => setShowAddCoForm(!showAddCoForm)}
            >
              {showAddCoForm ? '✕ Hide Form' : '+ Add Company'}
            </button>
          </div>

          {showAddCoForm && (
            <form className="panel form2" onSubmit={addCompany} style={{ marginBottom: '2rem', border: '2px solid var(--primary-border)' }}>
              <h2 style={{ margin: 0 }}>Register a Company</h2>
              <label>
                Company Name
                <input required placeholder="e.g. Acme Corporation" {...bind(co, setCo, 'name')} />
              </label>
              <label>
                Headquarters / City
                <input required placeholder="e.g. Mumbai, India" {...bind(co, setCo, 'location')} />
              </label>
              <label>
                Website URL
                <input type="url" placeholder="https://example.com" {...bind(co, setCo, 'website')} />
              </label>
              <label className="wide">
                About the Company
                <textarea required rows={3} placeholder="Brief company summary..." {...bind(co, setCo, 'description')} />
              </label>
              <button className="primary">Register Company</button>
            </form>
          )}

          <div className="grid">
            {companies.map((c) => {
              const avatar = getAvatarColor(c.name);
              return (
                <div className="card" key={c._id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
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
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{c.name}</h3>
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
