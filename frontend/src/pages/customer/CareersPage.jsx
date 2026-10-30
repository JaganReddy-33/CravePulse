import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Pagination from '../../components/common/Pagination';

const JOB_PAGE_SIZE = 12;

const CareersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === 'ADMIN';

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [error, setError] = useState(null);
  const jobsRequestId = useRef(0);
  const lastSuccessfulPage = useRef(null);
  const retryPage = useRef(null);
  const skipPageFetch = useRef(false);

  const activeDept = searchParams.get('dept') || 'All';
  const pageParam = Number(searchParams.get('page'));
  const currentPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const totalPages = Math.max(1, Math.ceil(totalJobCount / JOB_PAGE_SIZE));

  const changePage = (page) => {
    if (page === currentPage) return;
    retryPage.current = null;
    setLoading(true);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      if (page > 1) params.set('page', String(page));
      else params.delete('page');
      return params;
    }, { replace: true });
  };

  const fetchJobs = useCallback(async () => {
    const requestId = ++jobsRequestId.current;
    const handlePageFailure = (message) => {
      setError(message);
      retryPage.current = currentPage > 1 ? currentPage : null;

      if (currentPage > 1) {
        const previousPage = lastSuccessfulPage.current;
        const restorePage = previousPage?.department === activeDept ? previousPage.page : 1;
        if (restorePage !== currentPage) {
          if (previousPage?.department === activeDept && previousPage.page === restorePage) {
            skipPageFetch.current = true;
          }
          setSearchParams((current) => {
            const params = new URLSearchParams(current);
            if (restorePage > 1) params.set('page', String(restorePage));
            else params.delete('page');
            return params;
          }, { replace: true });
        }
      }
    };
    try {
      setLoading(true);
      const params = {
        status: 'ACTIVE',
        limit: JOB_PAGE_SIZE,
        offset: (currentPage - 1) * JOB_PAGE_SIZE,
      };
      if (activeDept && activeDept !== 'All') params.department = activeDept;

      const res = await api.get('/jobs', { params });
      if (requestId !== jobsRequestId.current) return;
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
        setTotalJobCount(Number(res.pagination?.totalCount ?? (params.offset + res.data.length)));
        lastSuccessfulPage.current = { page: currentPage, department: activeDept };
        if (retryPage.current === null || retryPage.current === currentPage) {
          setError(null);
          retryPage.current = null;
        }
      } else {
        handlePageFailure(res.message || 'Unable to load open positions. Please try again.');
      }
    } catch (err) {
      if (requestId !== jobsRequestId.current) return;
      console.error('Error fetching jobs:', err);
      handlePageFailure('Unable to load open positions. Please try again.');
    } finally {
      if (requestId === jobsRequestId.current) setLoading(false);
    }
  }, [activeDept, currentPage, setSearchParams]);

  const retryJobs = () => {
    const pageToRetry = retryPage.current;
    if (pageToRetry && pageToRetry !== currentPage) {
      changePage(pageToRetry);
      return;
    }
    fetchJobs();
  };

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/jobs/departments');
      if (res.success && Array.isArray(res.data)) {
        setDepartments(['All', ...res.data]);
      }
    } catch {
      // Fallback departments
    }
  }, []);

  useEffect(() => {
    if (skipPageFetch.current) {
      skipPageFetch.current = false;
      return undefined;
    }
    fetchJobs();
    return () => {
      jobsRequestId.current += 1;
    };
  }, [fetchJobs]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (!loading && currentPage > totalPages) changePage(totalPages);
  }, [currentPage, loading, totalPages]);

  const createSlug = (text) => {
    return (text || 'opening')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags.split(',').map(t => t.trim()).filter(Boolean);
  };

  return (
    <div className="container py-4 py-md-5">
      {/* Hero Section */}
      <div className="text-center mb-5">
        <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill fw-bold mb-3">
          🚀 CRAVEPULSE TALENT NETWORK
        </span>
        <h1 className="fw-bold text-dark display-5 mb-3">
          Build the Future of <span style={{ color: 'var(--c-primary)' }}>Fair Food Delivery</span>
        </h1>
        <p className="text-muted lead mx-auto" style={{ maxWidth: 680 }}>
          Join an ambitious team redefining the Indian food delivery landscape with 100% dine-in price parity, fair compensation for delivery captains, and honest platform commission.
        </p>
      </div>

      {/* Perks Grid */}
      <div className="row g-4 mb-5">
        {[
          { icon: '🏥', title: '100% Health Coverage', desc: 'Comprehensive medical coverage for you and your parents.' },
          { icon: '📈', title: 'Direct Equity (ESOPs)', desc: 'Own a meaningful piece of CravePulse with transparent vesting.' },
          { icon: '🍱', title: 'Daily Food Credit', desc: 'Generous CravePulse dining credits at all top partner restaurants.' },
          { icon: '💻', title: 'Latest Gear & Setup', desc: 'Top-spec Apple Silicon MacBooks and workstation allowance.' }
        ].map((perk, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="card border-0 rounded-4 shadow-sm p-4 bg-white text-center h-100">
              <div className="fs-2 mb-2">{perk.icon}</div>
              <h6 className="fw-bold mb-1">{perk.title}</h6>
              <small className="text-muted">{perk.desc}</small>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Open Positions ({totalJobCount})</h4>
          <p className="text-muted small mb-0">Select any role to view detailed responsibilities, salary, and submit your CV</p>
        </div>
        <span className="badge bg-success-subtle text-success border border-success rounded-pill px-3 py-2 small">
          ● Actively Interviewing Across India
        </span>
      </div>

      {/* Department Filter Pills */}
      <div className="d-flex gap-2 overflow-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {departments.map((dept) => {
          const isActive = activeDept.toLowerCase() === dept.toLowerCase();
          return (
            <button
              key={dept}
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold text-nowrap ${
                isActive
                  ? 'btn-primary text-white shadow-sm'
                  : 'btn-light border text-secondary bg-white'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--c-secondary) 100%)', borderColor: 'var(--c-primary)' } : {}}
              onClick={() => {
                if (dept === 'All') setSearchParams({}, { replace: true });
                else setSearchParams({ dept }, { replace: true });
              }}
            >
              {dept}
            </button>
          );
        })}
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading open positions...</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-warning text-center" role="alert" aria-live="assertive">
          {error}
          {jobs.length > 0 && <span> Previously loaded positions remain visible.</span>}
          <button
            type="button"
            className="btn btn-sm btn-outline-primary ms-3 rounded-pill"
            aria-label="Retry loading open positions"
            onClick={retryJobs}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-5">
          <div className="fs-1 mb-2">🔍</div>
          <h5 className="fw-bold">No open positions found{activeDept !== 'All' ? ` in ${activeDept}` : ''}</h5>
          <p className="text-muted small">Check back soon as new requisitions are opened.</p>
          {activeDept !== 'All' && (
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => setSearchParams({}, { replace: true })}>
              Show All Roles
            </button>
          )}
        </div>
      )}

      {/* Job Cards Grid */}
      {!loading && jobs.length > 0 && (
        <div className="row g-4 mb-5">
          {jobs.map((job) => (
            <div key={job.id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card border-0 rounded-4 shadow-sm p-4 bg-white h-100 d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ cursor: 'pointer', border: '1px solid #f1f5f9' }}
                onClick={() => {
                  const slug = createSlug(job.title);
                  navigate(`/careers/openings/${slug}-cp${job.id}?job_id=${job.id}&dept=${encodeURIComponent(job.department || job.team || '')}`);
                }}
              >
                <div>
                  {/* Department & Salary Badge */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-primary-subtle text-primary border border-primary small rounded-pill px-2 py-1">
                      {job.department || job.team}
                    </span>
                    {(job.salaryDisplay || job.salaryRange) && (
                      <span className="badge bg-success-subtle text-success border border-success small rounded-pill px-2 py-1">
                        {job.salaryDisplay || job.salaryRange}
                      </span>
                    )}
                  </div>

                  <h5 className="fw-bold text-dark mb-2" style={{ fontSize: '1.15rem' }}>
                    {job.title}
                  </h5>

                  <div className="d-flex flex-wrap align-items-center gap-2 small text-muted mb-3">
                    <span><i className="bi bi-geo-alt-fill text-danger me-1"></i>{job.location}</span>
                    <span>•</span>
                    <span><i className="bi bi-briefcase me-1"></i>{job.experienceLevel || job.experience || '3+ Yrs'}</span>
                    <span>•</span>
                    <span>{job.employmentType || job.type || 'Full-time'}</span>
                  </div>

                  <p className="text-secondary small mb-3" style={{ maxHeight: 60, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {job.description}
                  </p>

                  {/* Tags */}
                  {parseTags(job.tags).length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {parseTags(job.tags).slice(0, 4).map((tag, i) => (
                        <span key={i} className="badge bg-light text-secondary border small" style={{ fontSize: 10 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-auto">
                  <span className="text-primary fw-bold small">
                    View Full Role & Apply →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalJobCount > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={JOB_PAGE_SIZE}
          totalCount={totalJobCount}
          itemLabel={totalJobCount === 1 ? 'position' : 'positions'}
          onPageChange={changePage}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default CareersPage;
