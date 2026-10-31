import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const JobDetailPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application Form State
  const [applicantName, setApplicantName] = useState(user?.fullName || "");
  const [applicantEmail, setApplicantEmail] = useState(user?.email || "");
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || "");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        // Extract job ID from slug pattern: "title-slug-cp{ID}" or from query param
        const queryJobId = searchParams.get("job_id");
        let jobId = queryJobId;

        if (!jobId && slug) {
          const cpMatch = slug.match(/cp(\d+)/i);
          if (cpMatch) jobId = cpMatch[1];
          const trailingMatch = slug.match(/-(\d+)$/);
          if (!jobId && trailingMatch) jobId = trailingMatch[1];
        }

        if (!jobId) {
          setError("Invalid job link. Please return to the careers page.");
          setLoading(false);
          return;
        }

        const res = await api.get(`/jobs/${jobId}`);
        if (res.success && res.data) {
          setJob(res.data);
        } else {
          setError("Job posting not found.");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        if (err.response?.status === 404) {
          setError("This position has been closed or removed.");
        } else {
          setError("Unable to load job details. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [slug, searchParams]);

  const parseList = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) return text;
    return text
      .split("\n")
      .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
      .filter(Boolean);
  };

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!/^https:\/\//i.test(resumeUrl)) {
      alert("Enter a secure HTTPS link to your resume.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        jobId: job.id,
        applicantName: applicantName.trim(),
        email: applicantEmail.trim(),
        phone: applicantPhone.trim() || null,
        portfolioUrl: portfolioUrl.trim() || null,
        resumeFilename: resumeUrl.trim(),
        coverNote: coverNote.trim() || null,
        experienceYears: experienceYears.trim() || null,
        currentCompany: currentCompany.trim() || null,
      };

      const res = await api.post("/jobs/apply", payload);
      if (res.success) {
        setSubmitted(true);
      } else {
        setSubmitError(res.message || "Failed to submit application.");
      }
    } catch (err) {
      console.error("Application submit error:", err);
      setSubmitError(
        err.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted small mt-2">Loading position details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container py-5 text-center">
        <div className="fs-1 mb-3">🔍</div>
        <h4 className="fw-bold">{error || "Position not found"}</h4>
        <Link to="/careers" className="btn btn-primary rounded-pill px-4 mt-3">
          ← Back to Careers
        </Link>
      </div>
    );
  }

  const responsibilities = parseList(job.responsibilities);
  const requirements = parseList(job.requirements);
  const benefits = parseList(job.benefits);
  const tags = parseTags(job.tags);

  return (
    <div className="container py-4 py-md-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small align-items-center">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none text-muted">
              Home
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/careers" className="text-decoration-none text-muted">
              Careers
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link
              to={`/careers?dept=${encodeURIComponent(job.department)}`}
              className="text-decoration-none text-muted"
            >
              {job.department}
            </Link>
          </li>
          <li
            className="breadcrumb-item active text-dark fw-bold"
            aria-current="page"
          >
            {job.title}
          </li>
        </ol>
      </nav>

      {/* Hero Header Card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white mb-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge bg-primary rounded-pill px-3 py-2 fw-bold">
                {job.department}
              </span>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                {job.employmentType || "Full-time"}
              </span>
              {job.experienceLevel && (
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                  <i className="bi bi-briefcase me-1"></i>
                  {job.experienceLevel}
                </span>
              )}
            </div>

            <h2 className="fw-bold text-dark display-6 mb-2">{job.title}</h2>

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
              <span>
                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                {job.location}
              </span>
              {job.salaryDisplay && (
                <span className="text-success fw-bold">
                  <i className="bi bi-currency-rupee me-1"></i>
                  {job.salaryDisplay}
                </span>
              )}
              <span>
                <i className="bi bi-clock me-1"></i>
                {job.createdAt
                  ? `Posted ${new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Posted Recently"}
              </span>
            </div>

            <p
              className="text-secondary lead small mb-0"
              style={{ maxWidth: 680 }}
            >
              {job.description}
            </p>

            {tags.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="badge bg-light text-secondary border rounded-pill px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
            <a
              href="#apply-form"
              className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-primary) 0%, var(--c-secondary) 100%)",
                borderColor: "var(--c-primary)",
              }}
            >
              Apply for This Position ↓
            </a>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-7">
          {responsibilities.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3">
                Key Responsibilities & Missions
              </h5>
              <ul
                className="text-secondary small ps-3 mb-0"
                style={{ lineHeight: 1.8 }}
              >
                {responsibilities.map((resp, idx) => (
                  <li key={idx} className="mb-2">
                    {resp}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {requirements.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3">What We're Looking For</h5>
              <ul
                className="text-secondary small ps-3 mb-0"
                style={{ lineHeight: 1.8 }}
              >
                {requirements.map((req, idx) => (
                  <li key={idx} className="mb-2">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefits.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3">
                CravePulse Benefits & Compensation
              </h5>
              <div className="row g-3">
                {benefits.map((perk, i) => (
                  <div
                    key={i}
                    className="col-md-6 d-flex align-items-center gap-2 small text-secondary"
                  >
                    <i className="bi bi-patch-check-fill text-success fs-5"></i>
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Application Form */}
        <div className="col-lg-5" id="apply-form">
          <div
            className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white sticky-top"
            style={{ top: 90 }}
          >
            <h5 className="fw-bold text-dark mb-1">Submit Your Application</h5>
            <p className="text-muted small mb-4">
              Fill out your information and provide a link to your resume below
            </p>

            {submitted ? (
              <div className="text-center py-4">
                <div className="fs-1 mb-2">🎉</div>
                <h4 className="fw-bold text-success mb-2">
                  Application Received!
                </h4>
                <p className="text-muted small mb-3">
                  Thank you, {applicantName}. Your profile and resume (
                  <strong>{resumeUrl}</strong>) have been entered into our
                  recruitment pipeline.
                </p>
                <div className="p-3 bg-light rounded-3 small text-muted mb-4">
                  Our talent acquisition team will review your credentials and
                  get back to you at <strong>{applicantEmail}</strong> within 48
                  business hours.
                </div>
                <Link
                  to="/careers"
                  className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold"
                >
                  Browse More Positions
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication}>
                {submitError && (
                  <div className="alert alert-danger small py-2 mb-3">
                    {submitError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Vikram Sharma"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="your.email@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      placeholder="+91 98490 12345"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark">
                      Experience (Years)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 5 Years"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Current Company / Organization
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Infosys, TCS, Freelance"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    LinkedIn / GitHub / Portfolio URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://github.com/..."
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>

                {/* Resume Upload */}
                <div className="mb-3 p-3 rounded-4 bg-light border border-2 border-dashed">
                  <label className="form-label small fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                    <span>Resume / CV link *</span>
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    required
                    placeholder="https://.../resume.pdf"
                  />
                  <small className="text-muted">
                    Share a read-only HTTPS resume link accessible to the
                    recruitment team.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">
                    Why CravePulse? (Cover Note)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Share what excites you about fair food delivery and your key strengths..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--c-primary) 0%, var(--c-secondary) 100%)",
                    borderColor: "var(--c-primary)",
                  }}
                >
                  {submitting
                    ? "Submitting Application..."
                    : "Submit Application →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
