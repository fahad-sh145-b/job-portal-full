import { useEffect, useState } from 'react';
import { api } from './api';

export default function MyApplications() {
  const [apps, setApps] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const [m, j] = await Promise.all([api('/application/my'), api('/job')]);
        const byId = Object.fromEntries(j.response.map((x) => [x._id, x]));
        setApps(m.data.map((a) => ({ ...a, full: byId[a.job?._id] })));
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  return (
    <>
      <h1>My applications</h1>
      {err && <p className="msg err">{err}</p>}
      {apps && !apps.length && <p className="empty">You haven't applied to any job yet.</p>}
      <div className="stack">
        {apps?.map((a) => (
          <div className="card row" key={a._id}>
            <div><h3>{a.job?.title || 'Job removed'}</h3>
              <p className="muted">{a.full?.company?.name} · applied {new Date(a.createdAt).toLocaleDateString('en-IN')}</p></div>
            <span className={`badge ${a.status}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}
