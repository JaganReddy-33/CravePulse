import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value || 0),
  );

export default function RiderEarnings() {
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [payoutDestination, setPayoutDestination] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [earnings, wallet, payoutState] = await Promise.all([
        api.get("/rider/earnings"),
        api.get("/auth/wallet"),
        api.get("/rider/payout-requests"),
      ]);
      if (!earnings.success || !wallet.success || !payoutState.success) {
        throw new Error("Unable to load your earnings and payout balance");
      }
      setSummary(earnings.data);
      setTransactions(wallet.data.transactions || []);
      setPayouts(payoutState.data);
    } catch (err) {
      setError(err.message || "Unable to load earnings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setRequesting(true);
    setError("");
    setSuccess("");
    try {
      const response = await api.post("/rider/payout-requests", {
        amount: Number(amount),
        payoutDestination,
      });
      if (!response.success) throw new Error("Unable to submit payout request");
      setAmount("");
      setSuccess(
        `Payout request #${response.data.id} was submitted for admin review.`,
      );
      await load();
    } catch (err) {
      setError(err.message || "Unable to submit payout request");
    } finally {
      setRequesting(false);
    }
  };

  const cards =
    summary && payouts
      ? [
          ["Today", summary.todayEarned],
          ["This week", summary.weekEarned],
          ["Wallet balance", summary.walletBalance],
          ["Available to withdraw", payouts.availableBalance],
          ["Pending withdrawals", payouts.pendingAmount],
          ["Cash collected", summary.cashInHand],
        ]
      : [];

  return (
    <section className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold">Earnings & settlements</h1>
          <p className="text-secondary mb-0">
            Your completed deliveries, wallet balance, and manual payout
            requests.
          </p>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}
      {loading && <p role="status">Loading earnings...</p>}
      {summary && payouts && (
        <>
          <div
            className="row g-3 mb-4 shadow-sm text-light"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {cards.map(([label, value]) => (
              <div key={label} className="col-12 col-sm-6 col-xl-4">
                <div className="card p-4 h-100">
                  <span className="text-secondary small">{label}</span>
                  <strong className="fs-3 mt-2">{money(value)}</strong>
                </div>
              </div>
            ))}
          </div>

          <div
            className="card p-4 mb-4 shadow-sm text-light"
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 className="h5">Request a payout</h2>
            <p className="text-secondary">
              Requests are reviewed by an administrator. Transfers are manual;
              your wallet is debited only after an administrator records the
              completed transfer.
            </p>
            <form onSubmit={submitRequest} className="row g-3">
              <div className="col-12 col-md-4">
                <label htmlFor="rider-payout-amount" className="form-label">
                  Amount (INR)
                </label>
                <input
                  id="rider-payout-amount"
                  className="form-control"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={payouts.availableBalance}
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              <div className="col-12 col-md-5">
                <label htmlFor="rider-payout-upi" className="form-label">
                  UPI ID for settlement
                </label>
                <input
                  id="rider-payout-upi"
                  className="form-control"
                  type="text"
                  maxLength="200"
                  required
                  placeholder="name@bank"
                  value={payoutDestination}
                  onChange={(event) => setPayoutDestination(event.target.value)}
                />
              </div>
              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={requesting || Number(payouts.availableBalance) <= 0}
                >
                  {requesting ? "Submitting..." : "Request payout"}
                </button>
              </div>
            </form>
            {Number(payouts.availableBalance) <= 0 && (
              <p className="small text-secondary mt-3 mb-0">
                There is no available wallet balance to withdraw.
              </p>
            )}
            {payouts.requests.length > 0 && (
              <div className="table-responsive mt-4">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Requested</th>
                      <th>UPI destination</th>
                      <th className="text-end">Amount</th>
                      <th>Status</th>
                      <th>Admin note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.requests.map((request) => (
                      <tr key={request.id}>
                        <td>
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"}
                        </td>
                        <td>{request.payoutDestination}</td>
                        <td className="text-end">{money(request.amount)}</td>
                        <td>
                          <span
                            className={`badge ${request.status === "PAID" ? "bg-success" : request.status === "REJECTED" ? "bg-danger" : "bg-warning text-dark"}`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td>
                          {request.adminNote || request.paymentReference || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div
        className="card p-4 shadow-sm text-light"
        style={{
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 className="h5">Wallet ledger</h2>
        {transactions.length === 0 ? (
          <p className="text-secondary mb-0">No recorded transactions yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="text-end">Amount</th>
                  <th className="text-end">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td>{tx.reason}</td>
                    <td>{tx.transactionType}</td>
                    <td className="text-end">{money(tx.amount)}</td>
                    <td className="text-end">{money(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
