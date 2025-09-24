# Task 1.1: Enhance Book Database Schema

## Objective
Extend the existing basic books table to include all fields required by the PRD and create a new book_copies table for inventory tracking.

## Current State
- Existing `books` table with: `id`, `author`, `title`
- No copy tracking functionality
- Basic book data only

## What You Will Create
- Enhanced `books` table with: ISBN, genre, publication year, description
- New `book_copies` table for tracking individual physical copies
- Migration scripts for both changes

## Step-by-Step Instructions

### Step 1: Create Enhanced Book Schema Migration

1. **Create the migration file**
   ```bash
   touch src/data/migrations/02-enhance-books-schema.sql
   ```

2. **Add the following content to `src/data/migrations/02-enhance-books-schema.sql`:**
   ```sql
   -- Add new columns to existing books table
   ALTER TABLE books ADD COLUMN isbn VARCHAR(13) UNIQUE;
   ALTER TABLE books ADD COLUMN genre VARCHAR(100);
   ALTER TABLE books ADD COLUMN publication_year INTEGER;
   ALTER TABLE books ADD COLUMN description TEXT;

   -- Create index for ISBN lookups
   CREATE INDEX idx_books_isbn ON books(isbn);
   CREATE INDEX idx_books_genre ON books(genre);
   CREATE INDEX idx_books_year ON books(publication_year);
   ```

### Step 2: Create Book Copies Table Migration

1. **Create the migration file**
   ```bash
   touch src/data/migrations/03-create-book-copies-table.sql
   ```

2. **Add the following content to `src/data/migrations/03-create-book-copies-table.sql`:**
   ```sql
   CREATE TABLE book_copies (
       id TEXT PRIMARY KEY,
       book_id TEXT NOT NULL,
       copy_number INTEGER NOT NULL,
       status VARCHAR(20) DEFAULT 'available', -- 'available', 'borrowed', 'maintenance'
       condition VARCHAR(20) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
       UNIQUE(book_id, copy_number)
   );

   -- Create indexes for efficient queries
   CREATE INDEX idx_book_copies_book_id ON book_copies(book_id);
   CREATE INDEX idx_book_copies_status ON book_copies(status);
   CREATE INDEX idx_book_copies_condition ON book_copies(condition);
   ```

### Step 3: Run the Migrations

1. **Execute the migrations in order:**
   ```bash
   # First, enhance the existing books table
   sqlite3 library.db < src/data/migrations/02-enhance-books-schema.sql
   
   # Then, create the book_copies table
   sqlite3 library.db < src/data/migrations/03-create-book-copies-table.sql
   ```

2. **Verify the schema changes:**
   ```bash
   sqlite3 library.db ".schema books"
   sqlite3 library.db ".schema book_copies"
   ```

### Step 4: Validate the Database Changes

1. **Check that the books table now has the new columns:**
   ```bash
   sqlite3 library.db "PRAGMA table_info(books);"
   ```
   
   Expected output should show: id, author, title, isbn, genre, publication_year, description

2. **Check that the book_copies table was created:**
   ```bash
   sqlite3 library.db "PRAGMA table_info(book_copies);"
   ```
   
   Expected output should show: id, book_id, copy_number, status, condition, created_at, updated_at

3. **Verify foreign key constraint:**
   ```bash
   sqlite3 library.db "PRAGMA foreign_key_list(book_copies);"
   ```

## Expected Results
- ✅ Books table enhanced with 4 new columns
- ✅ Book_copies table created with proper relationships
- ✅ All indexes created for performance
- ✅ Foreign key constraints working
- ✅ Database schema matches PRD requirements

## Troubleshooting

### If migration fails:
1. Check SQLite syntax with: `sqlite3 library.db ".read src/data/migrations/02-enhance-books-schema.sql"`
2. Ensure database file exists and is writable
3. Check for typos in column names or SQL syntax

### If foreign key constraint fails:
1. Enable foreign keys: `sqlite3 library.db "PRAGMA foreign_keys = ON;"`
2. Verify books table exists before creating book_copies

## Next Steps
After completing this task, proceed to Task 1.2: Update TypeScript Interfaces.

## Files Modified/Created
- ✅ `src/data/migrations/02-enhance-books-schema.sql` (new)
- ✅ `src/data/migrations/03-create-book-copies-table.sql` (new)
- ✅ `library.db` (schema updated)