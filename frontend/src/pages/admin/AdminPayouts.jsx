import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const money = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value || 0),
  );

export default function AdminPayouts() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [references, setReferences] = useState({});
  const [notes, setNotes] = useState({});
  const [confirmations, setConfirmations] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/admin/payout-requests?status=${statusFilter}`,
      );
      if (!response.success || !Array.isArray(response.data))
        throw new Error("Unable to load payout requests");
      setRequests(response.data);
    } catch (err) {
      setError(err.message || "Unable to load payout requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const process = async (request, status) => {
    setProcessingId(request.id);
    setError("");
    setSuccess("");
    try {
      const paymentReference = references[request.id]?.trim() || "";
      if (
        status === "PAID" &&
        (!paymentReference || !confirmations[request.id])
      ) {
        throw new Error(
          "Record the transfer reference and confirm that the external transfer has completed.",
        );
      }
      const response = await api.post(
        `/admin/payout-requests/${request.id}/process`,
        {
          status,
          paymentReference,
          adminNote: notes[request.id] || "",
          transferConfirmed:
            status === "PAID" && Boolean(confirmations[request.id]),
        },
      );
      if (!response.success)
        throw new Error("Unable to process payout request");
      setSuccess(`Payout request #${request.id} was ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err.message || "Unable to process payout request");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold">Payout review</h1>
          <p className="text-secondary mb-0">
            Review rider and restaurant payout requests. No transfer is
            initiated by this portal.
          </p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            aria-label="Filter payout requests"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {["PENDING", "PAID", "REJECTED"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            className="btn btn-outline-primary"
            onClick={load}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="alert alert-success">
          {success}
        </div>
      )}
      {loading ? (
        <p role="status">Loading payout requests...</p>
      ) : requests.length === 0 ? (
        <div className="card p-4">
          <p className="text-secondary mb-0">
            No {statusFilter.toLowerCase()} payout requests.
          </p>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {requests.map((request) => (
            <article key={request.id} className="card p-4">
              <div className="d-flex flex-wrap justify-content-between gap-3">
                <div>
                  <h2 className="h5 mb-1">
                    {request.restaurantName || request.accountOwnerName}
                  </h2>
                  <p className="small text-secondary mb-2">
                    Request #{request.id} · {request.accountType} ·{" "}
                    {request.accountOwnerEmail}
                  </p>
                </div>
                <div className="text-end">
                  <strong className="fs-4">{money(request.amount)}</strong>
                  <div>
                    <span
                      className={`badge ${request.status === "PAID" ? "bg-success" : request.status === "REJECTED" ? "bg-danger" : "bg-warning text-dark"}`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              </div>
              <dl className="row mb-3">
                <dt className="col-sm-3">UPI destination</dt>
                <dd className="col-sm-9 font-monospace">
                  {request.payoutDestination}
                </dd>
                <dt className="col-sm-3">Requested</dt>
                <dd className="col-sm-9">
                  {request.createdAt
                    ? new Date(request.createdAt).toLocaleString("en-IN")
                    : "—"}
                </dd>
                {request.paymentReference && (
                  <>
                    <dt className="col-sm-3">Transfer reference</dt>
                    <dd className="col-sm-9">{request.paymentReference}</dd>
                  </>
                )}
                {request.adminNote && (
                  <>
                    <dt className="col-sm-3">Admin note</dt>
                    <dd className="col-sm-9">{request.adminNote}</dd>
                  </>
                )}
              </dl>
              {request.status === "PENDING" && (
                <div className="border-top pt-3">
                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label
                        htmlFor={`payout-reference-${request.id}`}
                        className="form-label"
                      >
                        Transfer reference (required to mark paid)
                      </label>
                      <input
                        id={`payout-reference-${request.id}`}
                        className="form-control"
                        maxLength="120"
                        value={references[request.id] || ""}
                        onChange={(event) =>
                          setReferences((previous) => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="col-12 col-md-8">
                      <label
                        htmlFor={`payout-note-${request.id}`}
                        className="form-label"
                      >
                        Admin note
                      </label>
                      <input
                        id={`payout-note-${request.id}`}
                        className="form-control"
                        maxLength="1000"
                        value={notes[request.id] || ""}
                        onChange={(event) =>
                          setNotes((previous) => ({
                            ...previous,
                            [request.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="form-check mt-3">
                    <input
                      id={`payout-confirm-${request.id}`}
                      className="form-check-input"
                      type="checkbox"
                      checked={Boolean(confirmations[request.id])}
                      onChange={(event) =>
                        setConfirmations((previous) => ({
                          ...previous,
                          [request.id]: event.target.checked,
                        }))
                      }
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`payout-confirm-${request.id}`}
                    >
                      I have completed the external UPI transfer and verified
                      the reference.
                    </label>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => process(request, "PAID")}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? "Saving..." : "Mark paid"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => process(request, "REJECTED")}
                      disabled={processingId === request.id}
                    >
                      Reject request
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
