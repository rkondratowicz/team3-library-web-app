-- Migration: Add Email Validation to Members Table
-- This migration adds a CHECK constraint to ensure email addresses contain '@' symbol
-- Date: 2025-09-25

-- First, create a new table with the validation constraint
CREATE TABLE members_new (
    ID TEXT PRIMARY KEY,
    memberName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@%'),
    phone VARCHAR(20),
    memAddress TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    max_books INTEGER DEFAULT 3 CHECK (max_books BETWEEN 1 AND 10),
    member_since DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data (only records with valid emails)
INSERT INTO members_new (ID, memberName, email, phone, memAddress, status, max_books, member_since, updated_at)
SELECT 
    ID, 
    memberName, 
    email, 
    phone, 
    memAddress,
    'active' as status,
    3 as max_books,
    CURRENT_TIMESTAMP as member_since,
    CURRENT_TIMESTAMP as updated_at
FROM members 
WHERE email LIKE '%@%';

-- Drop the old table
DROP TABLE members;

-- Rename the new table
ALTER TABLE members_new RENAME TO members;

-- Create indexes for performance
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_name ON members(memberName);

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_members_timestamp 
    AFTER UPDATE ON members
    FOR EACH ROW
    BEGIN
        UPDATE members SET updated_at = CURRENT_TIMESTAMP WHERE ID = NEW.ID;
    END;

-- Validation: Show count of members with valid emails
SELECT 'Members with valid emails: ' || COUNT(*) as validation_result FROM members WHERE email LIKE '%@%';