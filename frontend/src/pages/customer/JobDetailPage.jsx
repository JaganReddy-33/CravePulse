import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_JOBS = [
  {
    id: 1,
    title: 'Staff Full Stack Engineer (React + Java + WebSockets)',
    team: 'Core Platform Engineering',
    location: 'Bengaluru / Hyderabad (Hybrid)',
    type: 'Full-time',
    experience: '5+ Years',
    salaryRange: '₹32,00,000 - ₹48,00,000 + ESOPs',
    description: 'Architect low-latency event-driven microservices powering real-time dispatch telemetry, 0% menu parity verifiers, and WebSocket live tracking.',
    responsibilities: [
      'Design and scale high-throughput Jakarta Servlets and WebSocket endpoints handling 50k+ concurrent delivery events.',
      'Build responsive, accessible, mobile-first React components with smooth micro-animations and zero layout shift.',
      'Implement pessimistic database row-locking and idempotency keys to eliminate double-dispatch race conditions.',
      'Collaborate closely with founder Jaganmohan Reddy and engineering leadership to ship core platform features.'
    ],
    requirements: [
      'Strong proficiency in modern Java (17+), JDBC, connection pooling, and relational database modeling (MySQL/PostgreSQL).',
      'Extensive experience with modern React 18, state management, Vite, and WebSocket protocols.',
      'Hands-on experience optimizing frontend rendering performance across mobile and desktop viewports.',
      'Passionate about building transparent, anti-monopoly fair technology for Indian consumers and riders.'
    ],
    perks: [
      'Comprehensive 100% cashless medical coverage for employee and parents.',
      'Meaningful equity grant (ESOPs) with transparent 4-year vesting schedule.',
      'Apple Silicon MacBook Pro M3 Max and 4K display home workstation setup.',
      '₹15,000 monthly CravePulse gourmet dining credit across all partner restaurants.'
    ]
  },
  {
    id: 2,
    title: 'Fleet Operations & Dispatch Algorithm Lead',
    team: 'Logistics Intelligence',
    location: 'Bengaluru / Mumbai',
    type: 'Full-time',
    experience: '4+ Years',
    salaryRange: '₹26,00,000 - ₹38,00,000 + ESOPs',
    description: 'Optimize rider fair-pay protocols, geo-fenced batching, and wait-time compensation engines across metro hubs.',
    responsibilities: [
      'Refine Haversine spatial routing algorithms to optimize order assignment within a 2.5 km radius.',
      'Maintain the Rider Wait-Time Compensation Meter and guarantee 100% tip pass-through to delivery partners.',
      'Analyze fleet telemetry, drop-off cluster density, and order fulfillment SLAs across 8 Indian metros.',
      'Work directly with Fleet Captain Prasad Rao and city logistics teams to improve rider safety and welfare.'
    ],
    requirements: [
      'Demonstrated experience in hyper-local logistics, routing heuristics, or fleet dispatch systems.',
      'Proficiency in SQL data pipelines, geospatial analysis, and real-time operational metrics.',
      'Strong empathy for gig delivery workers and a dedication to fair compensation standards.',
      'Proven track record scaling operations in high-growth Indian consumer tech companies.'
    ],
    perks: [
      '100% family health coverage and emergency accidental rider welfare backing.',
      'Generous quarterly performance bonuses tied to fleet retention and earnings fairness.',
      'Flexible hybrid schedule with travel allowances for city logistics hubs.',
      '₹15,000 monthly CravePulse food allowance.'
    ]
  },
  {
    id: 3,
    title: 'Culinary Partner Success Manager',
    team: 'Restaurant Partnerships',
    location: 'Delhi-NCR / Chennai',
    type: 'Full-time',
    experience: '3+ Years',
    salaryRange: '₹18,00,000 - ₹26,00,000 + Incentives',
    description: 'Partner with top culinary institutions and artisanal cloud kitchens to ensure transparent 0% markup menu parity.',
    responsibilities: [
      'Onboard premium restaurants and iconic culinary heritage kitchens across Delhi-NCR and Chennai.',
      'Conduct regular menu price parity audits ensuring printed dine-in menu prices equal platform delivery prices.',
      'Train restaurant owners and head chefs (like Chef Lohith and Chef Ajay Kumar) on the FoodAnalytics Dashboard and Kitchen Kanban.',
      'Resolve restaurant payout discrepancies and optimize order preparation batching times.'
    ],
    requirements: [
      'Background in F&B management, hospitality consulting, or restaurant aggregator partnerships.',
      'Exceptional interpersonal communication and relationship management skills.',
      'Deep understanding of food unit economics, kitchen prep workflows, and packaging integrity.',
      'Self-driven with a passion for supporting local, independent restaurateurs.'
    ],
    perks: [
      'Competitive base pay with uncapped partner acquisition incentives.',
      'Extensive dining reimbursement for restaurant tasting audits and partner visits.',
      'Comprehensive medical insurance and wellness stipends.',
      'Annual executive retreat and leadership development mentorship.'
    ]
  },
  {
    id: 4,
    title: 'Lead Product Designer (UI/UX Systems)',
    team: 'Design Systems',
    location: 'Remote (India)',
    type: 'Full-time',
    experience: '5+ Years',
    salaryRange: '₹28,00,000 - ₹42,00,000 + ESOPs',
    description: 'Craft beautiful, accessible mobile-first interfaces, customer checkout flows, and high-contrast kitchen tablet terminals for restaurant chefs.',
    responsibilities: [
      'Own the complete CravePulse multi-portal design system across Customer, Partner, Rider, and Admin surfaces.',
      'Design responsive, ergonomic layouts that look breathtaking on phones, tablets, laptops, and ultra-wide monitors.',
      'Conduct user research sessions with consumers, delivery riders, and kitchen staff to streamline navigation friction.',
      'Collaborate with frontend engineers to ensure pixel-perfect CSS execution and micro-animation fidelity.'
    ],
    requirements: [
      'Extensive portfolio demonstrating mastery in consumer mobile apps and complex SaaS dashboards.',
      'Strong grasp of typography, color harmony, dark mode design tokens, and accessibility standards.',
      'Proficiency in Figma design tokens, interactive prototyping, and handoff specifications.',
      'Passion for craft, micro-interactions, and creating products that feel distinctly premium and honest.'
    ],
    perks: [
      'Fully remote flexibility with co-working space reimbursement anywhere in India.',
      'Top-of-the-line design workstation setup (Apple Silicon + Studio Display).',
      'Comprehensive health coverage for you and your dependents.',
      'Annual learning budget for international design conferences and typography subscriptions.'
    ]
  }
];

const JobDetailPage = () => {
  const { id, slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Application Form State
  const [applicantName, setApplicantName] = useState(user?.fullName || '');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(user?.phone || '');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [coverNote, setCoverNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cravepulse_careers_jobs');
    const allJobs = saved ? JSON.parse(saved) : DEFAULT_JOBS;
    
    // Check job_id query param, then slug or id parameter
    const queryJobId = searchParams.get('job_id');
    const rawIdentifier = queryJobId || slug || id || '1';
    
    // Extract numeric ID from patterns like: "1", "1-staff-full-stack", "staff-full-stack-cp1", "-1"
    let parsedId = null;
    if (!isNaN(Number(rawIdentifier))) {
      parsedId = Number(rawIdentifier);
    } else if (/^(\d+)/.test(rawIdentifier)) {
      parsedId = Number(rawIdentifier.match(/^(\d+)/)[1]);
    } else if (/-(\d+)$/.test(rawIdentifier)) {
      parsedId = Number(rawIdentifier.match(/-(\d+)$/)[1]);
    } else if (/cp(\d+)/i.test(rawIdentifier)) {
      parsedId = Number(rawIdentifier.match(/cp(\d+)/i)[1]);
    }

    const found = allJobs.find(j => 
      (parsedId !== null && Number(j.id) === parsedId) ||
      (j.title && j.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(String(rawIdentifier).toLowerCase()))
    );

    if (found) {
      setJob(found);
    } else {
      setJob(allJobs[0]);
    }
    setLoading(false);
  }, [id, slug, searchParams]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller PDF or Word document.');
        e.target.value = null;
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmitApplication = (e) => {
    e.preventDefault();
    if (!resumeFile) {
      alert('Please upload your Resume / CV (PDF or DOCX format) to proceed with your application.');
      return;
    }

    setSubmitting(true);

    const applicationRecord = {
      id: Date.now(),
      jobId: job.id,
      jobTitle: job.title,
      name: applicantName,
      email: applicantEmail,
      phone: applicantPhone,
      portfolio: portfolioUrl,
      resumeFileName: resumeFile.name,
      resumeFileSize: (resumeFile.size / 1024).toFixed(1) + ' KB',
      note: coverNote,
      appliedAt: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('cravepulse_job_applications') || '[]');
    localStorage.setItem('cravepulse_job_applications', JSON.stringify([applicationRecord, ...existing]));

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  if (loading || !job) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted small mt-2">Loading position details...</p>
      </div>
    );
  }

  return (
    <div className="container py-4 py-md-5">
      {/* Breadcrumb Navigation - Production Canonical Structure */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb small align-items-center">
          <li className="breadcrumb-item"><Link to="/" className="text-decoration-none text-muted">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/careers" className="text-decoration-none text-muted">Careers</Link></li>
          <li className="breadcrumb-item"><Link to={`/careers?dept=${encodeURIComponent(job.team)}`} className="text-decoration-none text-muted">{job.team}</Link></li>
          <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">{job.title}</li>
        </ol>
      </nav>

      {/* Hero Header Card */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white mb-4 position-relative overflow-hidden">
        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge bg-primary rounded-pill px-3 py-2 fw-bold">{job.team}</span>
              <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">{job.type}</span>
              {job.experience && (
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill small">
                  <i className="bi bi-briefcase me-1"></i>{job.experience}
                </span>
              )}
            </div>

            <h2 className="fw-extrabold text-dark display-6 mb-2">{job.title}</h2>

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
              <span><i className="bi bi-geo-alt-fill text-danger me-1"></i>{job.location}</span>
              {job.salaryRange && (
                <span className="text-success fw-bold">
                  <i className="bi bi-currency-rupee me-1"></i>{job.salaryRange}
                </span>
              )}
              <span><i className="bi bi-clock me-1"></i>Posted Recently</span>
            </div>

            <p className="text-secondary lead small mb-0" style={{ maxWidth: 680 }}>
              {job.description}
            </p>
          </div>

          <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
            <a
              href="#apply-form"
              className="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
            >
              Apply for This Position ↓
            </a>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Full Role Specifications */}
        <div className="col-lg-7">
          {/* Key Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3">Key Responsibilities & Missions</h5>
              <ul className="text-secondary small ps-3 mb-0" style={{ lineHeight: 1.8 }}>
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="mb-2">{resp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements & Skills */}
          {job.requirements?.length > 0 && (
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3">What We're Looking For</h5>
              <ul className="text-secondary small ps-3 mb-0" style={{ lineHeight: 1.8 }}>
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="mb-2">{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Perks & Benefits */}
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-3">CravePulse Benefits & Compensation</h5>
            <div className="row g-3">
              {(job.perks || [
                '100% Comprehensive Health Insurance',
                'Direct Equity (ESOPs) with transparent vesting',
                'Top-spec MacBook Pro M3 Max Workstation',
                'Daily CravePulse dining credit'
              ]).map((perk, i) => (
                <div key={i} className="col-md-6 d-flex align-items-center gap-2 small text-secondary">
                  <i className="bi bi-patch-check-fill text-success fs-5"></i>
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Application Form with Resume PDF Upload */}
        <div className="col-lg-5" id="apply-form">
          <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 bg-white sticky-top" style={{ top: 90 }}>
            <h5 className="fw-bold text-dark mb-1">Submit Your Application</h5>
            <p className="text-muted small mb-4">Fill out your information and attach your resume below</p>

            {submitted ? (
              <div className="text-center py-4">
                <div className="fs-1 mb-2">🎉</div>
                <h4 className="fw-bold text-success mb-2">Application Received!</h4>
                <p className="text-muted small mb-3">
                  Thank you, {applicantName}. Your profile and resume (<strong>{resumeFile?.name}</strong>) have been entered into our recruitment pipeline.
                </p>
                <div className="p-3 bg-light rounded-3 small text-muted mb-4">
                  Our talent acquisition team will review your credentials and get back to you at <strong>{applicantEmail}</strong> within 48 business hours.
                </div>
                <Link to="/careers" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold">
                  Browse More Positions
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. Jaganmohan Reddy"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    placeholder="your.email@example.com"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Phone Number *</label>
                  <input
                    type="tel"
                    className="form-control"
                    required
                    placeholder="+91 98490 12345"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">LinkedIn / GitHub / Portfolio URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://github.com/..."
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                </div>

                {/* Resume PDF File Upload Input */}
                <div className="mb-3 p-3 rounded-4 bg-light border border-2 border-dashed">
                  <label className="form-label small fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                    <span>Attach Resume / CV (PDF or DOCX) *</span>
                  </label>
                  <input
                    type="file"
                    className="form-control form-control-sm mb-2"
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={handleFileChange}
                  />
                  {resumeFile ? (
                    <div className="d-flex align-items-center gap-2 text-success small fw-bold">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>Attached: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ) : (
                    <small className="text-muted d-block" style={{ fontSize: 11 }}>
                      Accepted formats: .pdf, .docx (Max 5MB)
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Why CravePulse? (Cover Note)</label>
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
                  className="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm transition hover-lift"
                  style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application →'}
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
