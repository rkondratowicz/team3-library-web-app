-- Member Update Operations
-- This file contains SQL operations for updating member details
-- Since SQLite doesn't support stored procedures, these are parameterized queries

-- =============================================================================
-- UPDATE MEMBER BASIC INFORMATION
-- =============================================================================

-- Update member name
-- Usage: Replace ? with member ID and new name
-- Example: sqlite3 library.db "UPDATE members SET name = 'John Smith' WHERE id = 'uuid-here';"
UPDATE members 
SET name = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Update member email (with uniqueness check)
-- Note: This will fail if email already exists due to UNIQUE constraint
UPDATE members 
SET email = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Update member phone
UPDATE members 
SET phone = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Update member address
UPDATE members 
SET address = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- =============================================================================
-- UPDATE MEMBER STATUS AND PRIVILEGES
-- =============================================================================

-- Update member status (active, suspended, expired)
UPDATE members 
SET status = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ?;

-- Update member borrowing limit
UPDATE members 
SET max_books = ?, updated_at = CURRENT_TIMESTAMP 
WHERE id = ? AND max_books BETWEEN 1 AND 10;

-- =============================================================================
-- BULK UPDATE OPERATIONS
-- =============================================================================

-- Update multiple member fields at once
UPDATE members 
SET 
    name = COALESCE(?, name),
    email = COALESCE(?, email),
    phone = COALESCE(?, phone),
    address = COALESCE(?, address),
    status = COALESCE(?, status),
    max_books = COALESCE(?, max_books),
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- =============================================================================
-- MEMBER STATUS MANAGEMENT
-- =============================================================================

-- Suspend a member
UPDATE members 
SET status = 'suspended', updated_at = CURRENT_TIMESTAMP 
WHERE id = ? AND status = 'active';

-- Reactivate a suspended member
UPDATE members 
SET status = 'active', updated_at = CURRENT_TIMESTAMP 
WHERE id = ? AND status IN ('suspended', 'expired');

-- Mark member as expired
UPDATE members 
SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
WHERE id = ? AND status = 'active';

-- =============================================================================
-- BATCH OPERATIONS
-- =============================================================================

-- Suspend all members with overdue books (placeholder - would need joins with borrowing table)
-- UPDATE members 
-- SET status = 'suspended', updated_at = CURRENT_TIMESTAMP 
-- WHERE id IN (SELECT DISTINCT member_id FROM borrowing_transactions WHERE return_date < date('now', '-30 days'));

-- Expire members who haven't been active for a year
UPDATE members 
SET status = 'expired', updated_at = CURRENT_TIMESTAMP 
WHERE member_since < date('now', '-1 year') AND status = 'active';

-- Reset borrowing limits for all active members (e.g., new year reset)
UPDATE members 
SET max_books = 3, updated_at = CURRENT_TIMESTAMP 
WHERE status = 'active';

-- =============================================================================
-- VALIDATION QUERIES (to run before updates)
-- =============================================================================

-- Check if member exists
SELECT COUNT(*) as member_exists FROM members WHERE id = ?;

-- Check if email is already in use by another member
SELECT COUNT(*) as email_in_use FROM members WHERE email = ? AND id != ?;

-- Check current member status
SELECT id, name, email, status, max_books FROM members WHERE id = ?;

-- =============================================================================
-- EXAMPLE USAGE SCENARIOS
-- =============================================================================

-- Example 1: Update member name and phone
-- sqlite3 library.db "UPDATE members SET name = 'Jane Doe', phone = '555-9999', updated_at = CURRENT_TIMESTAMP WHERE id = 'member-uuid-here';"

-- Example 2: Suspend a member
-- sqlite3 library.db "UPDATE members SET status = 'suspended', updated_at = CURRENT_TIMESTAMP WHERE id = 'member-uuid-here';"

-- Example 3: Check if email exists before updating
-- sqlite3 library.db "SELECT COUNT(*) FROM members WHERE email = 'newemail@example.com' AND id != 'member-uuid-here';"
-- If result is 0, then update:
-- sqlite3 library.db "UPDATE members SET email = 'newemail@example.com', updated_at = CURRENT_TIMESTAMP WHERE id = 'member-uuid-here';"

-- Example 4: Update multiple fields safely
-- sqlite3 library.db "UPDATE members SET name = 'John Smith', phone = '555-1234', address = '123 New Street', updated_at = CURRENT_TIMESTAMP WHERE id = 'member-uuid-here';"

-- =============================================================================
-- TRANSACTION EXAMPLE (for complex updates)
-- =============================================================================

-- BEGIN TRANSACTION;
-- 
-- -- Check if member exists
-- SELECT CASE 
--     WHEN COUNT(*) = 0 THEN 'ERROR: Member not found'
--     ELSE 'OK'
-- END as validation_result
-- FROM members WHERE id = 'member-uuid-here';
--
-- -- If validation passes, update member
-- UPDATE members 
-- SET 
--     name = 'Updated Name',
--     email = 'updated@email.com',
--     phone = '555-0000',
--     updated_at = CURRENT_TIMESTAMP
-- WHERE id = 'member-uuid-here';
--
-- -- Verify update was successful
-- SELECT changes() as rows_affected;
--
-- COMMIT;