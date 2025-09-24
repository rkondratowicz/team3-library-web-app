# Person 1: Enhanced Book System & Inventory Management

## Overview
You are responsible for extending the existing basic book management system to support the full requirements from the PRD. The current system has basic CRUD operations for books with only `id`, `author`, and `title` fields. You need to expand this to include full book metadata, copy management, and advanced search capabilities.

## Current State Analysis
**What's Already Implemented:**
- Basic `books` table with `id`, `author`, `title`
- Complete book CRUD API endpoints
- `BookController`, `BookService`, and `BookRepository` classes
- TypeScript interfaces for basic book operations

**What You Need to Build:**
- Enhanced book schema with ISBN, genre, publication year, description
- Book copies management system
- Advanced search and filtering
- Inventory tracking and validation

## Day 1 Tasks

### Task 1.1: Enhance Book Database Schema
**Objective:** Extend the existing books table and create book copies tracking

1. **Create enhanced book schema migration**
   - Create file: `src/data/migrations/02-enhance-books-schema.sql`
   ```sql
   -- Add new columns to existing books table
   ALTER TABLE books ADD COLUMN isbn VARCHAR(13) UNIQUE;
   ALTER TABLE books ADD COLUMN genre VARCHAR(100);
   ALTER TABLE books ADD COLUMN publication_year INTEGER;
   ALTER TABLE books ADD COLUMN description TEXT;
   ```

2. **Create book copies table**
   - Create file: `src/data/migrations/03-create-book-copies-table.sql`
   ```sql
   CREATE TABLE book_copies (
       id TEXT PRIMARY KEY,
       book_id TEXT NOT NULL,
       copy_number INTEGER NOT NULL,
       status VARCHAR(20) DEFAULT 'available', -- 'available', 'borrowed', 'maintenance'
       condition VARCHAR(20) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
       UNIQUE(book_id, copy_number)
   );
   ```

3. **Run migrations**
   ```bash
   sqlite3 library.db < src/data/migrations/02-enhance-books-schema.sql
   sqlite3 library.db < src/data/migrations/03-create-book-copies-table.sql
   ```

### Task 1.2: Update TypeScript Interfaces
**Objective:** Update type definitions to match new schema

1. **Update `src/shared/types.ts`**
   - Extend existing `Book` interface:
   ```typescript
   export interface Book {
     id: string;
     author: string;
     title: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }
   ```

   - Add new interfaces:
   ```typescript
   export interface BookCopy {
     id: string;
     book_id: string;
     copy_number: number;
     status: 'available' | 'borrowed' | 'maintenance';
     condition: 'excellent' | 'good' | 'fair' | 'poor';
     created_at: string;
   }

   export interface CreateBookCopyRequest {
     book_id: string;
     condition?: 'excellent' | 'good' | 'fair' | 'poor';
   }

   export interface BookWithCopies extends Book {
     copies: BookCopy[];
     total_copies: number;
     available_copies: number;
   }

   export interface BookSearchFilters {
     title?: string;
     author?: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     available_only?: boolean;
   }
   ```

   - Update existing request interfaces:
   ```typescript
   export interface CreateBookRequest {
     author: string;
     title: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }

   export interface UpdateBookRequest {
     author?: string;
     title?: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }
   ```

### Task 1.3: Update Book Repository
**Objective:** Extend BookRepository to handle new fields and copy operations

1. **Update `src/data/BookRepository.ts`**
   - Add copy-related methods to `IBookRepository` interface:
   ```typescript
   export interface IBookRepository {
     // Existing methods...
     getAllBooks(): Promise<Book[]>;
     getBookById(id: string): Promise<Book | null>;
     createBook(book: Book): Promise<void>;
     updateBook(id: string, updates: Partial<Book>): Promise<boolean>;
     deleteBook(id: string): Promise<boolean>;
     bookExists(id: string): Promise<boolean>;
     
     // New methods for enhanced functionality
     searchBooks(filters: BookSearchFilters): Promise<Book[]>;
     getBookWithCopies(id: string): Promise<BookWithCopies | null>;
     createBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BookCopy>;
     getBookCopies(bookId: string): Promise<BookCopy[]>;
     updateBookCopyStatus(copyId: string, status: string): Promise<boolean>;
     deleteBookCopy(copyId: string): Promise<boolean>;
     getAvailableCopies(bookId: string): Promise<BookCopy[]>;
   }
   ```

2. **Implement the new methods in BookRepository class:**
   - Update existing methods to handle new fields
   - Add search functionality with filters
   - Add copy management methods
   - Add availability checking methods

### Task 1.4: Update Book Service
**Objective:** Add business logic for enhanced book operations

1. **Update `src/business/BookService.ts`**
   - Add new methods to `IBookService` interface:
   ```typescript
   export interface IBookService {
     // Existing methods...
     getAllBooks(): Promise<BusinessResult<Book[]>>;
     getBookById(id: string): Promise<BusinessResult<Book>>;
     createBook(bookData: CreateBookRequest): Promise<BusinessResult<Book>>;
     updateBook(id: string, updates: UpdateBookRequest): Promise<BusinessResult<Book>>;
     deleteBook(id: string): Promise<BusinessResult<void>>;
     
     // New methods
     searchBooks(filters: BookSearchFilters): Promise<BusinessResult<Book[]>>;
     getBookWithCopies(id: string): Promise<BusinessResult<BookWithCopies>>;
     addBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BusinessResult<BookCopy>>;
     removeBookCopy(copyId: string): Promise<BusinessResult<void>>;
     getBookInventory(): Promise<BusinessResult<any>>;
   }
   ```

2. **Implement business rules:**
   - ISBN validation and uniqueness
   - Cannot delete books with borrowed copies
   - Copy numbering logic
   - Availability calculations

## Day 2 Tasks

### Task 2.1: Enhanced Book Controller
**Objective:** Add new API endpoints for enhanced functionality

1. **Update `src/presentation/BookController.ts`**
   - Add search endpoint handler
   - Add copy management endpoint handlers
   - Add inventory endpoint handlers
   - Update existing handlers to use new fields

### Task 2.2: Update Routes
**Objective:** Add new routes for enhanced book operations

1. **Update `src/presentation/routes.ts`**
   - Add route: `GET /books/search` - Search books with filters
   - Add route: `GET /books/:id/copies` - Get book copies
   - Add route: `POST /books/:id/copies` - Add book copy
   - Add route: `DELETE /copies/:id` - Remove book copy
   - Add route: `GET /books/inventory` - Get inventory summary

### Task 2.3: Create Enhanced Seed Data
**Objective:** Update seed data with enhanced book information

1. **Update `src/data/seeds/books.sql`**
   - Add sample books with full metadata (ISBN, genre, publication_year, description)
   - Add sample book copies for testing

### Task 2.4: Integration and Testing
**Objective:** Ensure all components work together

1. **Test all endpoints:**
   - Basic CRUD operations with new fields
   - Search functionality
   - Copy management
   - Inventory tracking

2. **Validate business rules:**
   - ISBN uniqueness
   - Copy availability calculations
   - Cannot delete books with active borrows (coordinate with Person 3)

## Technical Requirements

### Database Constraints
- Use UUIDs for all primary keys
- Ensure referential integrity with foreign keys
- Add appropriate indexes for search performance

### Error Handling
- Validate ISBN format (10 or 13 digits)
- Handle duplicate ISBN errors
- Validate publication year ranges
- Proper error responses for all edge cases

### Performance Considerations
- Index frequently searched columns
- Optimize queries for book search with multiple filters
- Efficient counting of available copies

## Integration Points
- **With Person 3 (Borrowing System):** Book copy availability updates
- **With Person 2 (Members):** Book deletion validation (no active borrows)

## Success Criteria
- [ ] Enhanced book schema implemented and migrated
- [ ] All new TypeScript interfaces defined
- [ ] Book repository supports all new operations
- [ ] Book service implements all business rules
- [ ] All API endpoints functional and tested
- [ ] Search and filtering working correctly
- [ ] Copy management fully operational
- [ ] Integration points identified and documented