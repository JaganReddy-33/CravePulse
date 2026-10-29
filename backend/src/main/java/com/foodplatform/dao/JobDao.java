package com.foodplatform.dao;

import com.foodplatform.model.JobApplication;
import com.foodplatform.model.JobPosting;

import java.util.List;

public interface JobDao {

    // --- Job Postings ---
    Long createJobPosting(JobPosting job);

    JobPosting findJobById(long id);

    List<JobPosting> listJobPostings(String status, String department, int limit, int offset);

    void updateJobPosting(JobPosting job);

    void updateJobStatus(long jobId, String status);

    void deleteJobPosting(long jobId);

    List<String> listDepartments();

    // --- Job Applications ---
    Long createApplication(JobApplication app);

    JobApplication findApplicationById(long id);

    List<JobApplication> listApplications(Long jobId, String status, int limit, int offset);

    void updateApplicationStatus(long applicationId, String status, Long reviewedBy, String adminNotes);

    int countApplicationsByJob(long jobId);
}

