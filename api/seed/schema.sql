-- T-Level Quiz database schema
-- Run this once to create all tables.
-- Database: tlevel_quiz

CREATE DATABASE IF NOT EXISTS tlevel_quiz
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tlevel_quiz;

CREATE TABLE IF NOT EXISTS topics (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    title       VARCHAR(255) NOT NULL,
    paper       TINYINT      NOT NULL,
    sort_order  TINYINT      NOT NULL DEFAULT 0,
    active      TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS questions (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    topic_id        INT UNSIGNED NOT NULL,
    question_text   TEXT         NOT NULL,
    option_a        VARCHAR(500) NOT NULL,
    option_b        VARCHAR(500) NOT NULL,
    option_c        VARCHAR(500) NOT NULL,
    option_d        VARCHAR(500) NOT NULL,
    correct_index   TINYINT      NOT NULL,
    formula_hint    VARCHAR(255) DEFAULT NULL,
    formula_note    VARCHAR(500) DEFAULT NULL,
    explanation     TEXT         DEFAULT NULL,
    flagged         TINYINT(1)   NOT NULL DEFAULT 0,
    flag_reason     TEXT         DEFAULT NULL,
    active          TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_question_text (topic_id, question_text(200))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scores (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_key     VARCHAR(64)  NOT NULL,
    quiz_key        VARCHAR(50)  NOT NULL,
    correct         TINYINT      NOT NULL,
    total           TINYINT      NOT NULL,
    pct             TINYINT      NOT NULL,
    elapsed_seconds SMALLINT     NOT NULL,
    practice_mode   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_key),
    INDEX idx_quiz_key (quiz_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS config (
    key_name    VARCHAR(100) PRIMARY KEY,
    key_value   VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO config VALUES
    ('exam_date_paper1', '2027-06-02'),
    ('exam_date_paper2', '2027-06-09'),
    ('quiz_size',        '10'),
    ('mock_size',        '30');
