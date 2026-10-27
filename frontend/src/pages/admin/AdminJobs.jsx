import React, { useState } from 'react';
import ModalPortal from '../../components/ModalPortal';

const INITIAL_JOBS = [
  {
    id: 1,
    title: 'Staff Full Stack Engineer (React + Java)',
    team: 'Core Platform Engineering',
    location: 'Bengaluru (Hybrid)',
    type: 'Full-time',
    experience: '5+ Years',
    salaryRange: '₹32L - ₹48L',
    status: 'ACTIVE',
    applicantsCount: 8,
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
    status: 'ACTIVE',
    applicantsCount: 6,
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
    status: 'ACTIVE',
    applicantsCount: 4,
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
    status: 'ACTIVE',
    applicantsCount: 5,
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
    status: 'PAUSED',
    applicantsCount: 2,
    description: 'Ensure 99.99% uptime for multi-city ordering gateways, Kubernetes cluster scaling, and zero-downtime database failovers.',
    tags: ['Kubernetes', 'Docker', 'MySQL Tuning', 'CI/CD']
  }
];

const INITIAL_APPLICATIONS = [
  {
    id: 'APP-101',
    candidateName: 'Ajay kumar',
    email: 'ajay.kumar@techmail.com',
    phone: '+91 98490 12345',
    appliedRole: 'Staff Full Stack Engineer (React + Java)',
    experience: '6 Years (Fintech & Logistics)',
    status: 'SHORTLISTED',
    appliedAt: 'Today, 10:30 AM',
    resumeUrl: 'https://cravepulse.in/resumes/ajay_kumar_cv.pdf',
    note: 'Strong Java concurrency and React background with WebSockets.'
  },
  {
    id: 'APP-102',
    candidateName: 'Santhosh M',
    email: 'santhosh.m@domain.com',
    phone: '+91 98490 23456',
    appliedRole: 'Fleet Operations & Dispatch Algorithm Lead',
    experience: '4.5 Years (Hyper-local routing)',
    status: 'UNDER_REVIEW',
    appliedAt: 'Yesterday, 04:15 PM',
    resumeUrl: 'https://cravepulse.in/resumes/santhosh_m_cv.pdf',
    note: 'Hands-on experience in geospatial indexing and rider dispatch algorithms.'
  },
  {
    id: 'APP-103',
    candidateName: 'Lohith K',
    email: 'chef.lohith@culinarypartners.in',
    phone: '+91 98490 34567',
    appliedRole: 'Culinary Partner Success Manager',
    experience: '5 Years (F&B Hospitality)',
    status: 'INTERVIEW_SCHEDULED',
    appliedAt: '24 Oct, 02:00 PM',
    resumeUrl: 'https://cravepulse.in/resumes/lohith_k_cv.pdf',
    note: 'Deep ties with Bengaluru artisanal kitchens and restaurant associations.'
  }
];

const AdminJobs = () => {
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('cravepulse_careers_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [activeTab, setActiveTab] = useState('postings'); // 'postings', 'applications'

  // Post/Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('Core Platform Engineering');
  const [location, setLocation] = useState('Bengaluru (Hybrid)');
  const [type, setType] = useState('Full-time');
  const [exp, setExp] = useState('3+ Years');
  const [salary, setSalary] = useState('₹28L - ₹42L');
  const [desc, setDesc] = useState('');
  const [tagsInput, setTagsInput] = useState('React, Java, Cloud, Logistics');

  const handleOpenCreateModal = () => {
    setEditingJobId(null);
    setTitle('');
    setTeam('Core Platform Engineering');
    setLocation('Bengaluru (Hybrid)');
    setType('Full-time');
    setExp('3+ Years');
    setSalary('₹28L - ₹42L');
    setDesc('');
    setTagsInput('React, Java, Cloud, Logistics');
    setShowModal(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJobId(job.id);
    setTitle(job.title);
    setTeam(job.team);
    setLocation(job.location);
    setType(job.type);
    setExp(job.experience || '3+ Years');
    setSalary(job.salaryRange || '₹24L - ₹36L');
    setDesc(job.description || '');
    setTagsInput(job.tags?.join(', ') || '');
    setShowModal(true);
  };

  const handleSaveJob = (e) => {
    e.preventDefault();
    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    if (editingJobId) {
      const updated = jobs.map(j => {
        if (j.id === editingJobId) {
          return {
            ...j,
            title: title.trim(),
            team,
            location,
            type,
            experience: exp,
            salaryRange: salary,
            description: desc.trim(),
            tags: tagsArray
          };
        }
        return j;
      });
      setJobs(updated);
      localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(updated));
    } else {
      const newJob = {
        id: Date.now(),
        title: title.trim(),
        team,
        location,
        type,
        experience: exp,
        salaryRange: salary,
        description: desc.trim(),
        tags: tagsArray,
        status: 'ACTIVE',
        applicantsCount: 0
      };
      const updated = [newJob, ...jobs];
      setJobs(updated);
      localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(updated));
    }

    setShowModal(false);
  };

  const handleToggleStatus = (jobId) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, status: j.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
      }
      return j;
    });
    setJobs(updated);
    localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(updated));
  };

  const handleDeleteJob = (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? It will be removed from the candidate careers portal.')) return;
    const updated = jobs.filter(j => j.id !== jobId);
    setJobs(updated);
    localStorage.setItem('cravepulse_careers_jobs', JSON.stringify(updated));
  };

  const handleUpdateAppStatus = (appId, newStatus) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  return (
    <div className="admin-jobs-container text-white pb-5">
      {/* Top Header */}
      <div className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill bg-info text-dark fw-extrabold px-3 py-1" style={{ fontSize: 10 }}>
              RECRUITMENT & TALENT STUDIO
            </span>
            <span className="small text-secondary">CravePulse India Operations</span>
          </div>
          <h3 className="fw-extrabold text-white mb-0">Careers & Job Openings Console</h3>
          <small className="text-secondary">
            Publish, edit, and monitor open engineering, operations, and product positions across metro hubs.
          </small>
        </div>

        <button
          type="button"
          className="btn btn-info rounded-pill px-4 py-2.5 fw-extrabold text-dark d-flex align-items-center gap-2 shadow-lg transition hover-lift text-nowrap"
          style={{ minHeight: 46 }}
          onClick={handleOpenCreateModal}
        >
          <i className="bi bi-plus-circle-fill fs-5"></i>
          <span>Post New Job Opening</span>
        </button>
      </div>

      {/* KPI Counters Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>ACTIVE OPENINGS</span>
            <strong className="fs-3 text-white d-block">{jobs.filter(j => j.status === 'ACTIVE').length}</strong>
            <small className="text-success" style={{ fontSize: 11 }}>Live on /careers portal</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>APPLICATIONS IN PIPELINE</span>
            <strong className="fs-3 text-info d-block">{applications.length}</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>3 Received this week</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>INTERVIEWS SCHEDULED</span>
            <strong className="fs-3 text-warning d-block">{applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length}</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>Engineering & Ops rounds</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3.5 rounded-4" style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-secondary d-block small" style={{ fontSize: 11 }}>AVERAGE CTC RANGE</span>
            <strong className="fs-3 text-success d-block">₹32L</strong>
            <small className="text-secondary" style={{ fontSize: 11 }}>100% Health + ESOPs</small>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom border-secondary border-opacity-25 pb-2">
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition ${activeTab === 'postings' ? 'btn-info text-dark shadow' : 'btn-outline-secondary text-light'}`}
          onClick={() => setActiveTab('postings')}
        >
          <i className="bi bi-briefcase-fill me-1.5"></i>
          <span>Live Job Postings ({jobs.length})</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-4 py-2 fw-bold transition ${activeTab === 'applications' ? 'btn-info text-dark shadow' : 'btn-outline-secondary text-light'}`}
          onClick={() => setActiveTab('applications')}
        >
          <i className="bi bi-people-fill me-1.5"></i>
          <span>Candidate Applications ({applications.length})</span>
        </button>
      </div>

      {/* TAB 1: JOB POSTINGS */}
      {activeTab === 'postings' && (
        <div className="d-flex flex-column gap-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="p-4 rounded-4 shadow-xl text-white transition hover-bg-dark position-relative"
              style={{
                background: '#0d1525',
                border: job.status === 'ACTIVE' ? '1.5px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 mb-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1.5">
                    <span 
                      className={`badge rounded-pill fw-bold px-3 py-1 ${job.status === 'ACTIVE' ? 'bg-success text-dark' : 'bg-secondary text-white'}`}
                      style={{ fontSize: 10 }}
                    >
                      {job.status}
                    </span>
                    <span className="badge rounded-pill bg-dark border border-secondary text-info small" style={{ fontSize: 10 }}>
                      {job.team}
                    </span>
                    <span className="text-secondary small">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i>{job.location}
                    </span>
                    <span className="text-secondary small d-none d-sm-inline">• {job.type}</span>
                  </div>

                  <h5 className="fw-extrabold text-white mb-1">{job.title}</h5>
                  <p className="text-secondary small mb-2" style={{ maxWidth: 840 }}>{job.description}</p>

                  {/* Tags */}
                  <div className="d-flex flex-wrap gap-1.5">
                    {job.tags?.map((t, i) => (
                      <span key={i} className="badge bg-dark border border-secondary border-opacity-50 text-light small" style={{ fontSize: 10 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-md-end ps-md-3 flex-shrink-0">
                  <span className="fs-5 fw-extrabold text-success d-block mb-1">{job.salaryRange}</span>
                  <span className="badge bg-dark border border-info text-info small mb-3 d-inline-block">
                    {job.applicantsCount || 0} Candidates Applied
                  </span>

                  {/* Actions */}
                  <div className="d-flex align-items-center gap-2 justify-content-md-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-bold"
                      onClick={() => handleToggleStatus(job.id)}
                    >
                      {job.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info rounded-pill px-3 py-1.5 fw-bold"
                      onClick={() => handleOpenEditModal(job)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1.5"
                      title="Delete Position"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CANDIDATE APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="d-flex flex-column gap-3">
          {applications.map(app => (
            <div
              key={app.id}
              className="p-4 rounded-4 shadow-xl text-white"
              style={{ background: '#0d1525', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="font-monospace small text-secondary">{app.id}</span>
                    <span className="badge rounded-pill bg-dark border border-secondary text-light small" style={{ fontSize: 10 }}>
                      {app.appliedAt}
                    </span>
                    <span className={`badge rounded-pill fw-bold px-3 py-1 ${
                      app.status === 'SHORTLISTED' ? 'bg-success text-dark' :
                      app.status === 'INTERVIEW_SCHEDULED' ? 'bg-warning text-dark' :
                      'bg-info text-dark'
                    }`} style={{ fontSize: 10 }}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h5 className="fw-bold text-white mb-0">{app.candidateName}</h5>
                  <div className="small text-info fw-semibold mb-2">Applied for: {app.appliedRole}</div>

                  <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary mb-2">
                    <span><i className="bi bi-envelope text-light me-1"></i>{app.email}</span>
                    <span><i className="bi bi-telephone text-light me-1"></i>{app.phone}</span>
                    <span><i className="bi bi-award text-warning me-1"></i>{app.experience}</span>
                  </div>

                  <p className="text-secondary small fst-italic mb-0">"{app.note}"</p>
                </div>

                <div className="text-md-end flex-shrink-0">
                  <a
                    href={app.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 fw-bold mb-2 d-inline-flex align-items-center gap-1.5"
                  >
                    <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                    <span>Download CV / Resume ↗</span>
                  </a>

                  {/* Status Dropdown */}
                  <div className="d-flex align-items-center gap-1.5 justify-content-md-end">
                    <small className="text-secondary" style={{ fontSize: 11 }}>Update Status:</small>
                    <select
                      className="form-select form-select-sm bg-dark text-white border-secondary rounded-pill"
                      style={{ width: 180, fontSize: 11 }}
                      value={app.status}
                      onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                    >
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                      <option value="OFFER_EXTENDED">Offer Extended</option>
                      <option value="HIRED">Hired</option>
                      <option value="REJECTED">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POST / EDIT MODAL */}
      {showModal && (
        <ModalPortal isOpen={showModal}>
          <div 
            className="cravepulse-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <div className="cravepulse-modal-dialog" style={{ maxWidth: 680 }}>
              <div 
                className="modal-content rounded-4 border-0 p-4 shadow-2xl text-white"
                style={{ background: '#0f172a', border: '1.5px solid rgba(56, 189, 248, 0.35)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">💼</span>
                    <h5 className="fw-bold mb-0 text-white">
                      {editingJobId ? 'Edit Job Opening' : 'Post New Job Opening'}
                    </h5>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                </div>

                <p className="text-secondary small mb-3">
                  This role will immediately appear in the public <strong>/careers</strong> network grid.
                </p>

                <form onSubmit={handleSaveJob}>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-bold text-light">Job Role Title *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        required
                        placeholder="e.g. Lead SRE / DevOps Engineer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-light">Department *</label>
                      <select 
                        className="form-select bg-dark text-white border-secondary"
                        value={team} 
                        onChange={(e) => setTeam(e.target.value)}
                      >
                        <option value="Core Platform Engineering">Core Platform Engineering</option>
                        <option value="Logistics Intelligence">Logistics Intelligence</option>
                        <option value="Restaurant Partnerships">Restaurant Partnerships</option>
                        <option value="Design Systems">Design Systems</option>
                        <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                        <option value="Brand & Communications">Brand & Communications</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-light">Location *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        required
                        placeholder="e.g. Bengaluru (Hybrid)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-light">Employment Type</label>
                      <select 
                        className="form-select bg-dark text-white border-secondary"
                        value={type} 
                        onChange={(e) => setType(e.target.value)}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold text-light">Experience Required</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="e.g. 4+ Years"
                        value={exp}
                        onChange={(e) => setExp(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-light">Compensation / Salary Range *</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        required
                        placeholder="e.g. ₹28L - ₹42L + ESOPs"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-light">Tech / Skill Tags (Comma-separated)</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="React, Java, Cloud, MySQL"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-light">Role Summary & Mission *</label>
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="3"
                      required
                      placeholder="Detail high-level responsibilities, team mandate, and expected impact..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-pill px-4"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-info rounded-pill px-5 fw-bold text-dark shadow"
                    >
                      {editingJobId ? 'Save Changes' : 'Publish Opening Live'}
                    </button>
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
