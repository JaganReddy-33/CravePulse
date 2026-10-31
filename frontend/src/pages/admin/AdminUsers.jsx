import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToSet, setStatusToSet] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (roleFilter !== "ALL") params.role = roleFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;
      params.limit = 100;

      const res = await api.get("/admin/users", { params });
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter, statusFilter]);

  const handleOpenStatusModal = (user, newStatus) => {
    setSelectedUser(user);
    setStatusToSet(newStatus);
    setActionReason(
      newStatus === "SUSPENDED"
        ? "Terms of service violation"
        : "Account reviewed and restored",
    );
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/admin/users/${selectedUser.id}/status`, {
        status: statusToSet,
        reason: actionReason || "Admin operations moderation",
      });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, status: statusToSet } : u,
          ),
        );
        setShowStatusModal(false);
        setSelectedUser(null);
      }
    } catch (e) {
      alert(e.message || "Error updating user status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncrementFraudFlag = async (userId) => {
    if (
      !window.confirm(
        "Increment fraud risk flag counter for this user? This will prevent instant dispute auto-refunds.",
      )
    )
      return;
    try {
      const res = await api.post(`/admin/users/${userId}/fraud-flag`, {
        reason: "Flagged by ops supervisor for suspicious claims",
      });
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, fraudFlagCount: res.data.fraudFlagCount }
              : u,
          ),
        );
      }
    } catch (e) {
      alert(e.message || "Error flagging user");
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">
            Platform User Directory
          </h4>
          <p className="text-muted small mb-0">
            Manage customer accounts, partner merchants, riders, and account
            moderation.
          </p>
        </div>
        <button
          className="btn btn-outline-info rounded-pill px-3 btn-sm"
          onClick={fetchUsers}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Directory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card border-0 rounded-4 shadow-sm p-3 mb-4 text-white"
        style={{ background: "#162032", border: "1px solid #1f293d" }}
      >
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-dark border-secondary text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white"
                placeholder="Search by name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-dark border-secondary text-muted"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="RESTAURANT_OWNER">Restaurant Owner</option>
              <option value="RIDER">Delivery Rider</option>
              <option value="ADMIN">Platform Admin</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-dark border-secondary text-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_KYC">Pending KYC</option>
            </select>
          </div>

          <div className="col-12 col-md-1 text-end">
            <span className="badge bg-secondary rounded-pill px-3 py-2">
              {users.length} Users
            </span>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div
        className="card border-0 rounded-4 shadow-sm p-4 text-white"
        style={{ background: "#162032", border: "1px solid #1f293d" }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status"></div>
            <p className="text-muted small mt-2">Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5">
            <div className="fs-1 text-muted mb-2">
              <i className="bi bi-people"></i>
            </div>
            <h6 className="fw-bold">No Users Found</h6>
            <p className="text-muted small">
              No accounts match the current search filters.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table
              className="table table-dark table-hover align-middle mb-0"
              style={{ background: "#162032" }}
            >
              <thead className="small text-muted border-secondary">
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Wallet</th>
                  <th>Fraud Flags</th>
                  <th className="text-end">Moderation</th>
                </tr>
              </thead>
              <tbody className="small">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={
                            u.avatarUrl ||
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                          }
                          alt={u.fullName}
                          className="rounded-circle"
                          style={{ width: 36, height: 36, objectFit: "cover" }}
                        />
                        <div>
                          <div className="fw-bold text-white">{u.fullName}</div>
                          <small className="text-muted">UID: #{u.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      <small className="text-muted">{u.phone}</small>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === "ADMIN"
                            ? "bg-danger"
                            : u.role === "RESTAURANT_OWNER"
                              ? "bg-primary"
                              : u.role === "RIDER"
                                ? "bg-warning text-dark"
                                : "bg-info text-dark"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.status === "ACTIVE"
                            ? "bg-success"
                            : u.status === "SUSPENDED"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="fw-bold">
                      ₹{Number(u.walletBalance || 0).toFixed(2)}
                    </td>
                    <td>
                      {u.fraudFlagCount > 0 ? (
                        <span className="badge bg-danger rounded-pill px-2">
                          <i className="bi bi-shield-exclamation me-1"></i>{" "}
                          {u.fraudFlagCount} flags
                        </span>
                      ) : (
                        <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2">
                          0 flags
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-warning rounded-pill px-2 py-1"
                          title="Increment Fraud Risk Flag"
                          onClick={() => handleIncrementFraudFlag(u.id)}
                        >
                          <i className="bi bi-flag"></i>
                        </button>
                        {u.status === "SUSPENDED" ? (
                          <button
                            className="btn btn-sm btn-success rounded-pill px-3 text-dark fw-bold"
                            onClick={() => handleOpenStatusModal(u, "ACTIVE")}
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            onClick={() =>
                              handleOpenStatusModal(u, "SUSPENDED")
                            }
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {showStatusModal && selectedUser && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content border-0 rounded-4 p-3 text-white"
              style={{ background: "#162032", border: "1px solid #1f293d" }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {statusToSet === "SUSPENDED"
                    ? "⚠️ Suspend User Account"
                    : "✅ Re-activate User Account"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowStatusModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted small">
                  You are about to set account status to{" "}
                  <strong>{statusToSet}</strong> for{" "}
                  <strong>{selectedUser.fullName}</strong> ({selectedUser.email}
                  ).
                  {statusToSet === "SUSPENDED" &&
                    " The user will immediately be locked out from signing in or placing orders."}
                </p>
                <div className="mb-3">
                  <label className="form-label small fw-bold">
                    Audit Reason / Justification
                  </label>
                  <textarea
                    className="form-control bg-dark border-secondary text-white"
                    rows="3"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter reason for audit logs..."
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-3"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn rounded-pill px-4 fw-bold ${statusToSet === "SUSPENDED" ? "btn-danger" : "btn-success text-dark"}`}
                  disabled={submitting}
                  onClick={handleConfirmStatusChange}
                >
                  {submitting ? "Applying..." : `Confirm ${statusToSet}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
