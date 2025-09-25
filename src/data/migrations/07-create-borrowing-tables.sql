-- ==========================================
-- Borrowing System Database Schema
-- Migration 07: Create Borrowing Tables
-- ==========================================

-- Borrowing transactions table
CREATE TABLE IF NOT EXISTS borrowings (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    book_copy_id TEXT NOT NULL,
    borrowed_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE NULL,
    renewal_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(ID) ON DELETE CASCADE,
    FOREIGN KEY (book_copy_id) REFERENCES book_copies(id) ON DELETE CASCADE,
    
    CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
    CHECK (borrowed_date <= due_date),
    CHECK (returned_date IS NULL OR returned_date >= borrowed_date),
    CHECK (renewal_count >= 0 AND renewal_count <= 3)
);

-- Fines table for overdue and lost books
CREATE TABLE IF NOT EXISTS fines (
    id TEXT PRIMARY KEY,
    borrowing_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    fine_type TEXT NOT NULL,
    amount DECIMAL(8,2) NOT NULL,
    assessed_date DATE NOT NULL,
    paid_date DATE NULL,
    status TEXT NOT NULL DEFAULT 'unpaid',
    description TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (borrowing_id) REFERENCES borrowings(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(ID) ON DELETE CASCADE,
    
    CHECK (fine_type IN ('overdue', 'lost', 'damage', 'late_return')),
    CHECK (amount >= 0),
    CHECK (status IN ('unpaid', 'paid', 'waived', 'disputed')),
    CHECK (paid_date IS NULL OR paid_date >= assessed_date)
);

-- Reservations table for members to reserve books
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    reserved_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    priority INTEGER DEFAULT 1,
    fulfilled_date DATE NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES members(ID) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired')),
    CHECK (reserved_date <= expiry_date),
    CHECK (priority >= 1),
    CHECK (fulfilled_date IS NULL OR fulfilled_date >= reserved_date)
);

-- Borrowing history view for analytics
CREATE VIEW IF NOT EXISTS borrowing_history AS
SELECT 
    b.id,
    b.member_id,
    m.memberName as member_name,
    m.email as member_email,
    b.book_copy_id,
    bc.book_id,
    bk.title as book_title,
    bk.author as book_author,
    bk.isbn,
    b.borrowed_date,
    b.due_date,
    b.returned_date,
    b.renewal_count,
    b.status,
    -- Calculate days borrowed
    CASE 
        WHEN b.returned_date IS NOT NULL 
        THEN julianday(b.returned_date) - julianday(b.borrowed_date)
        ELSE julianday('now') - julianday(b.borrowed_date)
    END as days_borrowed,
    -- Calculate overdue days
    CASE 
        WHEN b.status = 'overdue' OR (b.returned_date IS NULL AND julianday('now') > julianday(b.due_date))
        THEN CASE 
            WHEN b.returned_date IS NOT NULL 
            THEN julianday(b.returned_date) - julianday(b.due_date)
            ELSE julianday('now') - julianday(b.due_date)
        END
        ELSE 0
    END as overdue_days,
    b.created_at,
    b.updated_at
FROM borrowings b
JOIN members m ON b.member_id = m.ID
JOIN book_copies bc ON b.book_copy_id = bc.id
JOIN books bk ON bc.book_id = bk.id;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_borrowings_member_id ON borrowings(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_copy_id ON borrowings(book_copy_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON borrowings(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_due_date ON borrowings(due_date);
CREATE INDEX IF NOT EXISTS idx_borrowings_borrowed_date ON borrowings(borrowed_date);
CREATE INDEX IF NOT EXISTS idx_borrowings_returned_date ON borrowings(returned_date);

CREATE INDEX IF NOT EXISTS idx_fines_borrowing_id ON fines(borrowing_id);
CREATE INDEX IF NOT EXISTS idx_fines_member_id ON fines(member_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_assessed_date ON fines(assessed_date);

CREATE INDEX IF NOT EXISTS idx_reservations_member_id ON reservations(member_id);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_date ON reservations(reserved_date);

-- Triggers for automatic timestamp updates
CREATE TRIGGER IF NOT EXISTS update_borrowings_timestamp 
AFTER UPDATE ON borrowings
BEGIN
    UPDATE borrowings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_fines_timestamp 
AFTER UPDATE ON fines
BEGIN
    UPDATE fines SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_reservations_timestamp 
AFTER UPDATE ON reservations
BEGIN
    UPDATE reservations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to automatically update borrowing status to overdue
CREATE TRIGGER IF NOT EXISTS update_overdue_status
AFTER UPDATE ON borrowings
FOR EACH ROW
WHEN NEW.returned_date IS NULL 
     AND julianday('now') > julianday(NEW.due_date) 
     AND NEW.status = 'active'
BEGIN
    UPDATE borrowings 
    SET status = 'overdue', updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger to update book copy availability when borrowed
CREATE TRIGGER IF NOT EXISTS update_copy_on_borrow
AFTER INSERT ON borrowings
FOR EACH ROW
WHEN NEW.status = 'active'
BEGIN
    UPDATE book_copies 
    SET status = 'borrowed', updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.book_copy_id;
END;

-- Trigger to update book copy availability when returned
CREATE TRIGGER IF NOT EXISTS update_copy_on_return
AFTER UPDATE ON borrowings
FOR EACH ROW
WHEN NEW.returned_date IS NOT NULL AND OLD.returned_date IS NULL
BEGIN
    UPDATE book_copies 
    SET status = 'available', updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.book_copy_id;
END;