CREATE TABLE book_copies (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    copy_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'borrowed', 'maintenance'
    condition VARCHAR(20) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE(book_id, copy_number)
);

-- Create indexes for efficient queries
CREATE INDEX idx_book_copies_book_id ON book_copies(book_id);
CREATE INDEX idx_book_copies_status ON book_copies(status);
CREATE INDEX idx_book_copies_condition ON book_copies(condition);