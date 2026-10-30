package com.foodplatform.daoImpl;

import com.foodplatform.config.DatabaseConfig;
import com.foodplatform.dao.JobDao;
import com.foodplatform.model.JobApplication;
import com.foodplatform.model.JobPosting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class JobDaoImpl implements JobDao {

    private static final Logger logger = LoggerFactory.getLogger(JobDaoImpl.class);

    // ─── Job Postings ────────────────────────────────────────────────────

    @Override
    public Long createJobPosting(JobPosting job) {
        String sql = "INSERT INTO job_postings (title, department, location, employment_type, experience_level, " +
                "salary_min, salary_max, salary_display, description, responsibilities, requirements, benefits, " +
                "tags, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, job.getTitle());
            ps.setString(2, job.getDepartment());
            ps.setString(3, job.getLocation());
            ps.setString(4, job.getEmploymentType() != null ? job.getEmploymentType() : "Full-time");
            ps.setString(5, job.getExperienceLevel());
            setBigDecimalOrNull(ps, 6, job.getSalaryMin());
            setBigDecimalOrNull(ps, 7, job.getSalaryMax());
            ps.setString(8, job.getSalaryDisplay());
            ps.setString(9, job.getDescription());
            ps.setString(10, job.getResponsibilities());
            ps.setString(11, job.getRequirements());
            ps.setString(12, job.getBenefits());
            ps.setString(13, job.getTags());
            ps.setString(14, job.getStatus() != null ? job.getStatus() : "ACTIVE");
            if (job.getCreatedBy() != null) ps.setLong(15, job.getCreatedBy());
            else ps.setNull(15, Types.BIGINT);
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        } catch (SQLException e) {
            logger.error("Error creating job posting: {}", job.getTitle(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public JobPosting findJobById(long id) {
        String sql = "SELECT jp.*, (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id) AS applicants_count " +
                "FROM job_postings jp WHERE jp.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapJobPosting(rs);
            }
        } catch (SQLException e) {
            logger.error("Error finding job posting by id: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<JobPosting> listJobPostings(String status, String department, int limit, int offset) {
        StringBuilder sql = new StringBuilder(
                "SELECT jp.*, (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = jp.id) AS applicants_count " +
                "FROM job_postings jp WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) {
            sql.append(" AND jp.status = ?");
            params.add(status);
        }
        if (department != null && !department.isEmpty() && !"All".equalsIgnoreCase(department)) {
            sql.append(" AND jp.department = ?");
            params.add(department);
        }
        sql.append(" ORDER BY jp.created_at DESC, jp.id DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        List<JobPosting> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof String) ps.setString(i + 1, (String) p);
                else if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapJobPosting(rs));
            }
        } catch (SQLException e) {
            logger.error("Error listing job postings", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public int countJobPostings(String status, String department) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM job_postings jp WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) {
            sql.append(" AND jp.status = ?");
            params.add(status);
        }
        if (department != null && !department.isEmpty() && !"All".equalsIgnoreCase(department)) {
            sql.append(" AND jp.department = ?");
            params.add(department);
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                ps.setString(i + 1, (String) params.get(i));
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        } catch (SQLException e) {
            logger.error("Error counting job postings", e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateJobPosting(JobPosting job) {
        String sql = "UPDATE job_postings SET title=?, department=?, location=?, employment_type=?, " +
                "experience_level=?, salary_min=?, salary_max=?, salary_display=?, description=?, " +
                "responsibilities=?, requirements=?, benefits=?, tags=?, status=? WHERE id=?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, job.getTitle());
            ps.setString(2, job.getDepartment());
            ps.setString(3, job.getLocation());
            ps.setString(4, job.getEmploymentType());
            ps.setString(5, job.getExperienceLevel());
            setBigDecimalOrNull(ps, 6, job.getSalaryMin());
            setBigDecimalOrNull(ps, 7, job.getSalaryMax());
            ps.setString(8, job.getSalaryDisplay());
            ps.setString(9, job.getDescription());
            ps.setString(10, job.getResponsibilities());
            ps.setString(11, job.getRequirements());
            ps.setString(12, job.getBenefits());
            ps.setString(13, job.getTags());
            ps.setString(14, job.getStatus());
            ps.setLong(15, job.getId());
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating job posting: {}", job.getId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void updateJobStatus(long jobId, String status) {
        String sql = "UPDATE job_postings SET status = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, jobId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating job status: {}", jobId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public void deleteJobPosting(long jobId) {
        String sql = "DELETE FROM job_postings WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, jobId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error deleting job posting: {}", jobId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public List<String> listDepartments() {
        String sql = "SELECT DISTINCT department FROM job_postings ORDER BY department";
        List<String> departments = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) departments.add(rs.getString("department"));
        } catch (SQLException e) {
            logger.error("Error listing departments", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return departments;
    }

    // ─── Job Applications ────────────────────────────────────────────────

    @Override
    public Long createApplication(JobApplication app) {
        String sql = "INSERT INTO job_applications (job_id, applicant_name, email, phone, portfolio_url, " +
                "resume_filename, cover_note, experience_years, current_company, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, app.getJobId());
            ps.setString(2, app.getApplicantName());
            ps.setString(3, app.getEmail());
            ps.setString(4, app.getPhone());
            ps.setString(5, app.getPortfolioUrl());
            ps.setString(6, app.getResumeFilename());
            ps.setString(7, app.getCoverNote());
            ps.setString(8, app.getExperienceYears());
            ps.setString(9, app.getCurrentCompany());
            ps.setString(10, app.getStatus() != null ? app.getStatus() : "UNDER_REVIEW");
            ps.executeUpdate();
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
            }
        } catch (SQLException e) {
            logger.error("Error creating job application for job: {}", app.getJobId(), e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public JobApplication findApplicationById(long id) {
        String sql = "SELECT ja.*, jp.title AS job_title, jp.department AS job_department " +
                "FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE ja.id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapApplication(rs);
            }
        } catch (SQLException e) {
            logger.error("Error finding application by id: {}", id, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return null;
    }

    @Override
    public List<JobApplication> listApplications(Long jobId, String status, int limit, int offset) {
        StringBuilder sql = new StringBuilder(
                "SELECT ja.*, jp.title AS job_title, jp.department AS job_department " +
                "FROM job_applications ja JOIN job_postings jp ON ja.job_id = jp.id WHERE 1=1");
        List<Object> params = new ArrayList<>();
        if (jobId != null) {
            sql.append(" AND ja.job_id = ?");
            params.add(jobId);
        }
        if (status != null && !status.isEmpty()) {
            sql.append(" AND ja.status = ?");
            params.add(status);
        }
        sql.append(" ORDER BY ja.applied_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        List<JobApplication> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof String) ps.setString(i + 1, (String) p);
                else if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
                else if (p instanceof Long) ps.setLong(i + 1, (Long) p);
            }
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapApplication(rs));
            }
        } catch (SQLException e) {
            logger.error("Error listing applications", e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return list;
    }

    @Override
    public void updateApplicationStatus(long applicationId, String status, Long reviewedBy, String adminNotes) {
        String sql = "UPDATE job_applications SET status=?, reviewed_at=CURRENT_TIMESTAMP, reviewed_by=?, admin_notes=? WHERE id=?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            if (reviewedBy != null) ps.setLong(2, reviewedBy);
            else ps.setNull(2, Types.BIGINT);
            ps.setString(3, adminNotes);
            ps.setLong(4, applicationId);
            ps.executeUpdate();
        } catch (SQLException e) {
            logger.error("Error updating application status: {}", applicationId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
    }

    @Override
    public int countApplicationsByJob(long jobId) {
        String sql = "SELECT COUNT(*) FROM job_applications WHERE job_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, jobId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            logger.error("Error counting applications for job: {}", jobId, e);
            throw new IllegalStateException("Database operation failed", e);
        }
        return 0;
    }

    // ─── Mappers ─────────────────────────────────────────────────────────

    private JobPosting mapJobPosting(ResultSet rs) throws SQLException {
        JobPosting j = new JobPosting();
        j.setId(rs.getLong("id"));
        j.setTitle(rs.getString("title"));
        j.setDepartment(rs.getString("department"));
        j.setLocation(rs.getString("location"));
        j.setEmploymentType(rs.getString("employment_type"));
        j.setExperienceLevel(rs.getString("experience_level"));
        j.setSalaryMin(rs.getBigDecimal("salary_min"));
        j.setSalaryMax(rs.getBigDecimal("salary_max"));
        j.setSalaryDisplay(rs.getString("salary_display"));
        j.setDescription(rs.getString("description"));
        j.setResponsibilities(rs.getString("responsibilities"));
        j.setRequirements(rs.getString("requirements"));
        j.setBenefits(rs.getString("benefits"));
        j.setTags(rs.getString("tags"));
        j.setStatus(rs.getString("status"));
        j.setCreatedBy(rs.getObject("created_by") != null ? rs.getLong("created_by") : null);
        j.setCreatedAt(rs.getTimestamp("created_at"));
        j.setUpdatedAt(rs.getTimestamp("updated_at"));
        try {
            j.setApplicantsCount(rs.getInt("applicants_count"));
        } catch (SQLException ignored) {
            // Column may not exist in all queries
        }
        return j;
    }

    private JobApplication mapApplication(ResultSet rs) throws SQLException {
        JobApplication a = new JobApplication();
        a.setId(rs.getLong("id"));
        a.setJobId(rs.getLong("job_id"));
        a.setApplicantName(rs.getString("applicant_name"));
        a.setEmail(rs.getString("email"));
        a.setPhone(rs.getString("phone"));
        a.setPortfolioUrl(rs.getString("portfolio_url"));
        a.setResumeFilename(rs.getString("resume_filename"));
        a.setCoverNote(rs.getString("cover_note"));
        a.setExperienceYears(rs.getString("experience_years"));
        a.setCurrentCompany(rs.getString("current_company"));
        a.setStatus(rs.getString("status"));
        a.setAppliedAt(rs.getTimestamp("applied_at"));
        a.setReviewedAt(rs.getTimestamp("reviewed_at"));
        a.setReviewedBy(rs.getObject("reviewed_by") != null ? rs.getLong("reviewed_by") : null);
        a.setAdminNotes(rs.getString("admin_notes"));
        try {
            a.setJobTitle(rs.getString("job_title"));
            a.setJobDepartment(rs.getString("job_department"));
        } catch (SQLException ignored) {
            // Joined columns may not exist
        }
        return a;
    }

    private void setBigDecimalOrNull(PreparedStatement ps, int index, BigDecimal value) throws SQLException {
        if (value != null) ps.setBigDecimal(index, value);
        else ps.setNull(index, Types.DECIMAL);
    }
}
