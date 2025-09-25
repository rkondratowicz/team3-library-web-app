-- Enhance members table with additional fields for better member management
-- This migration adds status tracking, borrowing limits, and timestamps

-- Step 1: Create a backup of existing members data
CREATE TABLE members_backup (
    ID TEXT,
    memberName VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    memAddress TEXT
);
INSERT INTO members_backup SELECT * FROM members;

-- Step 2: Drop the old table
DROP TABLE members;

-- Step 3: Create enhanced members table
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    member_since DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'expired'
    max_books INTEGER DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Restore data from backup with field mapping
INSERT INTO members (id, name, email, phone, address, status, max_books)
SELECT ID, memberName, email, phone, memAddress, 'active', 3 FROM members_backup;

-- Step 5: Create indexes for efficient queries
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_name ON members(name);
CREATE INDEX idx_members_member_since ON members(member_since);

-- Step 6: Create trigger to update updated_at timestamp
CREATE TRIGGER update_members_updated_at
AFTER UPDATE ON members
BEGIN
    UPDATE members SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Step 7: Clean up backup table
DROP TABLE members_backup;