-- Seed data for book_copies table
-- This creates multiple copies for each book with varying statuses and conditions

-- To Kill a Mockingbird (3 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-001-001', '550e8400-e29b-41d4-a716-446655440001', 1, 'available', 'excellent'),
('copy-001-002', '550e8400-e29b-41d4-a716-446655440001', 2, 'borrowed', 'good'),
('copy-001-003', '550e8400-e29b-41d4-a716-446655440001', 3, 'available', 'good');

-- 1984 (4 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-002-001', '550e8400-e29b-41d4-a716-446655440002', 1, 'available', 'excellent'),
('copy-002-002', '550e8400-e29b-41d4-a716-446655440002', 2, 'available', 'good'),
('copy-002-003', '550e8400-e29b-41d4-a716-446655440002', 3, 'borrowed', 'fair'),
('copy-002-004', '550e8400-e29b-41d4-a716-446655440002', 4, 'maintenance', 'poor');

-- Harry Potter and the Sorcerer's Stone (5 copies - popular book)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-003-001', '550e8400-e29b-41d4-a716-446655440003', 1, 'available', 'excellent'),
('copy-003-002', '550e8400-e29b-41d4-a716-446655440003', 2, 'available', 'excellent'),
('copy-003-003', '550e8400-e29b-41d4-a716-446655440003', 3, 'borrowed', 'good'),
('copy-003-004', '550e8400-e29b-41d4-a716-446655440003', 4, 'borrowed', 'good'),
('copy-003-005', '550e8400-e29b-41d4-a716-446655440003', 5, 'available', 'fair');

-- The Lord of the Rings (3 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-004-001', '550e8400-e29b-41d4-a716-446655440004', 1, 'available', 'good'),
('copy-004-002', '550e8400-e29b-41d4-a716-446655440004', 2, 'borrowed', 'excellent'),
('copy-004-003', '550e8400-e29b-41d4-a716-446655440004', 3, 'available', 'fair');

-- The Great Gatsby (2 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-005-001', '550e8400-e29b-41d4-a716-446655440005', 1, 'available', 'excellent'),
('copy-005-002', '550e8400-e29b-41d4-a716-446655440005', 2, 'available', 'good');

-- Pride and Prejudice (3 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-006-001', '550e8400-e29b-41d4-a716-446655440006', 1, 'available', 'good'),
('copy-006-002', '550e8400-e29b-41d4-a716-446655440006', 2, 'borrowed', 'excellent'),
('copy-006-003', '550e8400-e29b-41d4-a716-446655440006', 3, 'maintenance', 'fair');

-- Adventures of Huckleberry Finn (2 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-007-001', '550e8400-e29b-41d4-a716-446655440007', 1, 'available', 'good'),
('copy-007-002', '550e8400-e29b-41d4-a716-446655440007', 2, 'available', 'fair');

-- Frankenstein (4 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-008-001', '550e8400-e29b-41d4-a716-446655440008', 1, 'available', 'excellent'),
('copy-008-002', '550e8400-e29b-41d4-a716-446655440008', 2, 'available', 'good'),
('copy-008-003', '550e8400-e29b-41d4-a716-446655440008', 3, 'borrowed', 'good'),
('copy-008-004', '550e8400-e29b-41d4-a716-446655440008', 4, 'available', 'fair');

-- War and Peace (2 copies - large book, fewer copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-009-001', '550e8400-e29b-41d4-a716-446655440009', 1, 'available', 'good'),
('copy-009-002', '550e8400-e29b-41d4-a716-446655440009', 2, 'borrowed', 'fair');

-- One Hundred Years of Solitude (3 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-010-001', '550e8400-e29b-41d4-a716-446655440010', 1, 'available', 'excellent'),
('copy-010-002', '550e8400-e29b-41d4-a716-446655440010', 2, 'available', 'good'),
('copy-010-003', '550e8400-e29b-41d4-a716-446655440010', 3, 'maintenance', 'poor');

-- Murder on the Orient Express (3 copies)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-011-001', '9ef8c786-f58b-4a3a-857d-9de57ce31682', 1, 'available', 'excellent'),
('copy-011-002', '9ef8c786-f58b-4a3a-857d-9de57ce31682', 2, 'borrowed', 'good'),
('copy-011-003', '9ef8c786-f58b-4a3a-857d-9de57ce31682', 3, 'available', 'good');

-- A cool book (2 copies - newer addition)
INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
('copy-012-001', 'abcc22ca-cbda-41ed-8ace-60f2be4bd276', 1, 'available', 'excellent'),
('copy-012-002', 'abcc22ca-cbda-41ed-8ace-60f2be4bd276', 2, 'available', 'excellent');