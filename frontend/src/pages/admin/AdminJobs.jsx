import React, { useState, useEffect, useCallback } from "react";
import ModalPortal from "../../components/ModalPortal";
import api from "../../services/api";

const DEPARTMENTS = [
  "Core Platform Engineering",
  "Logistics Intelligence",
  "Restaurant Partnerships",
  "Design Systems",
  "Infrastructure & Cloud",
  "Brand & Communications",
  "Product & Growth",
  "Data Science & Analytics",
  "Quality Assurance",
  "Human Resources",
  "Legal & Compliance",
  "Finance & Accounting",
  "Customer Support",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];

const EXPERIENCE_LEVELS = [
  "Fresher (0-1 Years)",
  "1-2 Years",
  "2-3 Years",
  "3-5 Years",
  "5-8 Years",
  "8-12 Years",
  "12+ Years (Senior Leadership)",
];

const APP_STATUSES = [
  { value: "UNDER_REVIEW", label: "Under Review", color: "info" },
  { value: "SHORTLISTED", label: "Shortlisted", color: "success" },
  {
    value: "INTERVIEW_SCHEDULED",
    label: "Interview Scheduled",
    color: "warning",
  },
  { value: "OFFER_EXTENDED", label: "Offer Extended", color: "primary" },
  { value: "HIRED", label: "Hired", color: "success" },
  { value: "REJECTED", label: "Archived / Rejected", color: "secondary" },
];

const AdminJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("postings");
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(false);
  const [filterJobId, setFilterJobId] = useState(null);
  const [filterAppStatus, setFilterAppStatus] = useState("");

  // ─── Job Form State (comprehensive) ───
  const [showModal, setShowModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({
    title: "",
    department: DEPARTMENTS[0],
    location: "Bengaluru (Hybrid)",
    employmentType: "Full-time",
    experienceLevel: "3-5 Years",
    salaryDisplay: "₹24L - ₹36L + ESOPs",
    salaryMin: "",
    salaryMax: "",
    description: "",
    responsibilities: "",
    requirements: "",
    benefits: "",
    tags: "React, Java, Cloud, MySQL",
    status: "ACTIVE",
  });

  const updateForm = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ─── Fetch Jobs ───
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/jobs");
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Applications ───
  const fetchApplications = useCallback(async () => {
    try {
      setAppLoading(true);
      const params = {};
      if (filterJobId) params.jobId = filterJobId;
      if (filterAppStatus) params.status = filterAppStatus;
      const res = await api.get("/jobs/applications", { params });
      if (res.success && Array.isArray(res.data)) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setAppLoading(false);
    }
  }, [filterJobId, filterAppStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
  }, [activeTab, fetchApplications]);

  // ─── Create / Edit Modal ───
  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setForm({
      title: "",
      department: DEPARTMENTS[0],
      location: "Bengaluru (Hybrid)",
      employmentType: "Full-time",
      experienceLevel: "3-5 Years",
      salaryDisplay: "₹24L - ₹36L + ESOPs",
      salaryMin: "",
      salaryMax: "",
      description: "",
      responsibilities: "",
      requirements: "",
      benefits: "",
      tags: "React, Java, Cloud, MySQL",
      status: "ACTIVE",
    });
    setFormStep(1);
    setShowModal(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title || "",
      department: job.department || DEPARTMENTS[0],
      location: job.location || "",
      employmentType: job.employmentType || "Full-time",
      experienceLevel: job.experienceLevel || "",
      salaryDisplay: job.salaryDisplay || job.salaryRange || "",
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      description: job.description || "",
      responsibilities: job.responsibilities || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      tags: Array.isArray(job.tags) ? job.tags.join(", ") : job.tags || "",
      status: job.status || "ACTIVE",
    });
    setFormStep(1);
    setShowModal(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin
          ? parseFloat(String(form.salaryMin).replace(/[₹,L]/g, ""))
          : null,
        salaryMax: form.salaryMax
          ? parseFloat(String(form.salaryMax).replace(/[₹,L]/g, ""))
          : null,
      };

      if (editingJobId) {
        await api.put(`/jobs/${editingJobId}`, payload);
      } else {
        await api.post("/jobs", payload);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      console.error("Error saving job:", err);
      alert(err.response?.data?.message || "Failed to save job posting.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.put(`/jobs/${jobId}/status`, { status: newStatus });
      fetchJobs();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this job posting? All associated applications will also be removed.",
      )
    )
      return;
    try {
      await api.delete(`/jobs/${jobId}`);
      fetchJobs();
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      await api.post(`/jobs/applications/${appId}/status`, {
        status: newStatus,
      });
      fetchApplications();
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const getAppStatusBadge = (status) => {
    const found = APP_STATUSES.find((s) => s.value === status);
    return found ? found : { label: status, color: "secondary" };
  };

  const activeCount = jobs.filter((j) => j.status === "ACTIVE").length;
  const pausedCount = jobs.filter((j) => j.status === "PAUSED").length;

  return (
    <div className="admin-jobs-container text-white pb-5">
      {/* Header */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="badge rounded-pill bg-info text-dark fw-bold px-3 py-1"
              style={{ fontSize: 10 }}
            >
              RECRUITMENT & TALENT STUDIO
            </span>
          </div>
          <h3 className="fw-bold text-white mb-0">
            Careers & Job Openings Console
          </h3>
          <small className="text-secondary">
            Publish, edit, and manage open positions and candidate applications.
          </small>
        </div>

        <button
          type="button"
          className="btn btn-info rounded-pill px-4 py-2 fw-bold text-dark d-flex align-items-center gap-2 shadow-lg text-nowrap"
          style={{ minHeight: 46 }}
          onClick={handleOpenCreateModal}
        >
          <i className="bi bi-plus-circle-fill fs-5"></i>
          <span>Post New Job Opening</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="p-3 rounded-4"
            style={{
              background: "#0d1525",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-secondary d-block small"
              style={{ fontSize: 11 }}
            >
              TOTAL POSTINGS
            </span>
            <strong className="fs-3 text-white d-block">{jobs.length}</strong>
            <small className="text-info" style={{ fontSize: 11 }}>
              {activeCount} Active • {pausedCount} Paused
            </small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="p-3 rounded-4"
            style={{
              background: "#0d1525",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-secondary d-block small"
              style={{ fontSize: 11 }}
            >
              ACTIVE OPENINGS
            </span>
            <strong className="fs-3 text-success d-block">{activeCount}</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>
              Live on /careers portal
            </small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="p-3 rounded-4"
            style={{
              background: "#0d1525",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-secondary d-block small"
              style={{ fontSize: 11 }}
            >
              TOTAL APPLICATIONS
            </span>
            <strong className="fs-3 text-info d-block">
              {jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0)}
            </strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>
              Across all positions
            </small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="p-3 rounded-4"
            style={{
              background: "#0d1525",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              className="text-secondary d-block small"
              style={{ fontSize: 11 }}
            >
              DEPARTMENTS
            </span>
            <strong className="fs-3 text-warning d-block">
              {new Set(jobs.map((j) => j.department)).size}
            </strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>
              Unique teams hiring
            </small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom border-secondary border-opacity-25 pb-2">
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-4 py-2 fw-bold ${activeTab === "postings" ? "btn-info text-dark shadow" : "btn-outline-secondary text-light"}`}
          onClick={() => setActiveTab("postings")}
        >
          <i className="bi bi-briefcase-fill me-1"></i> Job Postings (
          {jobs.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-4 py-2 fw-bold ${activeTab === "applications" ? "btn-info text-dark shadow" : "btn-outline-secondary text-light"}`}
          onClick={() => setActiveTab("applications")}
        >
          <i className="bi bi-people-fill me-1"></i> Candidate Applications
        </button>
      </div>

      {/* TAB 1: JOB POSTINGS */}
      {activeTab === "postings" && (
        <div className="d-flex flex-column gap-3">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-info" role="status"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 mb-2">📋</div>
              <h5 className="text-white">No job postings yet</h5>
              <p className="text-secondary small">
                Click "Post New Job Opening" to create your first listing.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 rounded-4 shadow-xl text-white"
                style={{
                  background: "#0d1525",
                  border:
                    job.status === "ACTIVE"
                      ? "1.5px solid rgba(56, 189, 248, 0.25)"
                      : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`badge rounded-pill fw-bold px-3 py-1 ${job.status === "ACTIVE" ? "bg-success text-dark" : "bg-secondary text-white"}`}
                        style={{ fontSize: 10 }}
                      >
                        {job.status}
                      </span>
                      <span
                        className="badge rounded-pill bg-dark border border-secondary text-info small"
                        style={{ fontSize: 10 }}
                      >
                        {job.department}
                      </span>
                      <span className="text-secondary small">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {job.location}
                      </span>
                      <span className="text-secondary small d-none d-sm-inline">
                        • {job.employmentType || "Full-time"}
                      </span>
                      {job.experienceLevel && (
                        <span className="text-secondary small d-none d-md-inline">
                          • {job.experienceLevel}
                        </span>
                      )}
                    </div>
                    <h5 className="fw-bold text-white mb-1">{job.title}</h5>
                    <p
                      className="text-secondary small mb-2"
                      style={{ maxWidth: 840 }}
                    >
                      {job.description}
                    </p>
                    <div className="d-flex flex-wrap gap-1">
                      {parseTags(job.tags).map((t, i) => (
                        <span
                          key={i}
                          className="badge bg-dark border border-secondary border-opacity-50 text-light small"
                          style={{ fontSize: 10 }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-md-end ps-md-3 flex-shrink-0">
                    <span className="fs-5 fw-bold text-success d-block mb-1">
                      {job.salaryDisplay || job.salaryRange || "—"}
                    </span>
                    <span className="badge bg-dark border border-info text-info small mb-3 d-inline-block">
                      {job.applicantsCount || 0} Candidates Applied
                    </span>
                    <div className="d-flex align-items-center gap-2 justify-content-md-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold"
                        onClick={() => handleToggleStatus(job.id, job.status)}
                      >
                        {job.status === "ACTIVE" ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold"
                        onClick={() => handleOpenEditModal(job)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill px-2"
                        title="Delete"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATE APPLICATIONS */}
      {activeTab === "applications" && (
        <div>
          {/* Filters */}
          <div className="d-flex flex-wrap gap-2 mb-4">
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill"
              style={{ width: 220 }}
              value={filterJobId || ""}
              onChange={(e) => setFilterJobId(e.target.value || null)}
            >
              <option value="">All Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill"
              style={{ width: 180 }}
              value={filterAppStatus}
              onChange={(e) => setFilterAppStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {APP_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm btn-outline-info rounded-pill px-3"
              onClick={fetchApplications}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {appLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-info" role="status"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-5">
                <div className="fs-1 mb-2">📬</div>
                <h5 className="text-white">No applications found</h5>
                <p className="text-secondary small">
                  Applications will appear here when candidates apply from the
                  careers portal.
                </p>
              </div>
            ) : (
              applications.map((app) => {
                const badge = getAppStatusBadge(app.status);
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-4 text-white"
                    style={{
                      background: "#0d1525",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <span className="font-monospace small text-secondary">
                            APP-{app.id}
                          </span>
                          <span
                            className={`badge rounded-pill bg-${badge.color} ${badge.color === "warning" || badge.color === "info" ? "text-dark" : "text-white"} fw-bold px-3 py-1`}
                            style={{ fontSize: 10 }}
                          >
                            {badge.label}
                          </span>
                          {app.appliedAt && (
                            <span
                              className="badge rounded-pill bg-dark border border-secondary text-light small"
                              style={{ fontSize: 10 }}
                            >
                              {new Date(app.appliedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          )}
                        </div>
                        <h5 className="fw-bold text-white mb-0">
                          {app.applicantName}
                        </h5>
                        <div className="small text-info fw-semibold mb-2">
                          Applied for: {app.jobTitle || `Job #${app.jobId}`}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary mb-2">
                          <span>
                            <i className="bi bi-envelope text-light me-1"></i>
                            {app.email}
                          </span>
                          {app.phone && (
                            <span>
                              <i className="bi bi-telephone text-light me-1"></i>
                              {app.phone}
                            </span>
                          )}
                          {app.experienceYears && (
                            <span>
                              <i className="bi bi-award text-warning me-1"></i>
                              {app.experienceYears}
                            </span>
                          )}
                          {app.currentCompany && (
                            <span>
                              <i className="bi bi-building text-info me-1"></i>
                              {app.currentCompany}
                            </span>
                          )}
                        </div>
                        {app.portfolioUrl && (
                          <div className="small mb-1">
                            <a
                              href={app.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-info text-decoration-none"
                            >
                              <i className="bi bi-link-45deg me-1"></i>
                              {app.portfolioUrl}
                            </a>
                          </div>
                        )}
                        {app.coverNote && (
                          <p className="text-secondary small fst-italic mb-0">
                            "{app.coverNote}"
                          </p>
                        )}
                        {app.resumeFilename && (
                          <div className="mt-2">
                            <span className="badge bg-dark border border-secondary text-light small">
                              <i className="bi bi-file-earmark-pdf text-danger me-1"></i>
                              {app.resumeFilename}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-md-end flex-shrink-0">
                        <div className="d-flex align-items-center gap-1 justify-content-md-end">
                          <small
                            className="text-secondary"
                            style={{ fontSize: 11 }}
                          >
                            Update Status:
                          </small>
                          <select
                            className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill"
                            style={{ width: 190, fontSize: 11 }}
                            value={app.status}
                            onChange={(e) =>
                              handleUpdateAppStatus(app.id, e.target.value)
                            }
                          >
                            {APP_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* POST / EDIT MODAL — Production-Grade Multi-Step Form */}
      {showModal && (
        <ModalPortal isOpen={showModal}>
          <div
            className="cravepulse-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 860 }}>
              <div
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{
                  background: "#0f172a",
                  border: "1.5px solid rgba(56, 189, 248, 0.35)",
                }}
              >
                {/* Modal Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">💼</span>
                    <div>
                      <h5 className="fw-bold mb-0 text-white">
                        {editingJobId
                          ? "Edit Job Posting"
                          : "Create New Job Opening"}
                      </h5>
                      <small className="text-secondary">
                        Step {formStep} of 3 —{" "}
                        {formStep === 1
                          ? "Basic Details"
                          : formStep === 2
                            ? "Description & Requirements"
                            : "Tags & Review"}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                {/* Step Progress */}
                <div className="d-flex gap-2 mb-4">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className="flex-fill rounded-pill"
                      style={{
                        height: 4,
                        background:
                          formStep >= step
                            ? "#38bdf8"
                            : "rgba(255,255,255,0.1)",
                      }}
                    ></div>
                  ))}
                </div>

                <form onSubmit={handleSaveJob}>
                  {/* STEP 1: Basic Details */}
                  {formStep === 1 && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Job Role Title *
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-lg bg-dark text-white border-secondary"
                          required
                          placeholder="e.g. Staff Full Stack Engineer (React + Java)"
                          value={form.title}
                          onChange={(e) => updateForm("title", e.target.value)}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-light">
                          Department / Team *
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={form.department}
                          onChange={(e) =>
                            updateForm("department", e.target.value)
                          }
                        >
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-light">
                          Work Location *
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          required
                          placeholder="e.g. Bengaluru (Hybrid) / Remote (India)"
                          value={form.location}
                          onChange={(e) =>
                            updateForm("location", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-light">
                          Employment Type *
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={form.employmentType}
                          onChange={(e) =>
                            updateForm("employmentType", e.target.value)
                          }
                        >
                          {EMPLOYMENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-light">
                          Experience Required
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={form.experienceLevel}
                          onChange={(e) =>
                            updateForm("experienceLevel", e.target.value)
                          }
                        >
                          <option value="">Not specified</option>
                          {EXPERIENCE_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-light">
                          Posting Status
                        </label>
                        <select
                          className="form-select bg-dark text-white border-secondary"
                          value={form.status}
                          onChange={(e) => updateForm("status", e.target.value)}
                        >
                          <option value="ACTIVE">
                            Active (Live on careers page)
                          </option>
                          <option value="DRAFT">Draft (Hidden)</option>
                          <option value="PAUSED">Paused</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Compensation / Salary Range Display *
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          required
                          placeholder="e.g. ₹28,00,000 - ₹42,00,000 + ESOPs"
                          value={form.salaryDisplay}
                          onChange={(e) =>
                            updateForm("salaryDisplay", e.target.value)
                          }
                        />
                        <small
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          This text is shown directly on the job card and detail
                          page
                        </small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-light">
                          Min Annual CTC (Numeric, in Lakhs)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="e.g. 28"
                          value={form.salaryMin}
                          onChange={(e) =>
                            updateForm("salaryMin", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-light">
                          Max Annual CTC (Numeric, in Lakhs)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="e.g. 42"
                          value={form.salaryMax}
                          onChange={(e) =>
                            updateForm("salaryMax", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Description, Responsibilities, Requirements, Benefits */}
                  {formStep === 2 && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Role Summary & Mission *
                        </label>
                        <textarea
                          className="form-control bg-dark text-white border-secondary"
                          rows="4"
                          required
                          placeholder="Detail the role's core mission, team mandate, and expected impact on the organization..."
                          value={form.description}
                          onChange={(e) =>
                            updateForm("description", e.target.value)
                          }
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Key Responsibilities (one per line)
                        </label>
                        <textarea
                          className="form-control font-monospace small bg-dark text-white border-secondary"
                          rows="5"
                          placeholder={
                            "Architect and scale high-throughput Jakarta Servlets\nBuild responsive, accessible React components\nImplement database locking and idempotency patterns\nCollaborate with product and design teams"
                          }
                          value={form.responsibilities}
                          onChange={(e) =>
                            updateForm("responsibilities", e.target.value)
                          }
                        ></textarea>
                        <small
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          Enter each responsibility on a new line
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Requirements & Qualifications (one per line)
                        </label>
                        <textarea
                          className="form-control font-monospace small bg-dark text-white border-secondary"
                          rows="5"
                          placeholder={
                            "5+ years hands-on experience in Java or React\nStrong proficiency in relational databases & indexing\nExperience with WebSocket/SSE real-time protocols\nExcellent communication and problem-solving skills"
                          }
                          value={form.requirements}
                          onChange={(e) =>
                            updateForm("requirements", e.target.value)
                          }
                        ></textarea>
                        <small
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          Enter each requirement on a new line
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-bold text-light">
                          Perks & Benefits (one per line)
                        </label>
                        <textarea
                          className="form-control font-monospace small bg-dark text-white border-secondary"
                          rows="4"
                          placeholder={
                            "100% Cashless Medical Insurance for family\nDirect Equity (ESOPs) with 4-year vesting\nApple Silicon MacBook Pro + workstation\n₹15,000 monthly CravePulse dining credit"
                          }
                          value={form.benefits}
                          onChange={(e) =>
                            updateForm("benefits", e.target.value)
                          }
                        ></textarea>
                        <small
                          className="text-secondary"
                          style={{ fontSize: 11 }}
                        >
                          Enter each benefit on a new line
                        </small>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Tags & Review */}
                  {formStep === 3 && (
                    <div>
                      <div className="mb-4">
                        <label className="form-label small fw-bold text-light">
                          Tech Stack & Skill Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          className="form-control bg-dark text-white border-secondary"
                          placeholder="React 18, Java 17, MySQL, WebSockets, Kubernetes"
                          value={form.tags}
                          onChange={(e) => updateForm("tags", e.target.value)}
                        />
                        {form.tags && (
                          <div className="d-flex flex-wrap gap-1 mt-2">
                            {form.tags.split(",").map(
                              (t, i) =>
                                t.trim() && (
                                  <span
                                    key={i}
                                    className="badge bg-info bg-opacity-25 text-info border border-info small"
                                  >
                                    {t.trim()}
                                  </span>
                                ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* Preview Summary Card */}
                      <div
                        className="p-4 rounded-4 mb-3"
                        style={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <h6 className="fw-bold text-info mb-3">
                          <i className="bi bi-eye me-2"></i>Preview Summary
                        </h6>
                        <div className="row g-3 small">
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Title
                            </span>
                            <strong className="text-white">
                              {form.title || "—"}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Department
                            </span>
                            <strong className="text-white">
                              {form.department}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Location
                            </span>
                            <strong className="text-white">
                              {form.location || "—"}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">Type</span>
                            <strong className="text-white">
                              {form.employmentType}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Experience
                            </span>
                            <strong className="text-white">
                              {form.experienceLevel || "—"}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Compensation
                            </span>
                            <strong className="text-success">
                              {form.salaryDisplay || "—"}
                            </strong>
                          </div>
                          <div className="col-6">
                            <span className="text-secondary d-block">
                              Status
                            </span>
                            <strong
                              className={`text-${form.status === "ACTIVE" ? "success" : "warning"}`}
                            >
                              {form.status}
                            </strong>
                          </div>
                          <div className="col-12">
                            <span className="text-secondary d-block">
                              Description
                            </span>
                            <span className="text-light">
                              {form.description
                                ? form.description.substring(0, 200) + "..."
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25">
                    <div>
                      {formStep > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary rounded-pill px-4"
                          onClick={() => setFormStep(formStep - 1)}
                        >
                          ← Previous
                        </button>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                      {formStep < 3 ? (
                        <button
                          type="button"
                          className="btn btn-info rounded-pill px-5 fw-bold text-dark"
                          onClick={() => {
                            if (formStep === 1 && !form.title.trim()) {
                              alert("Job title is required");
                              return;
                            }
                            if (formStep === 1 && !form.location.trim()) {
                              alert("Location is required");
                              return;
                            }
                            setFormStep(formStep + 1);
                          }}
                        >
                          Next Step →
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="btn btn-info rounded-pill px-5 fw-bold text-dark shadow"
                          disabled={saving}
                        >
                          {saving
                            ? "Publishing..."
                            : editingJobId
                              ? "Save Changes"
                              : "Publish Opening Live"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default AdminJobs;
