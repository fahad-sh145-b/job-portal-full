const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const getAuth = () => JSON.parse(localStorage.getItem('auth') || 'null');
export const setAuth = (a) => (a ? localStorage.setItem('auth', JSON.stringify(a)) : localStorage.removeItem('auth'));

export async function api(path, { method = 'GET', body } = {}) {
  const a = getAuth();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(a ? { Authorization: `Bearer ${a.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
  return data;
}

// wa.me link so a recruiter can open a WhatsApp chat with an applicant
export const waLink = (phone) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) d = '91' + d;
  return d.length >= 11 ? `https://wa.me/${d}` : null;
};
export const money = (j) => (j.salarymax ? `₹${j.salarymin.toLocaleString('en-IN')} – ₹${j.salarymax.toLocaleString('en-IN')}` : 'Salary not disclosed');
