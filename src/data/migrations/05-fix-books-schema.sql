-- Fix books table schema by recreating it with proper structure
-- This script will backup existing data and recreate the table

-- Step 1: Create a backup of existing books data
CREATE TABLE books_backup (
    id TEXT,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(13),
    genre VARCHAR(100),
    publication_year INTEGER,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
INSERT INTO books_backup SELECT * FROM books;

-- Step 2: Drop the malformed table
DROP TABLE books;

-- Step 3: Recreate books table with proper structure
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    author VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    genre VARCHAR(100),
    publication_year INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Restore data from backup (only core fields that exist)
INSERT INTO books (id, author, title, isbn, genre, publication_year, description)
SELECT id, author, title, isbn, genre, publication_year, description FROM books_backup;

-- Step 5: Create indexes for performance
CREATE UNIQUE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX idx_books_genre ON books(genre);
CREATE INDEX idx_books_year ON books(publication_year);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_title ON books(title);

-- Step 6: Clean up backup table
DROP TABLE books_backup;