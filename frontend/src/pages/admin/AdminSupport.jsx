import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { const res = await api.get('/account/support/inbox'); if (!res.success) throw new Error('Unable to load tickets'); setTickets(res.data || []); }
    catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const update = async (id, status) => {
    setError('');
    try { await api.post('/account/support/status', { id, status }); await load(); }
    catch (err) { setError(err.message); }
  };
  return <section><div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4"><h1 className="h3">Support inbox</h1><button className="btn btn-outline-primary" onClick={load}>Refresh</button></div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {!tickets.length && <p className="text-secondary">No support requests yet.</p>}
    <div className="d-grid gap-3">{tickets.map(ticket => <article className="card p-4" key={ticket.id}><h2 className="h5">{ticket.subject}</h2><p className="small text-secondary">{ticket.ticketNumber} · {ticket.name} · {ticket.email}</p><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{ticket.message}</p><label htmlFor={`status-${ticket.id}`} className="form-label">Status</label><select id={`status-${ticket.id}`} className="form-select" value={ticket.status} onChange={e => update(ticket.id, e.target.value)}>{['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(status => <option key={status}>{status}</option>)}</select></article>)}</div>
  </section>;
}
