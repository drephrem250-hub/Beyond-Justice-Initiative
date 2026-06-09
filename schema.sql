-- Beyond Justice Initiative (Rinda Mwana)
-- PostgreSQL Relational Database Schema Paradigm
-- Maps Mother Profile to Child Profile and logs legal outcome tracking

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums for status integrity
CREATE TYPE school_status_type AS ENUM (
    'in_school', 
    'dropped_out', 
    'reintegrated', 
    'vocational', 
    'na'
);

CREATE TYPE payment_regularity_type AS ENUM (
    'regular', 
    'occasional', 
    'none'
);

CREATE TYPE priority_level_type AS ENUM (
    'critical', 
    'high', 
    'medium', 
    'low'
);

CREATE TYPE court_outcome_type AS ENUM (
    'convicted', 
    'acquitted', 
    'dismissed', 
    'pending', 
    'na'
);

CREATE TYPE validation_status_type AS ENUM (
    'pending', 
    'active', 
    'closed'
);

-- 1. Mother Profile Entity
CREATE TABLE mother_profiles (
    mother_id VARCHAR(50) PRIMARY KEY, -- e.g. Unique Case Code/ID
    age INT NOT NULL CHECK (age >= 10 AND age <= 24), -- Teen mother demographics
    sector VARCHAR(100) NOT NULL,
    education_level VARCHAR(100),
    school_status school_status_type DEFAULT 'dropped_out',
    family_conflict VARCHAR(255), -- Family rejection or conflict indicator
    economic_status VARCHAR(100), -- Socio-economic category
    entered_by VARCHAR(100) NOT NULL,
    validation_status validation_status_type DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Child Profile Entity (Relational mapping: 1-to-Many or 1-to-1)
CREATE TABLE child_profiles (
    child_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mother_id VARCHAR(50) NOT NULL REFERENCES mother_profiles(mother_id) ON DELETE CASCADE,
    age_months INT CHECK (age_months >= 0),
    sex CHAR(1) CHECK (sex IN ('M', 'F')),
    nutrition_risk VARCHAR(100), -- Nutrition indicator (e.g., Stunted, At Risk, Normal)
    stunting_status BOOLEAN DEFAULT FALSE,
    in_school BOOLEAN DEFAULT FALSE,
    caregiver VARCHAR(100),
    health_access BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Legal and Post-Judgment Enforcement Entity
CREATE TABLE legal_cases (
    case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mother_id VARCHAR(50) UNIQUE NOT NULL REFERENCES mother_profiles(mother_id) ON DELETE CASCADE,
    reported_to_rib BOOLEAN DEFAULT FALSE,
    taken_to_court BOOLEAN DEFAULT FALSE,
    court_verdict court_outcome_type DEFAULT 'na',
    support_amount_ordered NUMERIC(10, 2) DEFAULT 0.00 CHECK (support_amount_ordered >= 0),
    payment_regularity payment_regularity_type DEFAULT 'none',
    father_status VARCHAR(100), -- e.g. Imprisoned, Absconded, Unknown
    not_reported_reason VARCHAR(255),
    priority_level priority_level_type DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Follow-up and Case Tracking Logs
CREATE TABLE followup_records (
    followup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mother_id VARCHAR(50) NOT NULL REFERENCES mother_profiles(mother_id) ON DELETE CASCADE,
    followup_date DATE NOT NULL,
    logged_by VARCHAR(100) NOT NULL,
    school_status_snapshot school_status_type,
    support_status_snapshot payment_regularity_type,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization on common foreign keys and status queries
CREATE INDEX idx_child_mother_id ON child_profiles(mother_id);
CREATE INDEX idx_legal_mother_id ON legal_cases(mother_id);
CREATE INDEX idx_followup_mother_id ON followup_records(mother_id);
CREATE INDEX idx_mother_validation_status ON mother_profiles(validation_status);
CREATE INDEX idx_mother_sector ON mother_profiles(sector);

-- Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mother_profiles_modtime
    BEFORE UPDATE ON mother_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_child_profiles_modtime
    BEFORE UPDATE ON child_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_cases_modtime
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
