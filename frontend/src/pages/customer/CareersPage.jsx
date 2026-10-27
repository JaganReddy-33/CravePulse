import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_JOBS = [
  {
    id: 1,
    title: 'Staff Full Stack Engineer (React + Java)',
    team: 'Core Platform Engineering',
    location: 'Bengaluru (Hybrid)',
    type: 'Full-time',
    experience: '5+ Years',
    salaryRange: '₹32L - ₹48L',
    description: 'Architect low-latency event-driven microservices powering real-time dispatch telemetry, 0% menu parity verifiers, and WebSocket tracking.',
    tags: ['React 18', 'Java 17', 'MySQL', 'WebSockets']
  },
  {
    id: 2,
    title: 'Fleet Operations & Dispatch Algorithm Lead',
    team: 'Logistics Intelligence',
    location: 'Bengaluru / Mumbai',
    type: 'Full-time',
    experience: '4+ Years',
    salaryRange: '₹26L - ₹38L',
    description: 'Optimize rider fair-pay protocols, geo-fenced batching, and wait-time compensation engines across metro hubs.',
    tags: ['Geospatial', 'Routing', 'Fleet Telemetry', 'Python']
  },
  {
    id: 3,
    title: 'Culinary Partner Success Manager',
    team: 'Restaurant Partnerships',
    location: 'Delhi-NCR / Chennai',
    type: 'Full-time',
    experience: '3+ Years',
    salaryRange: '₹18L - ₹26L',
    description: 'Partner with top culinary institutions and artisanal cloud kitchens to ensure transparent 0% markup menu parity.',
    tags: ['F&B Strategy', 'Price Parity', 'Kitchen Ops']
  },
  {
    id: 4,
    title: 'Lead Product Designer (UI/UX Systems)',
    team: 'Design Systems',
    location: 'Remote (India)',
    type: 'Full-time',
    experience: '5+ Years',
    salaryRange: '₹28L - ₹42L',
    description: 'Craft beautiful, accessible mobile-first interfaces, customer checkout flows, and high-contrast kitchen tablet terminals for restaurant chefs.',
    tags: ['Figma', 'Design Systems', 'Micro-Animations']
  },
  {
    id: 5,
    title: 'Site Reliability & DevOps Engineer',
    team: 'Infrastructure & Cloud',
    location: 'Hyderabad (Hybrid)',
    type: 'Full-time',
    experience: '4+ Years',
    salaryRange: '₹25L - ₹36L',
    description: 'Ensure 99.99% uptime for multi-city ordering gateways, Kubernetes cluster scaling, and zero-downtime database failovers.',
    tags: ['Kubernetes', 'Docker', 'MySQL Tuning', 'CI/CD']
  },
  {
    id: 6,
    title: 'Growth Marketing & Brand Lead',
    team: 'Brand & Communications',
    location: 'Bengaluru / Mumbai',
    type: 'Full-time',
    experience: '3+ Years',
    salaryRange: '₹20L - ₹30L',
    description: 'Champion our anti-monopoly fair dining mission to consumers and build high-ROI viral referral campaigns.',
    tags: ['Growth', 'Consumer Tech', 'Viral Loops', 'Analytics']
  }
];

const CareersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === 'ADMIN';

  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('cravepulse_careers_jobs');
    return saved ? JSON.parse(saved) : DEFAULT_JOBS;
  });

  const activeDept = searchParams.get('dept') || 'All';
  const departments = ['All', 'Core Platform Engineering', 'Logistics Intelligence', 'Restaurant Partnerships', 'Design Systems', 'Infrastructure & Cloud', 'Brand & Communications'];

  const filteredJobs = activeDept === 'All'
    ? jobs
    : jobs.filter(j => j.team.toLowerCase() === activeDept.toLowerCase());

  // Recruiter Studio Modal (Strictly Admin only)
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTeam, setNewTeam] = useState('Core Platform Engineering');
  const [newLocation, setNewLocation] = useState('Bengaluru (Hybrid)');
  const [newType, setNewType] = useState('Full-time');
  const [newExp, setNewExp] = useState('3+ Years');
  const [newSalary, setNewSalary] = useState('₹24L - ₹36L + ESOPs');
  const [newTags, setNewTags] = useState('React, Java, WebSockets, MySQL');
  const [newDesc, setNewDesc] = useState('');
  const [newResponsibilities, setNewResponsibilities] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newPerks, setNewPerks] = useState('');

  const createSlug = (text) => {
    return (text || 'opening')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleCreateJob = (e) => {
    e.preventDefault();

    const respArray = newResponsibilities.trim()
      ? newResponsibilities.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean)
      : [
          'Lead key engineering initiatives and architect scalable services.',
          'Deliver high-quality features with comprehensive test coverage.',
          'Collaborate directly with cross-functional product and design teams.'
        ];

    const reqArray = newRequirements.trim()
      ? newRequirements.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean)
      : [
          'Strong experience in full-stack application development.',
          'Demonstrated expertise in high-concurrency systems and database performance.',
          'Passion for building transparent, mission-driven consumer technology.'
        ];

    const perksArray = newPerks.trim()
      ? newPerks.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean)
      : [
          '100% Comprehensive Cashless Health Insurance for family',
          'Meaningful equity allocation (ESOPs) with transparent vesting',
          'Latest Apple MacBook Pro Workstation & monitor stipend',
          '₹15,000 monthly CravePulse gourmet dining credit'
        ];

    const tagsArray = newTags.trim()
      ? newTags.split(',').map(s => s.trim()).filter(Boolean)
      : ['Full-time', 'Engineering'];

    const createdJob = {
      id: Date.now(),
      title: newTitle.trim(),
      team: newTeam,
      location: newLocation.trim(),
      type: newType,
      experience: newExp.trim(),
      salaryRange: newSalary.trim(),
      description: newDesc.trim(),
      tags: tagsArray,
      responsibilities: respArray,
      requirements: reqArray,
      perks: perksArray
    };

    const updatedJobs = [createdJob, ...jobs];
    setJobs(updatedJobs);
    localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(updatedJobs));

    setShowPostJobModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewResponsibilities('');
    setNewRequirements('');
    setNewPerks('');
    setNewTags('React, Java, WebSockets, MySQL');
  };

  const handleDeleteJob = (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this job opening?')) return;
    const filtered = jobs.filter(j => j.id !== jobId);
    setJobs(filtered);
    localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(filtered));
  };

  return (
    <div className="container py-4 py-md-5">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill fw-bold mb-3">
          🚀 CRAVEPULSE TALENT NETWORK
        </span>
        <h1 className="fw-extrabold text-dark display-5 mb-3">
          Build the Future of <span style={{ color: 'var(--c-primary)' }}>Fair Food Delivery</span>
        </h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 680 }}>
          Join an ambitious team redefining the Indian food delivery landscape with 100% dine-in price parity, fair compensation for delivery captains, and honest platform commission.
        </p>

        {/* Dynamic Job Posting trigger: Strictly visible only to logged-in ADMIN */}
        {isAdmin && (
          <div className="mt-4 p-3 bg-light rounded-4 border d-inline-block">
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-dark text-white rounded-pill px-3 py-1">Admin Recruiter Mode</span>
              <button
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                onClick={() => setShowPostJobModal(true)}
              >
                + Post a New Job Opening
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Perks Grid */}
      <div className="row g-4 mb-5">
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100 hover-lift transition">
            <div className="fs-2 mb-2">🏥</div>
            <h6 className="fw-bold mb-1">100% Health Coverage</h6>
            <small className="text-muted">Comprehensive medical coverage for you and your parents.</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100 hover-lift transition">
            <div className="fs-2 mb-2">📈</div>
            <h6 className="fw-bold mb-1">Direct Equity (ESOPs)</h6>
            <small className="text-muted">Own a meaningful piece of CravePulse with transparent vesting.</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100 hover-lift transition">
            <div className="fs-2 mb-2">🍱</div>
            <h6 className="fw-bold mb-1">Daily Food Credit</h6>
            <small className="text-muted">Generous CravePulse dining credits at all top partner restaurants.</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100 hover-lift transition">
            <div className="fs-2 mb-2">💻</div>
            <h6 className="fw-bold mb-1">Latest Gear & Setup</h6>
            <small className="text-muted">Top-spec Apple Silicon MacBooks and workstation allowance.</small>
          </div>
        </div>
      </div>

      {/* Header for Open Positions & Filter Badges */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Open Positions ({filteredJobs.length})</h4>
          <p className="text-muted small mb-0">Select any role to view detailed responsibilities, salary, and submit your CV</p>
        </div>
        <span className="badge bg-success-subtle text-success border border-success rounded-pill px-3 py-2 small">
          ● Actively Interviewing Across India
        </span>
      </div>

      {/* Department Filter Pills (Swiggy / Top Tech Careers Pattern) */}
      <div className="d-flex gap-2 overflow-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {departments.map((dept) => {
          const isActive = activeDept.toLowerCase() === dept.toLowerCase();
          const count = dept === 'All' ? jobs.length : jobs.filter(j => j.team.toLowerCase() === dept.toLowerCase()).length;
          return (
            <button
              key={dept}
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-nowrap transition ${
                isActive
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-light border text-secondary bg-white hover-bg-light'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' } : {}}
              onClick={() => {
                if (dept === 'All') {
                  setSearchParams({}, { replace: true });
                } else {
                  setSearchParams({ dept }, { replace: true });
                }
              }}
            >
              {dept} <span className="badge bg-dark bg-opacity-10 text-dark ms-1 rounded-pill">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid Layout: 3 to 4 Cards per Row (Responsive col-12 col-md-6 col-lg-4 col-xl-4) */}
      <div className="row g-4 mb-5">
        {filteredJobs.length === 0 ? (
          <div className="col-12 text-center py-5">
            <div className="fs-1 mb-2">🔍</div>
            <h5 className="fw-bold">No open positions found in {activeDept}</h5>
            <p className="text-muted small">Try switching departments or check back soon as new requisitions are opened.</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              onClick={() => setSearchParams({}, { replace: true })}
            >
              Show All Roles ({jobs.length})
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between hover-lift transition cursor-pointer position-relative overflow-hidden"
                style={{ cursor: 'pointer', border: '1px solid #f1f5f9' }}
                onClick={() => {
                  const slug = createSlug(job.title);
                  navigate(`/careers/openings/${slug}-cp${job.id}?job_id=${job.id}&dept=${encodeURIComponent(job.team)}`);
                }}
              >
              <div>
                {/* Department & Salary Badge */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-primary-subtle text-primary border border-primary small rounded-pill px-2 py-1">
                    {job.team}
                  </span>
                  {job.salaryRange && (
                    <span className="badge bg-success-subtle text-success border border-success small rounded-pill px-2 py-1">
                      {job.salaryRange}
                    </span>
                  )}
                </div>

                <h5 className="fw-bold text-dark mb-2 hover-text-primary" style={{ fontSize: '1.15rem' }}>
                  {job.title}
                </h5>

                <div className="d-flex flex-wrap align-items-center gap-2 small text-muted mb-3">
                  <span><i className="bi bi-geo-alt-fill text-danger me-1"></i>{job.location}</span>
                  <span>•</span>
                  <span><i className="bi bi-briefcase me-1"></i>{job.experience || '3+ Yrs'}</span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>

                <p className="text-secondary small mb-3" style={{ maxHeight: 60, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {job.description}
                </p>

                {/* Tech / Skill Tags */}
                {job.tags && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {job.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="badge bg-light text-secondary border small" style={{ fontSize: 10 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Action */}
              <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-auto">
                <span className="text-primary fw-bold small">
                  View Full Role & Apply →
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger rounded-circle p-1"
                    style={{ width: 28, height: 28 }}
                    title="Remove Job"
                    onClick={(e) => handleDeleteJob(job.id, e)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      </div>

      {/* Recruiter: Post Job Modal (Admin only) */}
      {isAdmin && showPostJobModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg p-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">Post a New Job Opportunity</h5>
                  <small className="text-muted">This opening will immediately appear in the live careers portal grid</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowPostJobModal(false)}></button>
              </div>

              <form onSubmit={handleCreateJob}>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold">Job Role Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Lead SRE / DevOps Engineer"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Department / Team</label>
                    <select className="form-select" value={newTeam} onChange={(e) => setNewTeam(e.target.value)}>
                      <option value="Core Platform Engineering">Core Platform Engineering</option>
                      <option value="Logistics Intelligence">Logistics Intelligence</option>
                      <option value="Restaurant Partnerships">Restaurant Partnerships</option>
                      <option value="Design Systems">Design Systems</option>
                      <option value="Product & Growth">Product & Growth</option>
                      <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Bengaluru / Hyderabad (Hybrid)"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Employment Type</label>
                    <select className="form-select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                      <option value="Full-time">Full-time</option>
                      <option value="Contract / Consultant">Contract / Consultant</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Experience Level</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 4+ Years"
                      value={newExp}
                      onChange={(e) => setNewExp(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Compensation / Salary Range</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ₹28,00,000 - ₹42,00,000 + ESOPs"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tech Stack & Tags (Comma Separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. React 18, Java 21, MySQL, WebSockets"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Role Summary & Mission *</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      required
                      placeholder="Detail high level responsibilities, core missions, and impact..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Key Responsibilities (One item per line)</label>
                    <textarea
                      className="form-control font-monospace small"
                      rows="3"
                      placeholder="Architect event-driven Jakarta Servlets&#10;Implement optimistic concurrency control&#10;Scale WebSocket connections across 50k nodes"
                      value={newResponsibilities}
                      onChange={(e) => setNewResponsibilities(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Requirements & Qualifications (One item per line)</label>
                    <textarea
                      className="form-control font-monospace small"
                      rows="3"
                      placeholder="5+ years hands-on production experience in Java or React&#10;Deep expertise in relational schemas & indexing&#10;Strong communication and problem solving"
                      value={newRequirements}
                      onChange={(e) => setNewRequirements(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Perks & Benefits (One item per line)</label>
                    <textarea
                      className="form-control font-monospace small"
                      rows="2"
                      placeholder="100% Cashless Medical Insurance for family&#10;Direct Equity (ESOPs) grant with 4-yr vesting&#10;Top-spec Apple Silicon MacBook Pro"
                      value={newPerks}
                      onChange={(e) => setNewPerks(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowPostJobModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                  >
                    Publish Opening to Grid Live
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
