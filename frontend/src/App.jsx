import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Auth from './Auth';
import Jobs from './Jobs';
import MyApplications from './MyApplications';
import Dashboard from './Dashboard';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const isEmployer = user.role === 'employer';
  if (role === 'employer' && !isEmployer) return <Navigate to="/jobs" replace />;
  if (role === 'jobseeker' && isEmployer) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  const home = !user ? '/login' : user.role === 'employer' ? '/dashboard' : '/jobs';

  return (
    <>
      <header className="bar">
        <Link to={home} className="brand-group">
          <div className="logo-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="3" ry="3"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <span className="brand">
            Job<span className="brand-accent">Portal</span>
          </span>
        </Link>

        <nav>
          {user?.role === 'employer' && (
            <NavLink to="/dashboard">Hiring Dashboard</NavLink>
          )}
          {user && user.role !== 'employer' && (
            <>
              <NavLink to="/jobs">Find Jobs</NavLink>
              <NavLink to="/applications">My Applications</NavLink>
            </>
          )}
        </nav>

        {user ? (
          <div className="who">
            <div className="user-pill">
              <div className="user-avatar">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="user-name">{user.name}</span>
              <span className={`role-tag ${user.role === 'employer' ? 'role-employer' : 'role-jobseeker'}`}>
                {user.role === 'employer' ? 'Recruiter' : 'Candidate'}
              </span>
            </div>
            <button className="ghost" onClick={logout} title="Log out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Log out</span>
            </button>
          </div>
        ) : (
          <div className="who">
            <Link to="/login">
              <button className="ghost">Log in</button>
            </Link>
            <Link to="/register">
              <button className="primary">Sign up</button>
            </Link>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/jobs" element={<Guard role="jobseeker"><Jobs /></Guard>} />
          <Route path="/applications" element={<Guard role="jobseeker"><MyApplications /></Guard>} />
          <Route path="/dashboard" element={<Guard role="employer"><Dashboard /></Guard>} />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </>
  );
}
