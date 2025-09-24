# Task 1.6: Update Book Routes & Integration

## Objective
Update the book routing system to include all new endpoints and integrate the enhanced book system into the main application.

## Current State
- Basic book routes with 5 endpoints
- No copy management routes
- No search or inventory routes

## What You Will Create
- Enhanced book routes with all new endpoints
- Copy management routes
- Search and inventory routes
- Integration with main app.ts

## Step-by-Step Instructions

### Step 1: Update Book Routes

1. **Open `src/presentation/routes.ts`**

2. **Replace the existing `createBookRoutes` function with this enhanced version:**
   ```typescript
   import express from 'express';
   import type { BookController } from './BookController.js';

   export function createBookRoutes(bookController: BookController): express.Router {
     const router = express.Router();

     // Search routes (must be before /:id routes)
     router.get('/search', bookController.searchBooks);
     router.get('/inventory', bookController.getBookInventory);
     router.get('/with-copies', bookController.getAllBooksWithCopies);
     router.get('/isbn/:isbn', bookController.getBookByISBN);

     // Basic book CRUD operations
     router.get('/', bookController.getAllBooks);
     router.get('/:id', bookController.getBookById);
     router.post('/', bookController.createBook);
     router.put('/:id', bookController.updateBook);
     router.delete('/:id', bookController.deleteBook);

     // Book with copies routes
     router.get('/:id/with-copies', bookController.getBookWithCopies);
     router.get('/:id/availability', bookController.getBookAvailability);

     // Copy management routes
     router.get('/:id/copies', bookController.getBookCopies);
     router.post('/:id/copies', bookController.addBookCopy);
     router.get('/:id/copies/available', bookController.getAvailableCopies);

     return router;
   }
   ```

### Step 2: Create Copy-Specific Routes

1. **Add a new function for copy-specific routes in the same file:**
   ```typescript
   export function createCopyRoutes(bookController: BookController): express.Router {
     const router = express.Router();

     // Copy-specific operations (these use copy ID, not book ID)
     router.put('/:id/status', bookController.updateBookCopyStatus);
     router.put('/:id/condition', bookController.updateBookCopyCondition);
     router.delete('/:id', bookController.removeBookCopy);

     return router;
   }
   ```

### Step 3: Update Main Application Integration

1. **Open `src/app.ts`**

2. **Verify the imports include the new route function:**
   ```typescript
   import express from 'express';
   import { BookRepository } from './data/BookRepository.js';
   import { BookService } from './business/BookService.js';
   import { BookController } from './presentation/BookController.js';
   import { HealthController } from './presentation/HealthController.js';
   import { createBookRoutes, createCopyRoutes } from './presentation/routes.js';
   ```

3. **Update the route registration section to include copy routes:**
   ```typescript
   // Create instances
   const bookRepository = new BookRepository();
   const bookService = new BookService(bookRepository);
   const bookController = new BookController(bookService);
   const healthController = new HealthController();

   // Create routes
   const bookRoutes = createBookRoutes(bookController);
   const copyRoutes = createCopyRoutes(bookController);

   // Register routes
   app.use('/books', bookRoutes);
   app.use('/copies', copyRoutes);
   app.get('/', healthController.getGreeting);
   ```

### Step 4: Create Enhanced Seed Data

1. **Create `src/data/seeds/enhanced-books.sql`:**
   ```sql
   -- Clear existing data
   DELETE FROM book_copies;
   DELETE FROM books;

   -- Insert enhanced book data
   INSERT INTO books (id, author, title, isbn, genre, publication_year, description) VALUES
   ('550e8400-e29b-41d4-a716-446655440001', 'J.K. Rowling', 'Harry Potter and the Philosopher''s Stone', '9780747532699', 'Fantasy', 1997, 'The first book in the Harry Potter series about a young wizard''s journey.'),
   ('550e8400-e29b-41d4-a716-446655440002', 'George Orwell', '1984', '9780451524935', 'Dystopian Fiction', 1949, 'A dystopian social science fiction novel about totalitarian control.'),
   ('550e8400-e29b-41d4-a716-446655440003', 'Harper Lee', 'To Kill a Mockingbird', '9780061120084', 'Literary Fiction', 1960, 'A gripping tale of racial injustice and childhood innocence.'),
   ('550e8400-e29b-41d4-a716-446655440004', 'F. Scott Fitzgerald', 'The Great Gatsby', '9780743273565', 'Literary Fiction', 1925, 'A classic American novel set in the Jazz Age.'),
   ('550e8400-e29b-41d4-a716-446655440005', 'Jane Austen', 'Pride and Prejudice', '9780141439518', 'Romance', 1813, 'A romantic novel about manners and marriage in Georgian England.');
   ```

2. **Create `src/data/seeds/book-copies.sql`:**
   ```sql
   -- Insert book copies
   INSERT INTO book_copies (id, book_id, copy_number, status, condition) VALUES
   -- Harry Potter copies
   ('copy-550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1, 'available', 'excellent'),
   ('copy-550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 2, 'available', 'good'),
   ('copy-550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 3, 'maintenance', 'fair'),

   -- 1984 copies
   ('copy-550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 1, 'available', 'good'),
   ('copy-550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 2, 'borrowed', 'excellent'),

   -- To Kill a Mockingbird copies
   ('copy-550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 1, 'available', 'good'),
   ('copy-550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 2, 'available', 'excellent'),

   -- The Great Gatsby copies
   ('copy-550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 1, 'available', 'fair'),

   -- Pride and Prejudice copies
   ('copy-550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 1, 'available', 'excellent'),
   ('copy-550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 2, 'available', 'good'),
   ('copy-550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', 3, 'borrowed', 'good');
   ```

### Step 5: Load the Enhanced Seed Data

1. **Run the seed data scripts:**
   ```bash
   # Load enhanced book data
   sqlite3 library.db < src/data/seeds/enhanced-books.sql
   
   # Load book copies
   sqlite3 library.db < src/data/seeds/book-copies.sql
   ```

2. **Verify the data was loaded correctly:**
   ```bash
   # Check books
   sqlite3 library.db "SELECT id, title, isbn, genre FROM books LIMIT 3;"
   
   # Check copies
   sqlite3 library.db "SELECT id, book_id, copy_number, status FROM book_copies LIMIT 5;"
   ```

### Step 6: Test the Application

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Test the endpoints:**
   ```bash
   # Test basic book retrieval (should show enhanced data)
   curl http://localhost:3001/books
   
   # Test search functionality
   curl "http://localhost:3001/books/search?genre=Fantasy"
   
   # Test book with copies
   curl http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/with-copies
   
   # Test inventory
   curl http://localhost:3001/books/inventory
   
   # Test copies for a book
   curl http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/copies
   ```

### Step 7: Create API Documentation

1. **Create `src/docs/book-api.md`:**
   ```markdown
   # Enhanced Book API Documentation

   ## Book Management Endpoints

   ### GET /books
   Get all books with enhanced information.

   ### GET /books/:id
   Get a specific book by ID.

   ### POST /books
   Create a new book with full metadata.
   ```markdown
   Body:
   ```json
   {
     "author": "Author Name",
     "title": "Book Title",
     "isbn": "9781234567890", // optional
     "genre": "Fiction", // optional
     "publication_year": 2023, // optional
     "description": "Book description" // optional
   }
   ```

   ### PUT /books/:id
   Update an existing book.

   ### DELETE /books/:id
   Delete a book (only if no copies are borrowed).

   ## Search and Filter Endpoints

   ### GET /books/search
   Search books with various filters.
   Query parameters:
   - title: Search in book titles
   - author: Search in author names
   - isbn: Exact ISBN match
   - genre: Search in genres
   - publication_year: Filter by publication year
   - available_only: true/false - only show books with available copies
   - limit: Limit number of results
   - offset: Pagination offset

   ### GET /books/isbn/:isbn
   Get a book by its ISBN.

   ## Copy Management Endpoints

   ### GET /books/:id/copies
   Get all copies for a specific book.

   ### POST /books/:id/copies
   Add a new copy for a book.
   ```json
   {
     "condition": "excellent" // optional: excellent, good, fair, poor
   }
   ```

   ### GET /books/:id/copies/available
   Get only available copies for a book.

   ### PUT /copies/:id/status
   Update copy status.
   ```json
   {
     "status": "available" // available, borrowed, maintenance
   }
   ```

   ### PUT /copies/:id/condition
   Update copy condition.
   ```json
   {
     "condition": "good" // excellent, good, fair, poor
   }
   ```

   ### DELETE /copies/:id
   Delete a copy (only if not borrowed).

   ## Inventory and Availability

   ### GET /books/inventory
   Get inventory summary for all books.

   ### GET /books/:id/availability
   Get availability information for a specific book.

   ### GET /books/with-copies
   Get all books with their copies information.

   ### GET /books/:id/with-copies
   Get a specific book with all its copies.
   ```

### Step 8: Integration Testing

1. **Create a simple test script `test-book-api.sh`:**
   ```bash
   #!/bin/bash
   
   echo "Testing Enhanced Book API..."
   
   # Test basic endpoints
   echo "1. Testing GET /books"
   curl -s http://localhost:3001/books | jq '.Books | length'
   
   echo "2. Testing search by genre"
   curl -s "http://localhost:3001/books/search?genre=Fantasy" | jq '.Books | length'
   
   echo "3. Testing inventory"
   curl -s http://localhost:3001/books/inventory | jq '.summary'
   
   echo "4. Testing book with copies"
   curl -s http://localhost:3001/books/550e8400-e29b-41d4-a716-446655440001/with-copies | jq '.book.total_copies'
   
   echo "All tests completed!"
   ```

2. **Make it executable and run:**
   ```bash
   chmod +x test-book-api.sh
   ./test-book-api.sh
   ```

## Expected Results
- ✅ All new book routes properly configured
- ✅ Copy management routes working
- ✅ Search and inventory endpoints functional
- ✅ Enhanced seed data loaded successfully
- ✅ Application starts without errors
- ✅ All endpoints respond correctly
- ✅ API documentation created
- ✅ Integration with main app completed

## Troubleshooting

### If routes don't work:
1. Check that route order is correct (specific routes before parameterized ones)
2. Verify controller methods exist and are properly named
3. Check that middleware is properly configured

### If seed data fails to load:
1. Check SQL syntax in seed files
2. Verify foreign key constraints are satisfied
3. Ensure UUIDs are properly formatted

### If endpoints return errors:
1. Check server logs for detailed error messages
2. Verify request format matches expected parameters
3. Test with simple curl commands first

## Next Steps
After completing this task, proceed to Task 1.7: Testing and Validation.

## Files Created/Modified
- ✅ `src/presentation/routes.ts` (updated)
- ✅ `src/app.ts` (updated)  
- ✅ `src/data/seeds/enhanced-books.sql` (new)
- ✅ `src/data/seeds/book-copies.sql` (new)
- ✅ `src/docs/book-api.md` (new)
- ✅ `test-book-api.sh` (new)