import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
export default function ContactPage() {
 const { user } = useAuth();
 const [category, setCategory] = useState('ORDER_SUPPORT'); const [orderNumber, setOrderNumber] = useState(''); const [message, setMessage] = useState('');
 const [tickets, setTickets] = useState([]); const [error, setError] = useState(''); const [saved, setSaved] = useState(''); const [sending, setSending] = useState(false);
 const load = useCallback(async () => { if (!user) { setTickets([]); return; } try { const res = await api.get('/account/support'); setTickets(res.data || []); } catch (err) { setError(err.message); } }, [user?.id]);
 useEffect(() => { load(); }, [load]);
 const submit = async e => {
   e.preventDefault(); setError(''); setSaved(''); setSending(true);
   try { const res = await api.post('/account/support', { category, orderNumber, message }); if (!res.success) throw new Error('Ticket was not submitted'); setSaved(res.data.ticketNumber); setMessage(''); await load(); }
   catch (err) { setError(err.message); } finally { setSending(false); }
 };
 return <section className="container py-5" style={{ maxWidth: 1000 }}><h1 className="h2 fw-bold">Contact support</h1><p className="text-muted">Send a request and follow its progress from your account.</p>{error && <div className="alert alert-danger" role="alert">{error}</div>}{saved && <div className="alert alert-success" role="status">Your request was saved: {saved}</div>}
 {!user ? <div className="card p-4"><p>Sign in to submit a request linked to your account.</p><Link className="btn btn-primary align-self-start" to="/login?redirect=/contact">Sign in</Link></div> : <div className="row g-4"><div className="col-12 col-lg-7"><form className="card p-4" onSubmit={submit}><p className="small text-muted">Submitting as {user.fullName} ({user.email})</p>
 <label htmlFor="support-category" className="form-label">Category</label><select id="support-category" className="form-select mb-3" value={category} onChange={e => setCategory(e.target.value)}>{['ORDER_SUPPORT','REFUND_DISPUTE','RESTAURANT_PARTNER','RIDER_FLEET','TECHNICAL_FEEDBACK'].map(value => <option key={value}>{value}</option>)}</select>
 <label htmlFor="support-order" className="form-label">Order number (optional)</label><input id="support-order" className="form-control mb-3" maxLength={80} value={orderNumber} onChange={e => setOrderNumber(e.target.value)} />
 <label htmlFor="support-message" className="form-label">Message</label><textarea id="support-message" className="form-control mb-3" rows={5} required minLength={10} maxLength={10000} value={message} onChange={e => setMessage(e.target.value)} />
 <button className="btn btn-primary align-self-start" disabled={sending}>{sending ? 'Sending...' : 'Send request'}</button></form></div><div className="col-12 col-lg-5"><h2 className="h5">Your requests</h2>{!tickets.length && <p className="text-muted">No requests yet.</p>}{tickets.map(ticket => <div className="card p-3 mb-3" key={ticket.ticketNumber}><strong>{ticket.subject}</strong><small className="text-muted" style={{ overflowWrap: 'anywhere' }}>{ticket.ticketNumber}</small><span className="mt-2">{ticket.status}</span></div>)}</div></div>}</section>;
}
