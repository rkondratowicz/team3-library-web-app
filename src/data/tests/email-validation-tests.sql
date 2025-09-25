-- Email Validation Test Cases
-- This file contains test cases to verify email validation is working correctly

-- Test 1: Valid emails (should succeed)
INSERT INTO members (ID, memberName, email, phone, memAddress, status, max_books, member_since, updated_at)
VALUES 
    ('test-001', 'John Doe', 'john.doe@example.com', '555-0001', '123 Main St', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('test-002', 'Jane Smith', 'jane_smith@company.org', '555-0002', '456 Oak Ave', 'active', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('test-003', 'Bob Wilson', 'bob+work@domain.co.uk', '555-0003', '789 Pine Rd', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test 2: Invalid emails (should fail with CHECK constraint)
-- Uncomment the following lines one at a time to test validation

-- No @ symbol - should fail
-- INSERT INTO members (ID, memberName, email) VALUES ('test-fail-001', 'Test User', 'invalidemailaddress.com');

-- Empty email - should fail
-- INSERT INTO members (ID, memberName, email) VALUES ('test-fail-002', 'Test User', '');

-- Just @ symbol - should fail
-- INSERT INTO members (ID, memberName, email) VALUES ('test-fail-003', 'Test User', '@');

-- @ at the beginning - should fail
-- INSERT INTO members (ID, memberName, email) VALUES ('test-fail-004', 'Test User', '@domain.com');

-- @ at the end - should fail
-- INSERT INTO members (ID, memberName, email) VALUES ('test-fail-005', 'Test User', 'user@');

-- Test 3: Update operations with email validation

-- Valid email update (should succeed)
UPDATE members SET email = 'john.updated@newdomain.com', updated_at = CURRENT_TIMESTAMP WHERE ID = 'test-001';

-- Invalid email update (should fail)
-- UPDATE members SET email = 'invalid-email-without-at-symbol' WHERE ID = 'test-002';

-- Test 4: Unique email constraint
-- Try to insert duplicate email (should fail)
-- INSERT INTO members (ID, memberName, email) VALUES ('test-duplicate', 'Duplicate User', 'john.doe@example.com');

-- Test 5: Verify all test data
SELECT 
    ID,
    memberName,
    email,
    CASE 
        WHEN email LIKE '%@%' THEN '✅ Valid'
        ELSE '❌ Invalid'
    END as email_validation,
    status,
    max_books
FROM members 
WHERE ID LIKE 'test-%'
ORDER BY ID;

-- Test 6: Count members with valid emails
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN email LIKE '%@%' THEN 1 END) as valid_emails,
    COUNT(CASE WHEN email NOT LIKE '%@%' OR email IS NULL THEN 1 END) as invalid_emails
FROM members;

-- Test 7: Clean up test data (uncomment to remove test records)
-- DELETE FROM members WHERE ID LIKE 'test-%';