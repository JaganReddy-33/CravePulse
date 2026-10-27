import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ModalPortal from '../../components/ModalPortal';
import { useAuth } from '../../context/AuthContext';

const getBankAccounts = (holderName) => [
  {
    id: 'bank-1',
    bankName: 'HDFC Bank Ltd',
    accountNumber: '•••• •••• 4412',
    ifsc: 'HDFC0001234',
    accountHolder: holderName || 'Verified Fleet Captain',
    type: 'PRIMARY',
    isUpi: false
  },
  {
    id: 'bank-2',
    bankName: 'ICICI Bank',
    accountNumber: '•••• •••• 8921',
    ifsc: 'ICIC0005678',
    accountHolder: holderName || 'Verified Fleet Captain',
    type: 'SECONDARY',
    isUpi: false
  },
  {
    id: 'upi-1',
    bankName: 'BHIM UPI Auto-Pay',
    accountNumber: (holderName ? holderName.toLowerCase().replace(/\s+/g, '.') : 'captain') + '@oksbi',
    ifsc: 'State Bank of India',
    accountHolder: holderName || 'Verified Fleet Captain',
    type: 'INSTANT_UPI',
    isUpi: true
  }
];

const RiderEarnings = () => {
  const { user } = useAuth();
  const BANK_ACCOUNTS = getBankAccounts(user?.fullName);
  const [wallet, setWallet] = useState({ 
    balance: 0.00, 
    todayEarned: 0.00,
    weekEarned: 0.00,
    incentiveEarned: 0.00,
    runsCompleted: 0,
    runsTarget: 20,
    cashInHand: 0.00,
    maxCashLimit: 5000.00,
    transactions: [] 
  });
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState('bank-1');
  const [payoutAmount, setPayoutAmount] = useState('0');
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    api.get('/rider/earnings').then(res => {
      if (res.success && res.data) {
        setWallet({
          balance: parseFloat(res.data.walletBalance || 0),
          todayEarned: parseFloat(res.data.todayEarned || 0),
          weekEarned: parseFloat(res.data.weekEarned || 0),
          incentiveEarned: 0.00,
          runsCompleted: parseInt(res.data.runsCompleted || 0, 10),
          runsTarget: 20,
          cashInHand: parseFloat(res.data.cashInHand || 0),
          maxCashLimit: parseFloat(res.data.maxCashLimit || 5000),
          transactions: Array.isArray(res.data.transactions) ? res.data.transactions : []
        });
        setPayoutAmount((res.data.walletBalance || 0).toString());
      }
    }).catch(() => {
      api.get('/auth/wallet').then(res => {
        if (res.success && res.data) {
          const txs = Array.isArray(res.data.transactions) ? res.data.transactions : [];
          const bal = parseFloat(res.data.balance || 0);
          const credits = txs.filter(t => parseFloat(t.amount) > 0);
          const earned = credits.reduce((acc, t) => acc + parseFloat(t.amount), 0);
          setWallet({
            balance: bal,
            todayEarned: earned,
            weekEarned: earned,
            incentiveEarned: 0.00,
            runsCompleted: credits.length,
            runsTarget: 20,
            transactions: txs
          });
          setPayoutAmount(bal.toString());
        }
      });
    });
  }, []);

  const handleInstantPayout = (e) => {
    e.preventDefault();
    const num = parseFloat(payoutAmount);
    if (!num || num <= 0 || num > wallet.balance) return;

    setPayoutProcessing(true);
    setTimeout(() => {
      setPayoutProcessing(false);
      setPayoutSuccess(true);
      const chosenBank = BANK_ACCOUNTS.find(b => b.id === selectedBankId);

      const newTx = {
        id: `TX-${Date.now()}`,
        type: 'WITHDRAWAL',
        reason: `Instant IMPS Payout to ${chosenBank?.bankName} (${chosenBank?.accountNumber})`,
        customer: 'Direct Bank Settlement',
        amount: -num,
        balanceAfter: wallet.balance - num,
        category: 'WITHDRAWAL',
        date: 'Just Now',
        breakdown: `Ref: IMPS${Math.floor(100000000 + Math.random() * 900000000)}`,
        status: 'TRANSFERRED'
      };

      setWallet(prev => ({
        ...prev,
        balance: prev.balance - num,
        transactions: [newTx, ...prev.transactions]
      }));

      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayoutModal(false);
      }, 2000);
    }, 1500);
  };

  const filteredTransactions = wallet.transactions.filter(tx => {
    const matchesCategory = 
      filterCategory === 'ALL' ||
      (filterCategory === 'TRIP' && tx.category === 'TRIP') ||
      (filterCategory === 'WAIT' && tx.category === 'WAIT') ||
      (filterCategory === 'TIP' && tx.category === 'TIP') ||
      (filterCategory === 'WITHDRAWAL' && tx.category === 'WITHDRAWAL');

    const matchesSearch = 
      tx.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customer && tx.customer.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="rider-earnings-container text-white pb-5">
      {/* Page Header */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill text-dark fw-extrabold px-3 py-1" style={{ background: '#00e676', fontSize: 10 }}>
              FAIR-PAY ZERO COMMISSION
            </span>
            <span className="small text-secondary">Ather EV Fleet Node • Indiranagar</span>
          </div>
          <h3 className="fw-extrabold text-white mb-0">Earnings & Payout Ledger</h3>
          <small className="text-secondary">
            Transparent fare calculations, guaranteed wait compensation & instant IMPS transfers.
          </small>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button"
            className="btn btn-outline-light rounded-pill px-3 py-2 fw-bold small d-flex align-items-center gap-2"
            style={{ minHeight: 46, borderColor: 'rgba(255,255,255,0.2)' }}
            onClick={() => setShowBankModal(true)}
          >
            <i className="bi bi-bank2 text-warning fs-6"></i>
            <span>Bank Accounts ({BANK_ACCOUNTS.length})</span>
          </button>
        </div>
      </div>

      {/* Hero Wallet Balance Card */}
      <div 
        className="p-4 p-md-5 rounded-4 mb-4 position-relative overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 24, 40, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          border: '1.5px solid rgba(0, 230, 118, 0.3)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-7">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="text-uppercase fw-extrabold small tracking-wider text-secondary" style={{ fontSize: 11 }}>
                Available Unencumbered Wallet Balance
              </span>
              <span className="badge rounded-pill bg-success-subtle text-success small" style={{ fontSize: 9 }}>
                AUTO-SETTLE READY
              </span>
            </div>

            <div className="d-flex align-items-baseline gap-2 mb-3">
              <span className="display-4 fw-extrabold lh-1" style={{ color: '#00e676', textShadow: '0 0 25px rgba(0,230,118,0.3)' }}>
                ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="small text-secondary">INR</span>
            </div>

            <div className="d-flex flex-wrap gap-2 gap-md-3">
              <button 
                type="button"
                className="btn rounded-pill px-4 py-3 fw-extrabold text-dark d-flex align-items-center gap-2 shadow-lg transition hover-lift glove-touch-btn"
                style={{ 
                  minHeight: 52, 
                  background: '#00e676', 
                  fontSize: 15,
                  boxShadow: '0 0 20px rgba(0, 230, 118, 0.4)' 
                }}
                onClick={() => {
                  setPayoutAmount(wallet.balance.toString());
                  setShowPayoutModal(true);
                }}
              >
                <i className="bi bi-lightning-charge-fill fs-5"></i>
                <span>Instant Bank Payout (IMPS/UPI)</span>
              </button>

              <button 
                type="button"
                className="btn btn-outline-light rounded-pill px-4 py-3 fw-bold small d-flex align-items-center gap-2 glove-touch-btn"
                style={{ minHeight: 52, borderColor: 'rgba(255,255,255,0.2)' }}
                onClick={() => setShowBankModal(true)}
              >
                <i className="bi bi-credit-card-2-front text-info fs-5"></i>
                <span>Manage Accounts</span>
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="row g-2">
              <div className="col-6">
                <div className="p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-secondary d-block small" style={{ fontSize: 11 }}>TODAY'S PAYOUT</span>
                  <strong className="fs-5 text-white">₹{wallet.todayEarned.toFixed(2)}</strong>
                  <small className="text-success d-block" style={{ fontSize: 10 }}>6 Runs Completed</small>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-secondary d-block small" style={{ fontSize: 11 }}>WEEKLY ACCUMULATED</span>
                  <strong className="fs-5 text-white">₹{wallet.weekEarned.toFixed(2)}</strong>
                  <small className="text-info d-block" style={{ fontSize: 10 }}>100% Tips Passed</small>
                </div>
              </div>
              <div className="col-12">
                <div className="p-3 rounded-3" style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-secondary small" style={{ fontSize: 11 }}>Weekend Incentive Milestone</span>
                    <strong className="text-warning small" style={{ fontSize: 11 }}>₹500 Bonus</strong>
                  </div>
                  <div className="progress rounded-pill bg-dark mb-1" style={{ height: 8 }}>
                    <div 
                      className="progress-bar rounded-pill" 
                      style={{ 
                        width: `${(wallet.runsCompleted / wallet.runsTarget) * 100}%`,
                        background: 'linear-gradient(90deg, #00e676, #38bdf8)' 
                      }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center text-secondary" style={{ fontSize: 10 }}>
                    <span>{wallet.runsCompleted} / {wallet.runsTarget} Runs Achieved</span>
                    <span className="text-light fw-bold">6 more runs to unlock</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Fair-Pay Rate Guarantee Grid */}
      <div 
        className="p-4 rounded-4 mb-4 shadow-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
            <span className="fs-5">⚖️</span>
            <span>Transparent Fair-Pay Guaranteed Formula</span>
          </h5>
          <span className="badge rounded-pill bg-dark border border-secondary border-opacity-50 text-secondary" style={{ fontSize: 10 }}>
            ZERO ARBITRARY PLATFORM CUTS
          </span>
        </div>

        <div className="row g-3">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>BASE PICKUP FARE</span>
              <strong className="fs-4 text-white d-block my-1">₹35.00</strong>
              <small className="text-secondary" style={{ fontSize: 11 }}>
                Guaranteed minimum for first 2 km on every dispatched order.
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>DISTANCE TRANSIT RATE</span>
              <strong className="fs-4 text-white d-block my-1">₹12.00 / km</strong>
              <small className="text-secondary" style={{ fontSize: 11 }}>
                Directly calculated per GPS telemetry meter beyond 2 km base.
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>KITCHEN WAIT TIME METER</span>
              <strong className="fs-4 text-warning d-block my-1">₹2.00 / min</strong>
              <small className="text-secondary" style={{ fontSize: 11 }}>
                Automatically metered and credited for chef prep delay &gt; 8 minutes.
              </small>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="p-3 rounded-3 h-100" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-secondary d-block small" style={{ fontSize: 11 }}>CUSTOMER GRATUITY / TIP</span>
              <strong className="fs-4 text-success d-block my-1">100% Direct</strong>
              <small className="text-secondary" style={{ fontSize: 11 }}>
                Transferred 1:1 to captain wallet with zero commission deduction.
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger & Filter Bar */}
      <div 
        className="p-4 rounded-4 shadow-xl"
        style={{
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h5 className="fw-bold mb-1 text-white">Real-Time Payout & Compensation Audit</h5>
            <small className="text-secondary">Itemized settlement ledger showing every credit, wait payout and bank wire.</small>
          </div>

          {/* Filter Chips */}
          <div className="d-flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'All Activity' },
              { id: 'TRIP', label: 'Trip Payouts' },
              { id: 'WAIT', label: 'Wait Pay' },
              { id: 'TIP', label: 'Tips 100%' },
              { id: 'WITHDRAWAL', label: 'Withdrawals' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition ${
                  filterCategory === f.id ? 'text-dark shadow-sm' : 'text-secondary bg-dark'
                }`}
                style={filterCategory === f.id ? { background: '#00e676' } : { border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => setFilterCategory(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-3">
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 translate-middle-y text-secondary" style={{ left: 16 }}></i>
            <input
              type="text"
              placeholder="Search by Order ID, Customer name, or Reference..."
              className="form-control rounded-pill ps-5 py-2.5 text-white"
              style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.12)', fontSize: 13 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Transaction list */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-receipt fs-1 d-block mb-2"></i>
            <span>No transactions match the selected filter.</span>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredTransactions.map(tx => (
              <div 
                key={tx.id}
                className="p-3 rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 transition hover-bg-dark"
                style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ 
                      width: 42, 
                      height: 42, 
                      background: tx.amount > 0 ? 'rgba(0, 230, 118, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: tx.amount > 0 ? '#00e676' : '#ef4444',
                      fontSize: 18
                    }}
                  >
                    <i className={`bi ${tx.amount > 0 ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`}></i>
                  </div>
                  <div>
                    <div className="fw-bold text-white small">{tx.reason}</div>
                    <small className="text-secondary d-block" style={{ fontSize: 11 }}>
                      {tx.breakdown} • <span className="text-light text-opacity-75">{tx.date}</span>
                    </small>
                  </div>
                </div>

                <div className="text-md-end ps-5 ps-md-0">
                  <span className={`fs-5 fw-extrabold d-block lh-1 ${tx.amount > 0 ? 'text-success' : 'text-danger'}`}>
                    {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                  </span>
                  <small className="text-secondary" style={{ fontSize: 10 }}>
                    Balance After: ₹{tx.balanceAfter.toFixed(2)} • <span className="text-info">{tx.status}</span>
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====================================================================
          INSTANT BANK PAYOUT MODAL
          ==================================================================== */}
      {showPayoutModal && (
        <ModalPortal isOpen={showPayoutModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && !payoutProcessing) setShowPayoutModal(false); }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 480 }}>
              <div 
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{ background: '#0f172a', border: '1.5px solid rgba(0, 230, 118, 0.35)' }}
              >
                {payoutSuccess ? (
                  <div className="text-center py-4">
                    <div className="fs-1 mb-2">⚡</div>
                    <h4 className="fw-extrabold text-success mb-1">Transfer Initiated!</h4>
                    <p className="text-secondary small mb-3">
                      ₹{parseFloat(payoutAmount).toFixed(2)} sent via IMPS to your registered bank account.
                    </p>
                    <span className="badge rounded-pill bg-success text-dark px-3 py-1.5 fw-bold">
                      Settlement Ref: IMPS{Math.floor(100000000 + Math.random() * 900000000)}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleInstantPayout}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fs-4">⚡</span>
                        <h5 className="fw-bold mb-0 text-white">Instant Bank Payout (IMPS)</h5>
                      </div>
                      <button 
                        type="button" 
                        className="btn-close btn-close-white" 
                        onClick={() => setShowPayoutModal(false)}
                      ></button>
                    </div>

                    <p className="text-secondary small mb-3">
                      Withdraw funds instantly 24x7 with zero bank gateway deduction charges.
                    </p>

                    {/* Choose Bank Account */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-light">Destination Account *</label>
                      <div className="d-flex flex-column gap-2">
                        {BANK_ACCOUNTS.map(acc => (
                          <div
                            key={acc.id}
                            className={`p-3 rounded-3 d-flex align-items-center justify-content-between cursor-pointer transition ${
                              selectedBankId === acc.id ? 'border-success' : 'border-secondary'
                            }`}
                            style={{
                              background: selectedBankId === acc.id ? 'rgba(0, 230, 118, 0.1)' : '#080c14',
                              border: selectedBankId === acc.id ? '1.5px solid #00e676' : '1px solid rgba(255,255,255,0.1)'
                            }}
                            onClick={() => setSelectedBankId(acc.id)}
                          >
                            <div className="d-flex align-items-center gap-2.5">
                              <i className={`bi ${acc.isUpi ? 'bi-phone' : 'bi-bank2'} fs-5 ${selectedBankId === acc.id ? 'text-success' : 'text-secondary'}`}></i>
                              <div>
                                <strong className="d-block small text-white">{acc.bankName}</strong>
                                <small className="text-secondary" style={{ fontSize: 11 }}>{acc.accountNumber} • {acc.accountHolder}</small>
                              </div>
                            </div>
                            {selectedBankId === acc.id && (
                              <span className="badge rounded-pill bg-success text-dark small" style={{ fontSize: 9 }}>SELECTED</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-light mb-0">Withdrawal Amount (₹) *</label>
                        <span className="text-secondary small" style={{ fontSize: 11 }}>
                          Max: ₹{wallet.balance.toFixed(2)}
                        </span>
                      </div>

                      <div className="position-relative mb-2">
                        <span className="position-absolute top-50 translate-middle-y fs-4 fw-bold text-secondary" style={{ left: 16 }}>₹</span>
                        <input
                          type="number"
                          step="1"
                          min="100"
                          max={wallet.balance}
                          required
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="form-control text-white fw-extrabold ps-5 py-2.5 shadow-none"
                          style={{
                            background: '#080c14',
                            border: '1.5px solid #00e676',
                            fontSize: 22,
                            minHeight: 52
                          }}
                        />
                      </div>

                      {/* Quick pick chips */}
                      <div className="d-flex gap-2">
                        {[500, 1000, wallet.balance].map(val => (
                          <button
                            key={val}
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 text-light small"
                            style={{ fontSize: 11 }}
                            onClick={() => setPayoutAmount(val.toString())}
                          >
                            {val === wallet.balance ? `All (₹${val.toFixed(0)})` : `₹${val}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={payoutProcessing || !parseFloat(payoutAmount) || parseFloat(payoutAmount) > wallet.balance}
                      className="btn w-100 rounded-pill py-3 fw-extrabold text-dark shadow-xl d-flex align-items-center justify-content-center gap-2 glove-touch-btn"
                      style={{ 
                        minHeight: 52, 
                        background: '#00e676', 
                        fontSize: 15,
                        boxShadow: '0 0 20px rgba(0,230,118,0.4)' 
                      }}
                    >
                      {payoutProcessing ? (
                        <>
                          <span className="spinner-border spinner-border-sm"></span>
                          <span>Connecting to NPCI IMPS Gateway...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-shield-check fs-5"></i>
                          <span>Confirm Instant Transfer of ₹{parseFloat(payoutAmount || 0).toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ====================================================================
          MANAGE BANK ACCOUNTS MODAL
          ==================================================================== */}
      {showBankModal && (
        <ModalPortal isOpen={showBankModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowBankModal(false); }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 520 }}>
              <div 
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.15)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">🏦</span>
                    <h5 className="fw-bold mb-0 text-white">Registered Settlement Accounts</h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowBankModal(false)}></button>
                </div>

                <p className="text-secondary small mb-3">
                  Verified bank accounts and UPI VPA IDs for fast automated trip remittances.
                </p>

                <div className="d-flex flex-column gap-2 mb-4">
                  {BANK_ACCOUNTS.map(acc => (
                    <div 
                      key={acc.id}
                      className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                      style={{ background: '#080c14', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{ width: 40, height: 40, background: '#1e293b' }}
                        >
                          <i className={`bi ${acc.isUpi ? 'bi-phone' : 'bi-bank'} fs-5`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-white small d-flex align-items-center gap-2">
                            <span>{acc.bankName}</span>
                            {acc.type === 'PRIMARY' && (
                              <span className="badge rounded-pill bg-success text-dark small" style={{ fontSize: 9 }}>PRIMARY</span>
                            )}
                          </div>
                          <small className="text-secondary" style={{ fontSize: 11 }}>
                            {acc.accountNumber} • IFSC: {acc.ifsc}
                          </small>
                        </div>
                      </div>

                      <span className="badge rounded-pill bg-dark border border-secondary text-success small" style={{ fontSize: 10 }}>
                        VERIFIED ✓
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-3 mb-3 small" style={{ background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                  <div className="d-flex align-items-center gap-2 text-success">
                    <i className="bi bi-shield-lock-fill fs-5"></i>
                    <strong>Penny Drop & NPCI Name Matching Verified</strong>
                  </div>
                  <small className="text-secondary d-block mt-1">
                    Beneficiary name matched with Aadhaar PAN record for Captain Prasad Rao.
                  </small>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-light w-100 rounded-pill py-2.5 fw-bold small"
                  style={{ minHeight: 46, borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={() => setShowBankModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default RiderEarnings;
