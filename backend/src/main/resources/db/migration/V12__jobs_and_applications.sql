-- ==============================================================================
-- CravePulse: Jobs & Applications System
-- Migration: V12__jobs_and_applications.sql
-- Creates tables for job postings and job applications
-- ==============================================================================

-- 1. Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    department      VARCHAR(150)    NOT NULL,
    location        VARCHAR(200)    NOT NULL,
    employment_type VARCHAR(50)     NOT NULL DEFAULT 'Full-time',
    experience_level VARCHAR(100)   DEFAULT NULL,
    salary_min      DECIMAL(12,2)   DEFAULT NULL,
    salary_max      DECIMAL(12,2)   DEFAULT NULL,
    salary_display  VARCHAR(100)    DEFAULT NULL,
    description     TEXT            NOT NULL,
    responsibilities TEXT           DEFAULT NULL,
    requirements    TEXT            DEFAULT NULL,
    benefits        TEXT            DEFAULT NULL,
    tags            VARCHAR(500)    DEFAULT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_by      BIGINT          DEFAULT NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_job_status (status),
    INDEX idx_job_department (department),
    INDEX idx_job_created (created_at DESC)
);

-- 2. Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
    id              BIGINT          AUTO_INCREMENT PRIMARY KEY,
    job_id          BIGINT          NOT NULL,
    applicant_name  VARCHAR(200)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone           VARCHAR(30)     DEFAULT NULL,
    portfolio_url   VARCHAR(500)    DEFAULT NULL,
    resume_filename VARCHAR(255)    DEFAULT NULL,
    cover_note      TEXT            DEFAULT NULL,
    experience_years VARCHAR(50)    DEFAULT NULL,
    current_company VARCHAR(200)    DEFAULT NULL,
    status          VARCHAR(30)     NOT NULL DEFAULT 'UNDER_REVIEW',
    applied_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP       DEFAULT NULL,
    reviewed_by     BIGINT          DEFAULT NULL,
    admin_notes     TEXT            DEFAULT NULL,
    INDEX idx_app_job (job_id),
    INDEX idx_app_status (status),
    INDEX idx_app_email (email),
    INDEX idx_app_applied (applied_at DESC),
    CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE
);

