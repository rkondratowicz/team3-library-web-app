CREATE TABLE IF NOT EXISTS members (
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

-- Create indexes for better query performance
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