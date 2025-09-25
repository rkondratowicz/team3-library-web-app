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
 (SELECT ID FROM members LIMIT 1), 
 (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1), 
 date('now', '-5 days'), 
 date('now', '+9 days'), 
 NULL, 0, 'active', 'Regular borrowing'),

('550e8400-e29b-41d4-a716-446655440002', 
 (SELECT ID FROM members LIMIT 1 OFFSET 1), 
 (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 1), 
 date('now', '-10 days'), 
 date('now', '+4 days'), 
 NULL, 1, 'active', 'Renewed once'),

-- Overdue borrowing
('550e8400-e29b-41d4-a716-446655440003', 
 (SELECT ID FROM members LIMIT 1 OFFSET 2), 
 (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 2), 
 date('now', '-20 days'), 
 date('now', '-3 days'), 
 NULL, 0, 'overdue', 'Overdue borrowing'),

-- Returned borrowings
('550e8400-e29b-41d4-a716-446655440004', 
 (SELECT ID FROM members LIMIT 1), 
 (SELECT id FROM book_copies WHERE status = 'available' LIMIT 1 OFFSET 3), 
 date('now', '-30 days'), 
 date('now', '-16 days'), 
 date('now', '-17 days'), 0, 'returned', 'Returned on time'),

('550e8400-e29b-41d4-a716-446655440005', 
 (SELECT ID FROM members LIMIT 1 OFFSET 1), 
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
 (SELECT ID FROM members WHERE status = 'active' LIMIT 1), 
 (SELECT id FROM books LIMIT 1), 
 date('now', '-2 days'), 
 date('now', '+5 days'), 
 'active', 1, NULL, 'Waiting for book availability'),

-- Fulfilled reservation
('r50e8400-e29b-41d4-a716-446655440002', 
 (SELECT ID FROM members WHERE status = 'active' LIMIT 1 OFFSET 1), 
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