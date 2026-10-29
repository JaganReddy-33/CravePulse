import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
export default function RiderEarnings() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [ticket, setTicket] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [earnings, wallet] = await Promise.all([api.get('/rider/earnings'), api.get('/auth/wallet')]);
      if (!earnings.success || !wallet.success) throw new Error('Unable to load your earnings');
      setSummary(earnings.data);
      setTransactions(wallet.data.transactions || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const requestReview = async () => {
    setRequesting(true); setError('');
    try {
      const res = await api.post('/account/support', { category: 'PAYOUT_REVIEW', message: 'Please review my rider earnings and arrange settlement through the approved payment process.', orderNumber: '' });
      if (!res.success) throw new Error('Unable to request payout review');
      setTicket(res.data.ticketNumber);
    } catch (err) { setError(err.message); }
    finally { setRequesting(false); }
  };
  return <section className="container py-4">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4"><div><h1 className="h3 fw-bold">Earnings & settlements</h1><p className="text-secondary mb-0">Your completed deliveries and recorded wallet transactions.</p></div><button className="btn btn-outline-primary" onClick={load} disabled={loading}>Refresh</button></div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {loading && <p role="status">Loading earnings...</p>}
    {summary && <><div className="row g-3 mb-4">{[['Today', summary.todayEarned], ['This week', summary.weekEarned], ['Wallet balance', summary.walletBalance], ['Cash collected', summary.cashInHand]].map(([label, value]) => <div key={label} className="col-12 col-sm-6 col-xl-3"><div className="card p-4 h-100"><span className="text-secondary small">{label}</span><strong className="fs-3 mt-2">{money(value)}</strong></div></div>)}</div>
      <div className="card p-4 mb-4"><h2 className="h5">Settlement support</h2><p className="text-secondary">Automated bank transfers are not available. Request a settlement review; your balance is unchanged until a real settlement is recorded.</p><button className="btn btn-primary align-self-start" disabled={requesting || Boolean(ticket)} onClick={requestReview}>{requesting ? 'Submitting...' : 'Request settlement review'}</button>{ticket && <p role="status" className="text-success mt-3 mb-0">Request saved: {ticket}</p>}</div></>}
    <div className="card p-4"><h2 className="h5">Wallet ledger</h2>{transactions.length === 0 ? <p className="text-secondary mb-0">No recorded transactions yet.</p> : <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th className="text-end">Amount</th><th className="text-end">Balance</th></tr></thead><tbody>{transactions.map(tx => <tr key={tx.id}><td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '—'}</td><td>{tx.reason}</td><td>{tx.transactionType}</td><td className="text-end">{money(tx.amount)}</td><td className="text-end">{money(tx.balanceAfter)}</td></tr>)}</tbody></table></div>}</div>
  </section>;
}
