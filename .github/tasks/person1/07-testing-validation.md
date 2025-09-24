# Task 1.7: Testing and Validation

## Objective
Thoroughly test all enhanced book functionality to ensure everything works correctly, validate business rules, and prepare for integration with other team members' work.

## Current State
- Enhanced book system implemented
- All endpoints configured
- Seed data loaded

## What You Will Do
- Comprehensive testing of all book endpoints
- Validation of business rules
- Performance testing
- Integration preparation
- Documentation of test results

## Step-by-Step Instructions

### Step 1: Basic Functionality Testing

1. **Start the application:**
   ```bash
   npm run build
   npm run dev
   ```

2. **Test basic book CRUD operations:**
   ```bash
   # Test GET all books
   echo "Testing GET /books"
   curl -s http://localhost:3001/books | jq '.Books | length'
   
   # Test GET specific book
   echo "Testing GET /books/:id"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001 | jq '.book.title'
   
   # Test book creation with enhanced fields
   echo "Testing POST /books"
   curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{
       "author": "Test Author",
       "title": "Test Book",
       "isbn": "9781234567890",
       "genre": "Test Genre",
       "publication_year": 2023,
       "description": "A test book for validation"
     }' | jq '.book.id'
   
   # Save the book ID for further testing
   BOOK_ID=$(curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{
       "author": "Test Author 2",
       "title": "Test Book 2",
       "isbn": "9780987654321"
     }' | jq -r '.book.id')
   
   echo "Created book ID: $BOOK_ID"
   ```

### Step 2: Search and Filter Testing

1. **Test search functionality:**
   ```bash
   # Test title search
   echo "Testing title search"
   curl -s "http://localhost:3001/books/search?title=Harry" | jq '.Books[0].title'
   
   # Test author search
   echo "Testing author search"
   curl -s "http://localhost:3001/books/search?author=Orwell" | jq '.Books[0].author'
   
   # Test genre search
   echo "Testing genre search"
   curl -s "http://localhost:3001/books/search?genre=Fantasy" | jq '.Books | length'
   
   # Test year search
   echo "Testing year search"
   curl -s "http://localhost:3001/books/search?publication_year=1949" | jq '.Books[0].title'
   
   # Test ISBN search
   echo "Testing ISBN endpoint"
   curl -s http://localhost:3001/books/isbn/9780747532699 | jq '.book.title'
   
   # Test available only filter
   echo "Testing available only filter"
   curl -s "http://localhost:3001/books/search?available_only=true" | jq '.Books | length'
   
   # Test pagination
   echo "Testing pagination"
   curl -s "http://localhost:3001/books/search?limit=2&offset=0" | jq '.Books | length'
   ```

### Step 3: Copy Management Testing

1. **Test copy operations:**
   ```bash
   # Test getting copies for a book
   echo "Testing GET /books/:id/copies"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/copies | jq '.copies | length'
   
   # Test getting available copies
   echo "Testing GET /books/:id/copies/available"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/copies/available | jq '.copies | length'
   
   # Test adding a copy
   echo "Testing POST /books/:id/copies"
   COPY_RESULT=$(curl -X POST http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/copies \
     -H "Content-Type: application/json" \
     -d '{"condition": "excellent"}')
   
   COPY_ID=$(echo $COPY_RESULT | jq -r '.copy.id')
   echo "Created copy ID: $COPY_ID"
   
   # Test updating copy status
   echo "Testing PUT /copies/:id/status"
   curl -X PUT http://localhost:3001/copies/$COPY_ID/status \
     -H "Content-Type: application/json" \
     -d '{"status": "maintenance"}' | jq '.copy.status'
   
   # Test updating copy condition
   echo "Testing PUT /copies/:id/condition"
   curl -X PUT http://localhost:3001/copies/$COPY_ID/condition \
     -H "Content-Type: application/json" \
     -d '{"condition": "good"}' | jq '.copy.condition'
   ```

### Step 4: Books with Copies Testing

1. **Test composite endpoints:**
   ```bash
   # Test single book with copies
   echo "Testing GET /books/:id/with-copies"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/with-copies | jq '{title: .book.title, total_copies: .book.total_copies, available_copies: .book.available_copies}'
   
   # Test all books with copies
   echo "Testing GET /books/with-copies"
   curl -s http://localhost:3001/books/with-copies | jq '.books[0] | {title: .title, total_copies: .total_copies}'
   ```

### Step 5: Inventory and Availability Testing

1. **Test inventory endpoints:**
   ```bash
   # Test inventory summary
   echo "Testing GET /books/inventory"
   curl -s http://localhost:3001/books/inventory | jq '.summary'
   
   # Test specific book availability
   echo "Testing GET /books/:id/availability"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/availability | jq '.availability'
   ```

### Step 6: Business Rules Validation

1. **Test ISBN validation:**
   ```bash
   # Test invalid ISBN
   echo "Testing invalid ISBN creation"
   curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{
       "author": "Test Author",
       "title": "Invalid ISBN Test",
       "isbn": "invalid-isbn"
     }' | jq '.error'
   
   # Test duplicate ISBN
   echo "Testing duplicate ISBN"
   curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{
       "author": "Another Author",
       "title": "Duplicate ISBN Test",
       "isbn": "9780747532699"
     }' | jq '.error'
   ```

2. **Test deletion restrictions:**
   ```bash
   # Try to delete a book with borrowed copies
   echo "Testing deletion of book with borrowed copies"
   curl -X DELETE http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440002 | jq '.error'
   
   # Try to delete a borrowed copy
   echo "Testing deletion of borrowed copy"
   curl -X DELETE http://localhost:3001/copies/copy-550e8400-e29b-41d4-a716-446655440005 | jq '.error'
   ```

3. **Test validation rules:**
   ```bash
   # Test missing required fields
   echo "Testing missing required fields"
   curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{"title": "Missing Author"}' | jq '.error'
   
   # Test invalid year
   echo "Testing invalid publication year"
   curl -X POST http://localhost:3001/books \
     -H "Content-Type: application/json" \
     -d '{
       "author": "Test Author",
       "title": "Invalid Year Test",
       "publication_year": 2030
     }' | jq '.error'
   ```

### Step 7: Error Handling Testing

1. **Test error scenarios:**
   ```bash
   # Test non-existent book
   echo "Testing non-existent book"
   curl -s http://localhost:3001/books/non-existent-id | jq '.error'
   
   # Test non-existent copy
   echo "Testing non-existent copy"
   curl -s http://localhost:3001/copies/non-existent-copy | jq '.error'
   
   # Test invalid copy status
   echo "Testing invalid copy status"
   curl -X PUT http://localhost:3001/copies/$COPY_ID/status \
     -H "Content-Type: application/json" \
     -d '{"status": "invalid-status"}' | jq '.error'
   ```

### Step 8: Performance Testing

1. **Create a performance test script `performance-test.sh`:**
   ```bash
   #!/bin/bash
   
   echo "Running performance tests..."
   
   # Test concurrent requests
   echo "Testing concurrent book creation..."
   for i in {1..10}; do
     curl -X POST http://localhost:3001/books \
       -H "Content-Type: application/json" \
       -d "{
         \"author\": \"Performance Test Author $i\",
         \"title\": \"Performance Test Book $i\",
         \"isbn\": \"978123456789$i\"
       }" &
   done
   wait
   
   echo "Testing concurrent searches..."
   for i in {1..5}; do
     curl -s "http://localhost:3001/books/search?title=Performance" &
   done
   wait
   
   echo "Performance tests completed!"
   ```

2. **Run performance tests:**
   ```bash
   chmod +x performance-test.sh
   ./performance-test.sh
   ```

### Step 9: Database Consistency Testing

1. **Test database state:**
   ```bash
   # Check that all books have valid data
   echo "Checking book data consistency"
   sqlite3 library.db "SELECT COUNT(*) FROM books WHERE author IS NULL OR title IS NULL;"
   
   # Check copy-book relationships
   echo "Checking copy-book relationships"
   sqlite3 library.db "SELECT COUNT(*) FROM book_copies bc LEFT JOIN books b ON bc.book_id = b.id WHERE b.id IS NULL;"
   
   # Check copy numbering
   echo "Checking copy numbering consistency"
   sqlite3 library.db "SELECT book_id, COUNT(*) as copy_count, MAX(copy_number) as max_copy FROM book_copies GROUP BY book_id HAVING copy_count != max_copy;"
   ```

### Step 10: Create Test Report

1. **Create `test-results.md`:**
   ```markdown
   # Book System Test Results

   ## Test Summary
   - Date: $(date)
   - All basic CRUD operations: ✅ PASS
   - Search functionality: ✅ PASS  
   - Copy management: ✅ PASS
   - Inventory tracking: ✅ PASS
   - Business rules validation: ✅ PASS
   - Error handling: ✅ PASS
   - Performance: ✅ PASS
   - Database consistency: ✅ PASS

   ## Detailed Results

   ### Basic Operations
   - Create book: ✅
   - Read book: ✅
   - Update book: ✅
   - Delete book: ✅
   - List books: ✅

   ### Enhanced Features
   - ISBN validation: ✅
   - Genre filtering: ✅
   - Year filtering: ✅
   - Copy management: ✅
   - Availability tracking: ✅

   ### Business Rules
   - No duplicate ISBNs: ✅
   - No deletion with borrowed copies: ✅
   - Proper validation messages: ✅

   ## Integration Readiness
   The book system is ready for integration with:
   - ✅ Member system (Person 2)
   - ✅ Borrowing system (Person 3)

   ## Next Steps
   - Wait for member and borrowing systems
   - Test cross-system integrations
   - Validate borrowing restrictions work properly
   ```

### Step 11: Clean Up Test Data

1. **Clean up test data:**
   ```bash
   # Remove test books created during testing
   sqlite3 library.db "DELETE FROM books WHERE author LIKE 'Test Author%' OR author LIKE 'Performance Test%';"
   
   # Remove test copies
   sqlite3 library.db "DELETE FROM book_copies WHERE id NOT LIKE 'copy-550e8400%';"
   ```

## Expected Results
- ✅ All basic book operations working correctly
- ✅ Enhanced features (ISBN, genre, year) functional
- ✅ Copy management system operational
- ✅ Search and filtering working properly
- ✅ Inventory tracking accurate
- ✅ Business rules properly enforced
- ✅ Error handling comprehensive
- ✅ Performance acceptable
- ✅ Database consistency maintained
- ✅ System ready for integration

## Troubleshooting

### If tests fail:
1. Check server logs for detailed error messages
2. Verify database schema matches expectations
3. Confirm all migrations ran successfully
4. Test individual components in isolation

### If performance is poor:
1. Check database indexes are created
2. Verify SQL queries are optimized
3. Monitor memory usage during tests

### If business rules don't work:
1. Verify validation logic in service layer
2. Check that controller properly handles validation errors
3. Test edge cases individually

## Integration Points for Other Team Members

### For Person 2 (Members):
- Book deletion should check for active borrows
- Member eligibility should check book availability
- Borrowing history should reference book titles

### For Person 3 (Borrowing):
- Copy status updates when borrowed/returned
- Availability calculations for borrowing decisions
- Popular book statistics integration

## Files Created
- ✅ `performance-test.sh` (new)
- ✅ `test-results.md` (new)

## Success Criteria Met
- ✅ Complete book management system implemented
- ✅ All PRD requirements for books satisfied
- ✅ Copy inventory system functional
- ✅ Search and filtering comprehensive
- ✅ Business rules enforced
- ✅ Ready for team integration