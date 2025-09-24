# Task 3.1: Create Borrowing Database Schema

## Objective
Design and implement the database schema for the borrowing system, including borrowing transactions, due dates, returns, and fine management. This schema will support the complete borrowing workflow and integrate with existing book and member systems.

## Current State
- Book system implemented by Person 1 (books, copies, inventory)
- Member system implemented by Person 2 (members, eligibility)
- Need borrowing transaction system and fine management

## What You Will Create
- Complete borrowing database schema
- Migration script for borrowing tables
- Indexes for performance optimization
- Seed data for testing

## Step-by-Step Instructions

### Step 1: Analyze Existing Schema and Requirements

1. **Check existing database structure:**
   ```bash
   # Examine current database
   sqlite3 library.db ".tables"
   sqlite3 library.db ".schema books"
   sqlite3 library.db ".schema members"
   ```

2. **Review the PRD requirements for borrowing:**
   - Members can borrow multiple books (up to their limit)
   - Track borrowing dates, due dates, return dates
   - Calculate and manage overdue fines
   - Support renewals and reserves
   - Track borrowing history for analytics

### Step 2: Design the Borrowing Schema

1. **Create the borrowing migration file:**
   ```bash
   touch src/data/migrations/03-Create-borrowing-tables.sql
   ```

2. **Add the complete borrowing schema to `src/data/migrations/03-Create-borrowing-tables.sql`:**
   ```sql
   -- ==========================================
   -- Borrowing System Database Schema
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
       
       FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
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
       FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
       
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
       
       FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
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
       m.name as member_name,
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
   JOIN members m ON b.member_id = m.id
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
   ```

### Step 3: Create Seed Data for Testing

1. **Create borrowing seed data file:**
   ```bash
   touch src/data/seeds/borrowings.sql
   ```

2. **Add test data to `src/data/seeds/borrowings.sql`:**
   ```sql
   -- ==========================================
   -- Borrowing System Seed Data
   -- ==========================================

   -- Sample borrowing transactions
   INSERT OR IGNORE INTO borrowings (
       id, member_id, book_copy_id, borrowed_date, due_date, 
       returned_date, renewal_count, status, notes
   ) VALUES
   -- Active borrowings
   ('550e8400-e29b-41d4-a716-446655440001', 
    (SELECT id FROM members LIMIT 1), 
    (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1), 
    date('now', '-5 days'), 
    date('now', '+9 days'), 
    NULL, 0, 'active', 'Regular borrowing'),

   ('550e8400-e29b-41d4-a716-446655440002', 
    (SELECT id FROM members LIMIT 1 OFFSET 1), 
    (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 1), 
    date('now', '-10 days'), 
    date('now', '+4 days'), 
    NULL, 1, 'active', 'Renewed once'),

   -- Overdue borrowing
   ('550e8400-e29b-41d4-a716-446655440003', 
    (SELECT id FROM members LIMIT 1 OFFSET 2), 
    (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 2), 
    date('now', '-20 days'), 
    date('now', '-3 days'), 
    NULL, 0, 'overdue', 'Overdue borrowing'),

   -- Returned borrowings
   ('550e8400-e29b-41d4-a716-446655440004', 
    (SELECT id FROM members LIMIT 1), 
    (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 3), 
    date('now', '-30 days'), 
    date('now', '-16 days'), 
    date('now', '-17 days'), 0, 'returned', 'Returned on time'),

   ('550e8400-e29b-41d4-a716-446655440005', 
    (SELECT id FROM members LIMIT 1 OFFSET 1), 
    (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 4), 
    date('now', '-45 days'), 
    date('now', '-31 days'), 
    date('now', '-28 days'), 2, 'returned', 'Returned late after renewals');

   -- Sample fines
   INSERT OR IGNORE INTO fines (
       id, borrowing_id, member_id, fine_type, amount, 
       assessed_date, paid_date, status, description
   ) VALUES
   -- Unpaid overdue fine
   ('f50e8400-e29b-41d4-a716-446655440001', 
    '550e8400-e29b-41d4-a716-446655440003',
    (SELECT member_id FROM borrowings WHERE id = '550e8400-e29b-41d4-a716-446655440003'), 
    'overdue', 1.50, 
    date('now', '-2 days'), 
    NULL, 'unpaid', 'Overdue fine - 3 days late'),

   -- Paid late return fine
   ('f50e8400-e29b-41d4-a716-446655440002', 
    '550e8400-e29b-41d4-a716-446655440005',
    (SELECT member_id FROM borrowings WHERE id = '550e8400-e29b-41d4-a716-446655440005'), 
    'late_return', 3.00, 
    date('now', '-28 days'), 
    date('now', '-25 days'), 'paid', 'Late return fine - 3 days late');

   -- Sample reservations
   INSERT OR IGNORE INTO reservations (
       id, member_id, book_id, reserved_date, expiry_date, 
       status, priority, fulfilled_date, notes
   ) VALUES
   -- Active reservation
   ('r50e8400-e29b-41d4-a716-446655440001', 
    (SELECT id FROM members WHERE status = 'active' LIMIT 1), 
    (SELECT id FROM books LIMIT 1), 
    date('now', '-2 days'), 
    date('now', '+5 days'), 
    'active', 1, NULL, 'Waiting for book availability'),

   -- Fulfilled reservation
   ('r50e8400-e29b-41d4-a716-446655440002', 
    (SELECT id FROM members WHERE status = 'active' LIMIT 1 OFFSET 1), 
    (SELECT id FROM books LIMIT 1 OFFSET 1), 
    date('now', '-10 days'), 
    date('now', '-3 days'), 
    'fulfilled', 1, date('now', '-5 days'), 'Reservation fulfilled');

   -- Update some book copy statuses to reflect borrowings
   UPDATE book_copies 
   SET status = 'borrowed' 
   WHERE id IN (
       SELECT book_copy_id FROM borrowings WHERE status = 'active' OR status = 'overdue'
   );
   ```

### Step 4: Run the Migration and Seed Data

1. **Execute the borrowing migration:**
   ```bash
   # Run the migration
   sqlite3 library.db < src/data/migrations/03-Create-borrowing-tables.sql
   
   # Verify tables were created
   sqlite3 library.db ".tables"
   ```

2. **Load the seed data:**
   ```bash
   # Load borrowing seed data
   sqlite3 library.db < src/data/seeds/borrowings.sql
   
   # Verify data was loaded
   sqlite3 library.db "SELECT COUNT(*) as borrowing_count FROM borrowings;"
   sqlite3 library.db "SELECT COUNT(*) as fine_count FROM fines;"
   sqlite3 library.db "SELECT COUNT(*) as reservation_count FROM reservations;"
   ```

### Step 5: Validate the Schema

1. **Test the schema with sample queries:**
   ```bash
   # Create schema validation script
   cat > validate-borrowing-schema.sql << 'EOF'
   -- Schema validation queries
   
   -- 1. Check table structures
   .schema borrowings
   .schema fines  
   .schema reservations
   
   -- 2. Test basic queries
   SELECT 'Active borrowings:' as test, COUNT(*) as count FROM borrowings WHERE status = 'active';
   SELECT 'Overdue borrowings:' as test, COUNT(*) as count FROM borrowings WHERE status = 'overdue';
   SELECT 'Unpaid fines:' as test, COUNT(*) as count FROM fines WHERE status = 'unpaid';
   SELECT 'Active reservations:' as test, COUNT(*) as count FROM reservations WHERE status = 'active';
   
   -- 3. Test the borrowing history view
   SELECT 'Borrowing history view:' as test, COUNT(*) as count FROM borrowing_history;
   
   -- 4. Test foreign key relationships
   SELECT 'Members with borrowings:' as test, COUNT(DISTINCT b.member_id) as count 
   FROM borrowings b 
   JOIN members m ON b.member_id = m.id;
   
   SELECT 'Books with borrowings:' as test, COUNT(DISTINCT bc.book_id) as count 
   FROM borrowings b 
   JOIN book_copies bc ON b.book_copy_id = bc.id;
   
   -- 5. Test complex analytics query
   SELECT 
       m.name as member_name,
       COUNT(b.id) as total_borrowings,
       COUNT(CASE WHEN b.status = 'active' THEN 1 END) as active_borrowings,
       COUNT(CASE WHEN b.status = 'overdue' THEN 1 END) as overdue_borrowings,
       COALESCE(SUM(f.amount), 0) as total_fines
   FROM members m
   LEFT JOIN borrowings b ON m.id = b.member_id
   LEFT JOIN fines f ON m.id = f.member_id AND f.status = 'unpaid'
   GROUP BY m.id, m.name
   HAVING COUNT(b.id) > 0
   ORDER BY total_borrowings DESC;
   EOF
   
   # Run validation
   sqlite3 library.db < validate-borrowing-schema.sql
   
   # Clean up
   rm validate-borrowing-schema.sql
   ```

2. **Test constraint validation:**
   ```bash
   # Create constraint test script
   cat > test-constraints.sql << 'EOF'
   -- Test database constraints
   
   -- 1. Test borrowing status constraint
   .print "Testing borrowing status constraint..."
   INSERT INTO borrowings (id, member_id, book_copy_id, borrowed_date, due_date, status) 
   VALUES ('test-status', 
           (SELECT id FROM members LIMIT 1), 
           (SELECT id FROM book_copies LIMIT 1), 
           date('now'), date('now', '+14 days'), 'invalid_status');
   -- This should fail
   
   -- 2. Test date constraint (borrowed_date <= due_date)
   .print "Testing date constraint..."
   INSERT INTO borrowings (id, member_id, book_copy_id, borrowed_date, due_date, status) 
   VALUES ('test-date', 
           (SELECT id FROM members LIMIT 1), 
           (SELECT id FROM book_copies LIMIT 1), 
           date('now', '+1 day'), date('now'), 'active');
   -- This should fail
   
   -- 3. Test fine amount constraint (amount >= 0)
   .print "Testing fine amount constraint..."
   INSERT INTO fines (id, borrowing_id, member_id, fine_type, amount, assessed_date, status) 
   VALUES ('test-amount', 
           (SELECT id FROM borrowings LIMIT 1), 
           (SELECT id FROM members LIMIT 1), 
           'overdue', -5.00, date('now'), 'unpaid');
   -- This should fail
   
   .print "Constraint tests completed (errors above are expected)"
   EOF
   
   # Run constraint tests (expect errors - this validates constraints work)
   sqlite3 library.db < test-constraints.sql 2>&1 | head -20
   
   # Clean up
   rm test-constraints.sql
   ```

### Step 6: Create Schema Documentation

1. **Document the borrowing schema:**
   ```bash
   cat > borrowing-schema-documentation.md << 'EOF'
   # Borrowing System Database Schema Documentation

   ## Tables Overview

   ### borrowings
   Main table for tracking borrowing transactions.

   **Fields:**
   - `id` (TEXT, PK): Unique borrowing transaction ID (UUID)
   - `member_id` (TEXT, FK): Reference to member who borrowed the book
   - `book_copy_id` (TEXT, FK): Reference to specific book copy borrowed
   - `borrowed_date` (DATE): Date the book was borrowed
   - `due_date` (DATE): Date the book is due for return
   - `returned_date` (DATE, NULL): Date the book was actually returned
   - `renewal_count` (INTEGER): Number of times renewed (0-3)
   - `status` (TEXT): Current status (active, returned, overdue, lost)
   - `notes` (TEXT): Optional notes about the borrowing
   - `created_at` (DATETIME): Record creation timestamp
   - `updated_at` (DATETIME): Record last update timestamp

   **Constraints:**
   - Status must be: active, returned, overdue, lost
   - borrowed_date <= due_date
   - returned_date >= borrowed_date (if not NULL)
   - renewal_count: 0-3

   ### fines
   Table for tracking fines associated with borrowings.

   **Fields:**
   - `id` (TEXT, PK): Unique fine ID (UUID)
   - `borrowing_id` (TEXT, FK): Reference to borrowing that generated fine
   - `member_id` (TEXT, FK): Reference to member who owes the fine
   - `fine_type` (TEXT): Type of fine (overdue, lost, damage, late_return)
   - `amount` (DECIMAL): Fine amount in currency
   - `assessed_date` (DATE): Date fine was assessed
   - `paid_date` (DATE, NULL): Date fine was paid
   - `status` (TEXT): Payment status (unpaid, paid, waived, disputed)
   - `description` (TEXT): Description of the fine
   - `created_at` (DATETIME): Record creation timestamp
   - `updated_at` (DATETIME): Record last update timestamp

   **Constraints:**
   - fine_type must be: overdue, lost, damage, late_return
   - amount >= 0
   - status must be: unpaid, paid, waived, disputed
   - paid_date >= assessed_date (if not NULL)

   ### reservations
   Table for tracking book reservations by members.

   **Fields:**
   - `id` (TEXT, PK): Unique reservation ID (UUID)
   - `member_id` (TEXT, FK): Reference to member making reservation
   - `book_id` (TEXT, FK): Reference to book being reserved
   - `reserved_date` (DATE): Date reservation was made
   - `expiry_date` (DATE): Date reservation expires
   - `status` (TEXT): Reservation status (active, fulfilled, cancelled, expired)
   - `priority` (INTEGER): Priority in reservation queue (1 = highest)
   - `fulfilled_date` (DATE, NULL): Date reservation was fulfilled
   - `notes` (TEXT): Optional notes about reservation
   - `created_at` (DATETIME): Record creation timestamp
   - `updated_at` (DATETIME): Record last update timestamp

   **Constraints:**
   - status must be: active, fulfilled, cancelled, expired
   - reserved_date <= expiry_date
   - priority >= 1
   - fulfilled_date >= reserved_date (if not NULL)

   ## Views

   ### borrowing_history
   Comprehensive view combining borrowing data with member and book information for analytics.

   **Calculated Fields:**
   - `days_borrowed`: Number of days book has been/was borrowed
   - `overdue_days`: Number of days overdue (0 if not overdue)

   ## Indexes

   **Performance Indexes:**
   - `idx_borrowings_member_id`: Fast member borrowing lookups
   - `idx_borrowings_book_copy_id`: Fast book copy status checks
   - `idx_borrowings_status`: Status-based queries
   - `idx_borrowings_due_date`: Overdue checks and due date queries
   - `idx_fines_member_id`: Member fine lookups
   - `idx_reservations_book_id`: Book reservation queries

   ## Triggers

   ### Automatic Updates
   - `update_borrowings_timestamp`: Updates timestamp on borrowing changes
   - `update_fines_timestamp`: Updates timestamp on fine changes
   - `update_reservations_timestamp`: Updates timestamp on reservation changes

   ### Business Logic
   - `update_overdue_status`: Automatically marks borrowings as overdue
   - `update_copy_on_borrow`: Marks book copies as borrowed
   - `update_copy_on_return`: Marks book copies as available when returned

   ## Integration Points

   **With Member System:**
   - borrowings.member_id → members.id
   - Member eligibility checking considers active borrowings and unpaid fines

   **With Book System:**
   - borrowings.book_copy_id → book_copies.id
   - reservations.book_id → books.id
   - Book availability updated based on borrowing status

   ## Usage Examples

   ```sql
   -- Find all overdue borrowings
   SELECT * FROM borrowing_history WHERE status = 'overdue';
   
   -- Get member's current borrowings
   SELECT * FROM borrowing_history WHERE member_id = ? AND status = 'active';
   
   -- Calculate total unpaid fines for a member
   SELECT SUM(amount) FROM fines WHERE member_id = ? AND status = 'unpaid';
   
   -- Find available copies of a book
   SELECT bc.* FROM book_copies bc 
   WHERE bc.book_id = ? AND bc.status = 'available';
   ```
   EOF

   echo "Schema documentation created in borrowing-schema-documentation.md"
   ```

## Expected Results
- ✅ Complete borrowing database schema implemented
- ✅ Three new tables: borrowings, fines, reservations
- ✅ Borrowing history view for analytics
- ✅ Performance indexes created
- ✅ Database triggers for automation
- ✅ Foreign key relationships established
- ✅ Constraints enforced for data integrity
- ✅ Seed data loaded successfully
- ✅ Schema validation tests passed

## Database Objects Created

### Tables
- ✅ `borrowings` - Main borrowing transactions
- ✅ `fines` - Fine management
- ✅ `reservations` - Book reservations

### Views
- ✅ `borrowing_history` - Analytics view

### Indexes
- ✅ 13 performance indexes
- ✅ Optimized for common queries

### Triggers
- ✅ 6 triggers for automation
- ✅ Business logic enforcement

## Troubleshooting

### If migration fails:
1. Check that members and book_copies tables exist
2. Verify foreign key references are correct
3. Check SQL syntax in migration file

### If constraints fail:
1. Review constraint definitions
2. Test with valid data first
3. Check data types match requirements

### If seed data fails:
1. Ensure migration ran successfully first
2. Check that referenced IDs exist
3. Verify data meets constraint requirements

## Next Steps
After completing this task, proceed to Task 3.2: Create Borrowing TypeScript Interfaces.

## Files Created
- ✅ `src/data/migrations/03-Create-borrowing-tables.sql` (complete schema)
- ✅ `src/data/seeds/borrowings.sql` (test data)
- ✅ `borrowing-schema-documentation.md` (documentation)