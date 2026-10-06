import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
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
        <strong className="brand">JobPortal</strong>
        <nav>
          {user?.role === 'employer' && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && user.role !== 'employer' && <><NavLink to="/jobs">Find jobs</NavLink><NavLink to="/applications">My applications</NavLink></>}
        </nav>
        {user && <div className="who">{user.name}<button className="ghost" onClick={logout}>Log out</button></div>}
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
