import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth } from './AuthContext';

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

export default function TeamDirectory() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [note, setNote] = useState(null);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'jobseeker', phone: '' });
  const [addBusy, setAddBusy] = useState(false);

  const loadData = async () => {
    try {
      const [u, j] = await Promise.all([
        api('/user').catch(() => []),
        api('/job').catch(() => ({ response: [] })),
      ]);
      setMembers(Array.isArray(u) ? u : []);
      setJobs(j?.response || []);
    } catch (err) {
      setNote({ err: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Account Switcher
  const handleSwitchUser = async (targetMember) => {
    setSwitchingId(targetMember._id);
    try {
      const res = await api('/user/switch', {
        method: 'POST',
        body: { userId: targetMember._id },
      });
      // Update AuthContext and LocalStorage with target user session
      login({ user: res.user, token: res.token });
      setNote({ ok: `Switched account to ${res.user.name} (${res.user.role})` });

      // Navigate to target user's natural landing page
      setTimeout(() => {
        if (res.user.role === 'employer') {
          navigate('/dashboard');
        } else {
          navigate('/jobs');
        }
      }, 500);
    } catch (err) {
      setNote({ err: err.message || 'Could not switch user' });
      setSwitchingId(null);
    }
  };

  // Remove Member
  const handleRemoveMember = async (targetMember) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetMember.name}" (${targetMember.email})?`)) {
      return;
    }
    try {
      await api(`/user/${targetMember._id}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m._id !== targetMember._id));
      setNote({ ok: `User ${targetMember.name} deleted successfully` });
    } catch (err) {
      setNote({ err: err.message });
    }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    try {
      const res = await api('/user/register', {
        method: 'POST',
        body: addForm,
      });
      const createdUser = res.response || res.user;
      setMembers((prev) => [createdUser, ...prev]);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'jobseeker', phone: '' });
      setNote({ ok: `New ${createdUser.role} "${createdUser.name}" created!` });
    } catch (err) {
      setNote({ err: err.message });
    } finally {
      setAddBusy(false);
    }
  };

  // Metrics
  const totalMembers = members.length;
  const employers = members.filter((m) => m.role === 'employer');
  const candidates = members.filter((m) => m.role === 'jobseeker' || !m.role);
  const currentUserId = String(user?._id || user?.id || '');

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchRole =
        filterRole === 'all' ||
        (filterRole === 'employer' && m.role === 'employer') ||
        (filterRole === 'jobseeker' && (m.role === 'jobseeker' || !m.role));
      const query = search.toLowerCase();
      const matchQuery =
        !query ||
        `${m.name || ''} ${m.email || ''}`.toLowerCase().includes(query);
      return matchRole && matchQuery;
    });
  }, [members, filterRole, search]);

  return (
    <>
      {/* 1. TOP HEADER & ADD MEMBER BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Team Directory</h1>
          <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.95rem' }}>
            Team members, roles, project ownership & assignments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="primary"
            onClick={() => setShowAddModal(true)}
            style={{
              background: '#4f46e5',
              borderColor: '#4f46e5',
              boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            <span>+ Add Member</span>
          </button>
        </div>
      </div>

      {/* 2. CURRENTLY VIEWING AS BANNER (MATCHES USER SCREENSHOT) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderLeft: '5px solid #4f46e5',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
            Currently viewing as: <strong>{user?.name}</strong> <span className="muted">({user?.email})</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="muted" style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            YOUR ACCOUNT:
          </span>
          <span
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            🛡️ {user?.role === 'employer' ? 'RECRUITER' : 'CANDIDATE'}
          </span>
          <span
            style={{
              background: '#ede9fe',
              color: '#4f46e5',
              border: '1px solid #c7d2fe',
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            📍 Active Session
          </span>
        </div>
      </div>

      {/* 3. METRICS ROW */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div className="muted" style={{ fontSize: '0.88rem', fontWeight: 700 }}>Total Members</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {totalMembers}
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: '0.88rem', fontWeight: 700 }}>Employers / Recruiters</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {employers.length}
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: '0.88rem', fontWeight: 700 }}>Candidates / Jobseekers</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {candidates.length}
          </div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: '0.88rem', fontWeight: 700 }}>Active Jobs</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            {jobs.length}
          </div>
        </div>
      </div>

      {/* 4. SEARCH BAR & FILTER PILLS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 420 }}>
          <input
            type="text"
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.3rem', borderRadius: '10px' }}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle)' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`pill-filter ${filterRole === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRole('all')}
          >
            All ({totalMembers})
          </button>
          <button
            className={`pill-filter ${filterRole === 'employer' ? 'active' : ''}`}
            onClick={() => setFilterRole('employer')}
          >
            🏢 Employers ({employers.length})
          </button>
          <button
            className={`pill-filter ${filterRole === 'jobseeker' ? 'active' : ''}`}
            onClick={() => setFilterRole('jobseeker')}
          >
            👤 Candidates ({candidates.length})
          </button>
        </div>
      </div>

      {note && (
        <div className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>
          <span>{note.err || note.ok}</span>
        </div>
      )}

      {/* 5. MEMBER CARDS GRID (EXACT LAYOUT FROM USER'S SCREENSHOT) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredMembers.map((m) => {
          const isCurrentUser = String(m._id) === currentUserId;
          const avatar = getAvatarColor(m.name);
          const isEmployer = m.role === 'employer';
          const memberJobs = jobs.filter((j) => String(j.recruiter?._id || j.recruiter) === String(m._id));

          return (
            <div
              key={m._id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.4rem 1.5rem',
                border: isCurrentUser ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                boxShadow: isCurrentUser
                  ? '0 8px 20px -3px rgba(79, 70, 229, 0.25)'
                  : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'var(--transition)',
                position: 'relative',
              }}
            >
              <div>
                {/* TOP AVATAR + NAME + BADGES */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: avatar.bg,
                      color: avatar.text,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      flexShrink: 0,
                    }}
                  >
                    {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--ink)' }}>{m.name}</strong>
                      {isCurrentUser && (
                        <span
                          style={{
                            background: '#4f46e5',
                            color: '#ffffff',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          📍 You (Logged In)
                        </span>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: '0.85rem', wordBreak: 'break-all', marginTop: '0.15rem' }}>
                      {m.email}
                    </div>

                    <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {isEmployer ? (
                        <span
                          style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          🛡️ EMPLOYER
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          👤 CANDIDATE
                        </span>
                      )}

                      {isEmployer && memberJobs.length > 0 && (
                        <span
                          style={{
                            background: '#e0e7ff',
                            color: '#4338ca',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          📁 JOBS ({memberJobs.length})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* PROJECTS / JOBS OWNED */}
                {isEmployer && memberJobs.length > 0 && (
                  <div style={{ margin: '0.75rem 0', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <div className="muted" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      JOBS OWNED ({memberJobs.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {memberJobs.slice(0, 3).map((jb) => (
                        <span
                          key={jb._id}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.78rem',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          📁 {jb.title}
                        </span>
                      ))}
                      {memberJobs.length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center' }}>
                          +{memberJobs.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* CANDIDATE INFO */}
                {!isEmployer && m.phone && (
                  <div style={{ margin: '0.5rem 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    <span>📱 WhatsApp: <strong>{m.phone}</strong></span>
                  </div>
                )}
              </div>

              {/* CARD BOTTOM ACTION BUTTONS (EXACTLY MATCHING USER SCREENSHOT) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.25rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                {isCurrentUser ? (
                  <div
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '0.5rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      color: '#4f46e5',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    ✓ Current Active Session
                  </div>
                ) : (
                  <>
                    <button
                      className="ghost danger"
                      onClick={() => handleRemoveMember(m)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        background: '#fff',
                        color: '#dc2626',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      <span>Remove</span>
                    </button>

                    <button
                      className="primary"
                      onClick={() => handleSwitchUser(m)}
                      disabled={switchingId === m._id}
                      style={{
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        background: isEmployer ? '#4f46e5' : '#2563eb',
                        borderColor: isEmployer ? '#4f46e5' : '#2563eb',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{switchingId === m._id ? 'Switching...' : 'Switch to User →'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className="overlay" onClick={() => setShowAddModal(false)}>
          <form
            className="panel modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddMember}
            style={{ padding: '2rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Add New Team Member</h2>
              <button type="button" className="ghost" onClick={() => setShowAddModal(false)} style={{ padding: '0.3rem', borderRadius: '50%' }}>
                ✕
              </button>
            </div>

            <div>
              <label>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setAddForm({ ...addForm, role: 'employer' })}
                  style={{
                    background: addForm.role === 'employer' ? '#ede9fe' : '#fff',
                    color: addForm.role === 'employer' ? '#4f46e5' : 'var(--muted)',
                    borderColor: addForm.role === 'employer' ? '#4f46e5' : 'var(--line)',
                    fontWeight: 700,
                  }}
                >
                  🛡️ Employer / Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm({ ...addForm, role: 'jobseeker' })}
                  style={{
                    background: addForm.role === 'jobseeker' ? '#dbeafe' : '#fff',
                    color: addForm.role === 'jobseeker' ? '#1d4ed8' : 'var(--muted)',
                    borderColor: addForm.role === 'jobseeker' ? '#1d4ed8' : 'var(--line)',
                    fontWeight: 700,
                  }}
                >
                  👤 Candidate
                </button>
              </div>
            </div>

            <div>
              <label>Full Name</label>
              <input
                required
                placeholder="e.g. Alex Johnson"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>

            <div>
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              />
            </div>

            {addForm.role === 'jobseeker' && (
              <div>
                <label>WhatsApp Phone (Optional)</label>
                <input
                  placeholder="919876543210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>
            )}

            <div className="row" style={{ marginTop: '1rem' }}>
              <button type="button" className="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="primary" disabled={addBusy}>
                {addBusy ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
