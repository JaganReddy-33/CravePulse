package com.foodplatform.servlet;

import com.foodplatform.dao.JobDao;
import com.foodplatform.daoImpl.JobDaoImpl;
import com.foodplatform.model.JobApplication;
import com.foodplatform.model.JobPosting;
import com.foodplatform.util.JsonUtil;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/jobs/*")
public class JobServlet extends BaseServlet {

    private static final long serialVersionUID = 1L;

    private final JobDao jobDao = new JobDaoImpl();

    // ─── GET ─────────────────────────────────────────────────────────────
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        // GET /api/jobs/departments
        if ("/departments".equals(path)) {
            List<String> departments = jobDao.listDepartments();
            JsonUtil.sendSuccess(res, 200, "Departments retrieved", departments);
            return;
        }

        // GET /api/jobs/applications or /api/jobs/applications/{id}
        if (path.startsWith("/applications")) {
            if (!requireAdmin(req, res)) return;

            String appPath = path.substring("/applications".length());
            if (appPath.isEmpty() || "/".equals(appPath)) {
                Long jobId = null;
                String jobIdParam = req.getParameter("jobId");
                if (jobIdParam != null && !jobIdParam.isEmpty()) {
                    try { jobId = Long.parseLong(jobIdParam); } catch (NumberFormatException ignored) {}
                }
                String status = req.getParameter("status");
                int limit = 50;
                int offset = 0;
                try { if (req.getParameter("limit") != null) limit = Integer.parseInt(req.getParameter("limit")); } catch (NumberFormatException ignored) {}
                try { if (req.getParameter("offset") != null) offset = Integer.parseInt(req.getParameter("offset")); } catch (NumberFormatException ignored) {}

                List<JobApplication> apps = jobDao.listApplications(jobId, status, Math.max(1, Math.min(100, limit)), Math.max(0, offset));
                JsonUtil.sendSuccess(res, 200, "Applications retrieved", apps);
                return;
            }

            // Single application by ID
            try {
                long appId = Long.parseLong(appPath.replaceFirst("^/", ""));
                JobApplication app = jobDao.findApplicationById(appId);
                if (app == null) {
                    JsonUtil.sendError(res, 404, "Application not found");
                    return;
                }
                JsonUtil.sendSuccess(res, 200, "Application retrieved", app);
            } catch (NumberFormatException e) {
                JsonUtil.sendError(res, 400, "Invalid application ID");
            }
            return;
        }

        // GET /api/jobs/{id}
        Long jobId = parseIdFromPath(req);
        if (jobId != null) {
            JobPosting job = jobDao.findJobById(jobId);
            if (job == null) {
                JsonUtil.sendError(res, 404, "Job posting not found");
                return;
            }
            JsonUtil.sendSuccess(res, 200, "Job posting retrieved", job);
            return;
        }

        // GET /api/jobs — list
        String status = req.getParameter("status");
        String department = req.getParameter("department");
        int limit = 50;
        int offset = 0;
        try { if (req.getParameter("limit") != null) limit = Integer.parseInt(req.getParameter("limit")); } catch (NumberFormatException ignored) {}
        try { if (req.getParameter("offset") != null) offset = Integer.parseInt(req.getParameter("offset")); } catch (NumberFormatException ignored) {}

        if (!"ADMIN".equals(getAuthenticatedRole(req))) status = "ACTIVE";
        List<JobPosting> jobs = jobDao.listJobPostings(status, department, Math.max(1, Math.min(100, limit)), Math.max(0, offset));
        JsonUtil.sendSuccess(res, 200, "Job postings retrieved", jobs);
    }

    // ─── POST ────────────────────────────────────────────────────────────
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {
        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        // POST /api/jobs/apply — public job application submission
        if ("/apply".equals(path)) {
            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("jobId") || !body.has("applicantName") || !body.has("email")) {
                JsonUtil.sendError(res, 400, "jobId, applicantName, and email are required");
                return;
            }

            long targetJobId = body.get("jobId").getAsLong();
            JobPosting job = jobDao.findJobById(targetJobId);
            if (job == null) {
                JsonUtil.sendError(res, 404, "Job posting not found");
                return;
            }
            if (!"ACTIVE".equalsIgnoreCase(job.getStatus())) {
                JsonUtil.sendError(res, 400, "This position is no longer accepting applications");
                return;
            }

            JobApplication app = new JobApplication();
            app.setJobId(targetJobId);
            app.setApplicantName(body.get("applicantName").getAsString().trim());
            app.setEmail(body.get("email").getAsString().trim());
            app.setPhone(body.has("phone") && !body.get("phone").isJsonNull() ? body.get("phone").getAsString().trim() : null);
            app.setPortfolioUrl(body.has("portfolioUrl") && !body.get("portfolioUrl").isJsonNull() ? body.get("portfolioUrl").getAsString().trim() : null);
            app.setResumeFilename(body.has("resumeFilename") && !body.get("resumeFilename").isJsonNull() ? body.get("resumeFilename").getAsString().trim() : null);
            app.setCoverNote(body.has("coverNote") && !body.get("coverNote").isJsonNull() ? body.get("coverNote").getAsString().trim() : null);
            app.setExperienceYears(body.has("experienceYears") && !body.get("experienceYears").isJsonNull() ? body.get("experienceYears").getAsString().trim() : null);
            app.setCurrentCompany(body.has("currentCompany") && !body.get("currentCompany").isJsonNull() ? body.get("currentCompany").getAsString().trim() : null);
            app.setStatus("UNDER_REVIEW");

            if (app.getApplicantName().length() < 2 || app.getApplicantName().length() > 200 || !app.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || app.getEmail().length()>255 || app.getResumeFilename()==null || !app.getResumeFilename().startsWith("https://") || app.getResumeFilename().length()>255) {
                JsonUtil.sendError(res,400,"Valid name, email and HTTPS resume link (maximum 255 characters) are required"); return;
            }
            Long appId = jobDao.createApplication(app);
            if (appId == null) {
                JsonUtil.sendError(res, 500, "An unexpected error occurred while processing your application");
                return;
            }

            JsonUtil.sendSuccess(res, 201, "Application submitted successfully", appId);
            return;
        }

        // POST /api/jobs/applications/{id}/status — admin status update
        if (path.startsWith("/applications/") && path.endsWith("/status")) {
            if (!requireAdmin(req, res)) return;

            String idStr = path.replaceFirst("^/applications/", "").replace("/status", "");
            try {
                long appId = Long.parseLong(idStr);
                JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                if (body == null || !body.has("status")) {
                    JsonUtil.sendError(res, 400, "status is required");
                    return;
                }
                String newStatus = body.get("status").getAsString();
                Long reviewedBy = getAuthenticatedUserId(req);
                String notes = body.has("adminNotes") && !body.get("adminNotes").isJsonNull() ? body.get("adminNotes").getAsString() : null;

                jobDao.updateApplicationStatus(appId, newStatus, reviewedBy, notes);
                JsonUtil.sendSuccess(res, 200, "Application status updated", null);
            } catch (NumberFormatException e) {
                JsonUtil.sendError(res, 400, "Invalid application ID");
            }
            return;
        }

        // POST /api/jobs — create new job posting (admin only)
        if (path.isEmpty() || "/".equals(path)) {
            if (!requireAdmin(req, res)) return;

            JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
            if (body == null || !body.has("title") || !body.has("department") || !body.has("description")) {
                JsonUtil.sendError(res, 400, "title, department, and description are required");
                return;
            }

            JobPosting job = parseJobFromBody(body);
            job.setCreatedBy(getAuthenticatedUserId(req));

            Long newId = jobDao.createJobPosting(job);
            if (newId == null) {
                JsonUtil.sendError(res, 500, "An unexpected error occurred while creating the job posting");
                return;
            }

            job.setId(newId);
            JsonUtil.sendSuccess(res, 201, "Job posting created", job);
        }
    }

    // ─── PUT ─────────────────────────────────────────────────────────────
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAdmin(req, res)) return;

        String path = req.getPathInfo() != null ? req.getPathInfo() : "";

        // PUT /api/jobs/{id}/status
        if (path.endsWith("/status")) {
            String idStr = path.replace("/status", "").replaceFirst("^/", "");
            try {
                long jobId = Long.parseLong(idStr);
                JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
                if (body == null || !body.has("status")) {
                    JsonUtil.sendError(res, 400, "status is required");
                    return;
                }
                jobDao.updateJobStatus(jobId, body.get("status").getAsString());
                JsonUtil.sendSuccess(res, 200, "Job status updated", null);
            } catch (NumberFormatException e) {
                JsonUtil.sendError(res, 400, "Invalid job ID");
            }
            return;
        }

        // PUT /api/jobs/{id}
        Long jobId = parseIdFromPath(req);
        if (jobId == null) {
            JsonUtil.sendError(res, 400, "Job ID is required");
            return;
        }

        JsonObject body = JsonUtil.readRequestBody(req, JsonObject.class);
        if (body == null) {
            JsonUtil.sendError(res, 400, "Request body is required");
            return;
        }

        JobPosting existing = jobDao.findJobById(jobId);
        if (existing == null) {
            JsonUtil.sendError(res, 404, "Job posting not found");
            return;
        }

        JobPosting job = parseJobFromBody(body);
        job.setId(jobId);
        if (job.getStatus() == null) job.setStatus(existing.getStatus());

        jobDao.updateJobPosting(job);
        JsonUtil.sendSuccess(res, 200, "Job posting updated", null);
    }

    // ─── DELETE ──────────────────────────────────────────────────────────
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse res) throws IOException {
        if (!requireAdmin(req, res)) return;

        Long jobId = parseIdFromPath(req);
        if (jobId == null) {
            JsonUtil.sendError(res, 400, "Job ID is required");
            return;
        }

        jobDao.deleteJobPosting(jobId);
        JsonUtil.sendSuccess(res, 200, "Job posting deleted", null);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private JobPosting parseJobFromBody(JsonObject body) {
        JobPosting job = new JobPosting();
        if (body.has("title") && !body.get("title").isJsonNull()) job.setTitle(body.get("title").getAsString().trim());
        if (body.has("department") && !body.get("department").isJsonNull()) job.setDepartment(body.get("department").getAsString().trim());
        if (body.has("location") && !body.get("location").isJsonNull()) job.setLocation(body.get("location").getAsString().trim());
        if (body.has("employmentType") && !body.get("employmentType").isJsonNull()) job.setEmploymentType(body.get("employmentType").getAsString().trim());
        if (body.has("experienceLevel") && !body.get("experienceLevel").isJsonNull()) job.setExperienceLevel(body.get("experienceLevel").getAsString().trim());
        if (body.has("salaryMin") && !body.get("salaryMin").isJsonNull()) {
            try { job.setSalaryMin(body.get("salaryMin").getAsBigDecimal()); } catch (Exception ignored) {}
        }
        if (body.has("salaryMax") && !body.get("salaryMax").isJsonNull()) {
            try { job.setSalaryMax(body.get("salaryMax").getAsBigDecimal()); } catch (Exception ignored) {}
        }
        if (body.has("salaryDisplay") && !body.get("salaryDisplay").isJsonNull()) job.setSalaryDisplay(body.get("salaryDisplay").getAsString().trim());
        if (body.has("description") && !body.get("description").isJsonNull()) job.setDescription(body.get("description").getAsString().trim());
        if (body.has("responsibilities") && !body.get("responsibilities").isJsonNull()) job.setResponsibilities(body.get("responsibilities").getAsString().trim());
        if (body.has("requirements") && !body.get("requirements").isJsonNull()) job.setRequirements(body.get("requirements").getAsString().trim());
        if (body.has("benefits") && !body.get("benefits").isJsonNull()) job.setBenefits(body.get("benefits").getAsString().trim());
        if (body.has("tags") && !body.get("tags").isJsonNull()) job.setTags(body.get("tags").getAsString().trim());
        if (body.has("status") && !body.get("status").isJsonNull()) job.setStatus(body.get("status").getAsString().trim());
        return job;
    }
}
