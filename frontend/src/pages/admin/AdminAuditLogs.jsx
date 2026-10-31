import React, { useState, useEffect } from "react";
import api from "../../services/api";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit-logs?limit=100");
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Error fetching audit logs", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCsv = async (type) => {
    try {
      const data = await api.get("/admin/export", {
        params: { type },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cravepulse_${type}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      window.alert(err.message || "Export failed");
    }
  };

  const getActionBadgeClass = (action) => {
    if (action.includes("APPROVE")) return "bg-success text-dark fw-bold";
    if (
      action.includes("REJECT") ||
      action.includes("REVOKE") ||
      action.includes("SUSPEND") ||
      action.includes("DELETE")
    )
      return "bg-danger";
    if (action.includes("CREATE")) return "bg-info text-dark fw-bold";
    if (action.includes("UPDATE")) return "bg-primary";
    return "bg-secondary";
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">
            Operations Audit Trail & Compliance Export
          </h4>
          <p className="text-muted small mb-0">
            Immutable record of administrative actions, compliance decisions,
            and direct CSV data exports.
          </p>
        </div>

        {/* CSV Export Button Strip */}
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-sm btn-outline-info rounded-pill px-3"
            onClick={() => handleExportCsv("orders")}
          >
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Orders CSV
          </button>
          <button
            className="btn btn-sm btn-outline-info rounded-pill px-3"
            onClick={() => handleExportCsv("users")}
          >
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Users CSV
          </button>
          <button
            className="btn btn-sm btn-outline-info rounded-pill px-3"
            onClick={() => handleExportCsv("disputes")}
          >
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Disputes CSV
          </button>
          <button
            className="btn btn-sm btn-outline-warning rounded-pill px-3"
            onClick={() => handleExportCsv("audit-logs")}
          >
            <i className="bi bi-download me-1"></i> Audit Trail CSV
          </button>
          <button
            className="btn btn-sm btn-outline-secondary rounded-pill px-3"
            onClick={fetchLogs}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      <div
        className="card border-0 rounded-4 shadow-sm p-4 text-white"
        style={{ background: "#162032", border: "1px solid #1f293d" }}
      >
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status"></div>
            <p className="text-muted small mt-2">Loading audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5">
            <div className="fs-1 text-muted mb-2">
              <i className="bi bi-shield-check"></i>
            </div>
            <h6 className="fw-bold">No Audit Log Entries</h6>
            <p className="text-muted small">
              Administrative actions will automatically generate immutable audit
              entries here.
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
                  <th>Timestamp</th>
                  <th>Admin Operator</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Audit Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody className="small">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-muted text-nowrap">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "--"}
                    </td>
                    <td className="fw-bold text-white">
                      {log.adminName}{" "}
                      <small className="text-muted d-block">
                        UID: #{log.adminUserId}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-2 py-1 ${getActionBadgeClass(log.action)}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-info">
                        {log.targetType} #{log.targetId}
                      </span>
                    </td>
                    <td className="text-secondary" style={{ maxWidth: 350 }}>
                      {log.details}
                    </td>
                    <td className="text-muted font-monospace small">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
