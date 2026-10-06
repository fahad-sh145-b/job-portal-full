import { useEffect, useState } from 'react';
import { api, money } from './api';
import { useAuth } from './AuthContext';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applied, setApplied] = useState(new Set());
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ resume: user.resume || '', coverletter: '' });
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [j, m] = await Promise.all([api('/job'), api('/application/my')]);
        setJobs(j.response);
        setApplied(new Set(m.data.map((a) => a.job?._id)));
      } catch (e) { setNote({ err: e.message }); }
    })();
  }, []);

  const today = new Date(new Date().toDateString());
  const list = jobs.filter((j) => j.status === 'open' && new Date(j.deadline) >= today && (!type || j.jobType === type)
    && `${j.title} ${j.company?.name} ${j.location}`.toLowerCase().includes(q.toLowerCase()));

  const apply = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api(`/application/apply/${target._id}`, { method: 'POST', body: form });
      setApplied(new Set(applied).add(target._id));
      setTarget(null);
      setNote({ ok: r.message || '🎉 Success! You have successfully applied to this job. A confirmation notification has been sent!' });
    } catch (x) { setNote({ err: x.message }); }
    setBusy(false);
  };

  return (
    <>
      <h1>Open jobs</h1>
      <div className="filters">
        <input placeholder="Search title, company or city" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {['full-time', 'part-time', 'internship', 'remote'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      {note && <p className={`msg ${note.err ? 'err' : 'ok'}`} onClick={() => setNote(null)}>{note.err || note.ok}</p>}
      {!list.length && <p className="empty">No open jobs match your search.</p>}
      <div className="grid">
        {list.map((j) => (
          <article className="card" key={j._id}>
            <h3>{j.title}</h3>
            <p className="muted">{j.company?.name} · {j.location}</p>
            <p className="tags"><span>{j.jobType}</span><span>{j.experience}</span><span>{money(j)}</span></p>
            <p className="desc">{j.description}</p>
            <div className="row">
              <small>Apply by {new Date(j.deadline).toLocaleDateString('en-IN')}</small>
              {applied.has(j._id) ? <span className="badge accepted">Applied</span>
                : <button className="primary" onClick={() => setTarget(j)}>Apply</button>}
            </div>
          </article>
        ))}
      </div>
      {target && (
        <div className="overlay" onClick={() => setTarget(null)}>
          <form className="panel modal" onClick={(e) => e.stopPropagation()} onSubmit={apply}>
            <h2>Apply for {target.title}</h2>
            <label>Resume link<input type="url" placeholder="Google Drive, LinkedIn or portfolio link" value={form.resume} onChange={(e) => setForm({ ...form, resume: e.target.value })} /></label>
            <label>Cover letter<textarea rows={5} value={form.coverletter} onChange={(e) => setForm({ ...form, coverletter: e.target.value })} /></label>
            <div className="row"><button type="button" className="ghost" onClick={() => setTarget(null)}>Cancel</button>
              <button className="primary" disabled={busy}>{busy ? 'Sending…' : 'Submit application'}</button></div>
          </form>
        </div>
      )}
    </>
  );
}
