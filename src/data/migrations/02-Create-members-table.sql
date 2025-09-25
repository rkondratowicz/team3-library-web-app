CREATE TABLE members (
    ID TEXT PRIMARY KEY,
    memberName VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    memAddress TEXT,
    status TEXT DEFAULT 'active',
    max_books INTEGER DEFAULT 3,
    member_since DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);