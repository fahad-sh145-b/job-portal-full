import { useEffect, useState, useCallback } from 'react';
import { api, waLink } from './api';
import { useAuth } from './AuthContext';

const STATUSES = ['pending', 'shortlisted', 'accepted', 'rejected'];
const blankJob = { title: '', description: '', company: '', location: '', salarymin: '', salarymax: '', jobType: 'full-time', experience: '', deadline: '' };
const blankCo = { name: '', description: '', location: '', website: '' };

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

  const loadApps = useCallback(async () => {
    try { setApps((await api('/application/received')).data); setSynced(new Date()); }
    catch (e) { setNote({ err: e.message }); }
  }, []);
  const loadAll = useCallback(async () => {
    try {
      const [j, c] = await Promise.all([api('/job'), api('/company')]);
      setJobs(j.response.filter((x) => x.recruiter?._id === user._id));
      setCompanies(c.company.filter((x) => x.recruiter?._id === user._id));
    } catch (e) { setNote({ err: e.message }); }
  }, [user._id]);

  // New applications show up automatically: refresh every 15 seconds
  useEffect(() => {
    loadApps(); loadAll();
    const t = setInterval(loadApps, 15000);
    return () => clearInterval(t);
  }, [loadApps, loadAll]);

  const run = async (fn, ok) => {
    try { await fn(); setNote({ ok }); } catch (e) { setNote({ err: e.message }); }
  };
  const setStatus = (id, status) => run(async () => {
    await api(`/application/${id}/status`, { method: 'PUT', body: { status } });
    setApps((a) => a.map((x) => (x._id === id ? { ...x, status } : x)));
  }, 'Status updated');
  const postJob = (e) => { e.preventDefault(); run(async () => {
    await api('/job/apply', { method: 'POST', body: { ...job, salarymin: +job.salarymin || 0, salarymax: +job.salarymax || 0 } });
    setJob(blankJob); loadAll();
  }, 'Job posted'); };
  const addCompany = (e) => { e.preventDefault(); run(async () => {
    await api('/company/register', { method: 'POST', body: co }); setCo(blankCo); loadAll();
  }, 'Company added'); };
  const toggleJob = (j) => run(async () => {
    await api(`/job/${j._id}`, { method: 'PUT', body: { status: j.status === 'open' ? 'closed' : 'open' } }); loadAll();
  }, 'Job updated');
  const removeJob = (j) => window.confirm(`Delete "${j.title}"?`) && run(async () => {
    await api(`/job/${j._id}`, { method: 'DELETE' }); loadAll();
  }, 'Job deleted');

  const bind = (obj, set, k) => ({ value: obj[k], onChange: (e) => set({ ...obj, [k]: e.target.value }) });
  const count = (s) => apps.filter((a) => a.status === s).length;
  const stats = [['Applications', apps.length], ['Pending', count('pending')], ['Shortlisted', count('shortlisted')], ['Open jobs', jobs.filter((j) => j.status === 'open').length]];

  return (
    <>
      <div className="row"><h1>Hiring dashboard</h1>
        <small>{synced && `Updated ${synced.toLocaleTimeString()}`} <button className="ghost" onClick={loadApps}>Refresh</button></small></div>
      <div className="stats">{stats.map(([l, n]) => <div className="stat" key={l}><b>{n}</b><span>{l}</span></div>)}</div>
      <div className="tabs">{['applications', 'jobs', 'companies'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      {note && <p className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>{note.err || note.ok}</p>}

      {tab === 'applications' && (
        apps.length ? (
          <div className="scroll"><table>
            <thead><tr><th>Candidate</th><th>Job</th><th>Contact</th><th>Resume</th><th>Applied</th><th>Status</th></tr></thead>
            <tbody>{apps.map((a) => (
              <tr key={a._id}>
                <td><b>{a.applicant?.name}</b><br /><small>{a.applicant?.email}</small></td>
                <td>{a.job?.title}</td>
                <td>{waLink(a.applicant?.phone) ? <a href={waLink(a.applicant.phone)} target="_blank" rel="noreferrer">WhatsApp {a.applicant.phone}</a> : '—'}</td>
                <td>{a.resume ? <a href={a.resume} target="_blank" rel="noreferrer">Open</a> : '—'}</td>
                <td>{new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td><select className={`badge ${a.status}`} value={a.status} onChange={(e) => setStatus(a._id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              </tr>))}</tbody>
          </table></div>
        ) : <p className="empty">No applications yet. They appear here as soon as someone applies.</p>
      )}

      {tab === 'jobs' && (
        <>
          {!companies.length ? <p className="empty">Add a company first, then you can post jobs.</p> : (
            <form className="panel form2" onSubmit={postJob}>
              <h2>Post a job</h2>
              <label>Title<input required {...bind(job, setJob, 'title')} /></label>
              <label>Company<select required {...bind(job, setJob, 'company')}><option value="">Select</option>
                {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
              <label>Location<input required {...bind(job, setJob, 'location')} /></label>
              <label>Job type<select {...bind(job, setJob, 'jobType')}>{['full-time', 'part-time', 'internship', 'remote'].map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>Experience<input required placeholder="e.g. 0-2 years" {...bind(job, setJob, 'experience')} /></label>
              <label>Apply by<input type="date" required {...bind(job, setJob, 'deadline')} /></label>
              <label>Min salary (₹)<input type="number" min="0" {...bind(job, setJob, 'salarymin')} /></label>
              <label>Max salary (₹)<input type="number" min="0" {...bind(job, setJob, 'salarymax')} /></label>
              <label className="wide">Description<textarea required rows={4} {...bind(job, setJob, 'description')} /></label>
              <button className="primary">Post job</button>
            </form>)}
          <div className="stack">{jobs.map((j) => (
            <div className="card row" key={j._id}>
              <div><h3>{j.title}</h3><p className="muted">{j.company?.name} · {j.location} · {apps.filter((a) => a.job?._id === j._id).length} applicants</p></div>
              <div className="row"><span className={`badge ${j.status === 'open' ? 'accepted' : 'rejected'}`}>{j.status}</span>
                <button className="ghost" onClick={() => toggleJob(j)}>{j.status === 'open' ? 'Close' : 'Reopen'}</button>
                <button className="ghost danger" onClick={() => removeJob(j)}>Delete</button></div>
            </div>))}</div>
        </>
      )}

      {tab === 'companies' && (
        <>
          <form className="panel form2" onSubmit={addCompany}>
            <h2>Add a company</h2>
            <label>Name<input required {...bind(co, setCo, 'name')} /></label>
            <label>Location<input required {...bind(co, setCo, 'location')} /></label>
            <label>Website<input type="url" {...bind(co, setCo, 'website')} /></label>
            <label className="wide">About<textarea required rows={3} {...bind(co, setCo, 'description')} /></label>
            <button className="primary">Add company</button>
          </form>
          <div className="stack">{companies.map((c) => <div className="card" key={c._id}><h3>{c.name}</h3><p className="muted">{c.location}</p></div>)}</div>
        </>
      )}
    </>
  );
}
