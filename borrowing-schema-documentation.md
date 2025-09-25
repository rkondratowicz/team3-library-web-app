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
- borrowings.member_id → members.ID
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

## Implementation Details

### Migration File
- Created as `07-create-borrowing-tables.sql` (following existing numbering)
- Includes all tables, indexes, triggers, and views
- Uses correct foreign key references to existing schema

### Seed Data
- 5 sample borrowings (active, overdue, returned)
- 2 sample fines (paid and unpaid)
- 2 sample reservations (active and fulfilled)
- Updates book copy statuses to reflect borrowings

### Database Constraints Verified
- ✅ Status constraints enforce valid values
- ✅ Date constraints prevent invalid date ranges
- ✅ Amount constraints prevent negative fines
- ✅ Foreign key relationships maintained
- ✅ All constraints properly tested and validated