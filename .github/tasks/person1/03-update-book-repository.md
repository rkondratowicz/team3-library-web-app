# Task 1.3: Update Book Repository

## Objective
Extend the existing BookRepository to handle the new database schema, add copy management functionality, and implement search/filtering capabilities.

## Current State
- Basic BookRepository with: getAllBooks, getBookById, createBook, updateBook, deleteBook, bookExists
- Only handles basic book fields (id, author, title)
- No copy management functionality

## What You Will Create
- Enhanced repository methods for new book fields
- Complete copy management functionality
- Advanced search and filtering methods
- Book availability tracking methods

## Step-by-Step Instructions

### Step 1: Update the IBookRepository Interface

1. **Open `src/data/BookRepository.ts`**

2. **Replace the existing `IBookRepository` interface with this enhanced version:**
   ```typescript
   export interface IBookRepository {
     // Existing book methods (enhanced)
     getAllBooks(): Promise<Book[]>;
     getBookById(id: string): Promise<Book | null>;
     createBook(book: Book): Promise<void>;
     updateBook(id: string, updates: Partial<Book>): Promise<boolean>;
     deleteBook(id: string): Promise<boolean>;
     bookExists(id: string): Promise<boolean>;
     
     // New enhanced book methods
     searchBooks(filters: BookSearchFilters): Promise<Book[]>;
     getBookByISBN(isbn: string): Promise<Book | null>;
     getBooksByGenre(genre: string): Promise<Book[]>;
     getBooksByAuthor(author: string): Promise<Book[]>;
     getBooksByYear(year: number): Promise<Book[]>;
     
     // Book with copies methods
     getBookWithCopies(id: string): Promise<BookWithCopies | null>;
     getAllBooksWithCopies(): Promise<BookWithCopies[]>;
     
     // Copy management methods
     createBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BookCopy>;
     getBookCopies(bookId: string): Promise<BookCopy[]>;
     getBookCopyById(copyId: string): Promise<BookCopy | null>;
     updateBookCopy(copyId: string, updates: Partial<BookCopy>): Promise<boolean>;
     updateBookCopyStatus(copyId: string, status: string): Promise<boolean>;
     deleteBookCopy(copyId: string): Promise<boolean>;
     
     // Availability methods
     getAvailableCopies(bookId: string): Promise<BookCopy[]>;
     getBookAvailability(bookId: string): Promise<BookAvailability>;
     getAllBookAvailabilities(): Promise<BookAvailability[]>;
     
     // Utility methods
     copyExists(copyId: string): Promise<boolean>;
     getNextCopyNumber(bookId: string): Promise<number>;
   }
   ```

### Step 2: Add Required Imports

1. **Update the imports at the top of the file:**
   ```typescript
   import { dirname, join } from 'node:path';
   import { fileURLToPath } from 'node:url';
   import sqlite3 from 'sqlite3';
   import { v4 as uuidv4 } from 'uuid';
   import type { 
     Book, 
     BookCopy, 
     BookWithCopies, 
     BookAvailability,
     BookSearchFilters,
     CreateBookCopyRequest 
   } from '../shared/types.js';
   ```

### Step 3: Update Existing Methods to Handle New Fields

1. **Replace the `getAllBooks` method:**
   ```typescript
   async getAllBooks(): Promise<Book[]> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, author, title, isbn, genre, publication_year, description 
         FROM books 
         ORDER BY title ASC
       `;
       
       this.db.all(sql, [], (err: Error | null, rows: any[]) => {
         if (err) {
           console.error('Error in getAllBooks:', err);
           reject(err);
         } else {
           const books: Book[] = rows.map(row => ({
             id: row.id,
             author: row.author,
             title: row.title,
             isbn: row.isbn,
             genre: row.genre,
             publication_year: row.publication_year,
             description: row.description
           }));
           resolve(books);
         }
       });
     });
   }
   ```

2. **Replace the `getBookById` method:**
   ```typescript
   async getBookById(id: string): Promise<Book | null> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, author, title, isbn, genre, publication_year, description 
         FROM books 
         WHERE id = ?
       `;
       
       this.db.get(sql, [id], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in getBookById:', err);
           reject(err);
         } else if (row) {
           const book: Book = {
             id: row.id,
             author: row.author,
             title: row.title,
             isbn: row.isbn,
             genre: row.genre,
             publication_year: row.publication_year,
             description: row.description
           };
           resolve(book);
         } else {
           resolve(null);
         }
       });
     });
   }
   ```

3. **Replace the `createBook` method:**
   ```typescript
   async createBook(book: Book): Promise<void> {
     return new Promise((resolve, reject) => {
       const sql = `
         INSERT INTO books (id, author, title, isbn, genre, publication_year, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
       `;
       
       this.db.run(
         sql,
         [book.id, book.author, book.title, book.isbn, book.genre, book.publication_year, book.description],
         function (err: Error | null) {
           if (err) {
             console.error('Error in createBook:', err);
             reject(err);
           } else {
             resolve();
           }
         }
       );
     });
   }
   ```

4. **Replace the `updateBook` method:**
   ```typescript
   async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
     return new Promise((resolve, reject) => {
       const updateFields: string[] = [];
       const values: any[] = [];
       
       if (updates.author !== undefined) {
         updateFields.push('author = ?');
         values.push(updates.author);
       }
       if (updates.title !== undefined) {
         updateFields.push('title = ?');
         values.push(updates.title);
       }
       if (updates.isbn !== undefined) {
         updateFields.push('isbn = ?');
         values.push(updates.isbn);
       }
       if (updates.genre !== undefined) {
         updateFields.push('genre = ?');
         values.push(updates.genre);
       }
       if (updates.publication_year !== undefined) {
         updateFields.push('publication_year = ?');
         values.push(updates.publication_year);
       }
       if (updates.description !== undefined) {
         updateFields.push('description = ?');
         values.push(updates.description);
       }
       
       if (updateFields.length === 0) {
         resolve(false);
         return;
       }
       
       values.push(id);
       const sql = `UPDATE books SET ${updateFields.join(', ')} WHERE id = ?`;
       
       this.db.run(sql, values, function (err: Error | null) {
         if (err) {
           console.error('Error in updateBook:', err);
           reject(err);
         } else {
           resolve(this.changes > 0);
         }
       });
     });
   }
   ```

### Step 4: Add New Book Search Methods

1. **Add the `searchBooks` method:**
   ```typescript
   async searchBooks(filters: BookSearchFilters): Promise<Book[]> {
     return new Promise((resolve, reject) => {
       let sql = `
         SELECT DISTINCT b.id, b.author, b.title, b.isbn, b.genre, b.publication_year, b.description 
         FROM books b
       `;
       
       const conditions: string[] = [];
       const values: any[] = [];
       
       if (filters.available_only) {
         sql += ` LEFT JOIN book_copies bc ON b.id = bc.book_id`;
         conditions.push(`bc.status = 'available'`);
       }
       
       if (filters.title) {
         conditions.push(`b.title LIKE ?`);
         values.push(`%${filters.title}%`);
       }
       
       if (filters.author) {
         conditions.push(`b.author LIKE ?`);
         values.push(`%${filters.author}%`);
       }
       
       if (filters.isbn) {
         conditions.push(`b.isbn = ?`);
         values.push(filters.isbn);
       }
       
       if (filters.genre) {
         conditions.push(`b.genre LIKE ?`);
         values.push(`%${filters.genre}%`);
       }
       
       if (filters.publication_year) {
         conditions.push(`b.publication_year = ?`);
         values.push(filters.publication_year);
       }
       
       if (conditions.length > 0) {
         sql += ` WHERE ${conditions.join(' AND ')}`;
       }
       
       sql += ` ORDER BY b.title ASC`;
       
       if (filters.limit) {
         sql += ` LIMIT ?`;
         values.push(filters.limit);
         
         if (filters.offset) {
           sql += ` OFFSET ?`;
           values.push(filters.offset);
         }
       }
       
       this.db.all(sql, values, (err: Error | null, rows: any[]) => {
         if (err) {
           console.error('Error in searchBooks:', err);
           reject(err);
         } else {
           const books: Book[] = rows.map(row => ({
             id: row.id,
             author: row.author,
             title: row.title,
             isbn: row.isbn,
             genre: row.genre,
             publication_year: row.publication_year,
             description: row.description
           }));
           resolve(books);
         }
       });
     });
   }
   ```

2. **Add helper search methods:**
   ```typescript
   async getBookByISBN(isbn: string): Promise<Book | null> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, author, title, isbn, genre, publication_year, description 
         FROM books 
         WHERE isbn = ?
       `;
       
       this.db.get(sql, [isbn], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in getBookByISBN:', err);
           reject(err);
         } else if (row) {
           resolve({
             id: row.id,
             author: row.author,
             title: row.title,
             isbn: row.isbn,
             genre: row.genre,
             publication_year: row.publication_year,
             description: row.description
           });
         } else {
           resolve(null);
         }
       });
     });
   }

   async getBooksByGenre(genre: string): Promise<Book[]> {
     return this.searchBooks({ genre });
   }

   async getBooksByAuthor(author: string): Promise<Book[]> {
     return this.searchBooks({ author });
   }

   async getBooksByYear(year: number): Promise<Book[]> {
     return this.searchBooks({ publication_year: year });
   }
   ```

### Step 5: Add Book Copy Management Methods

1. **Add copy creation method:**
   ```typescript
   async createBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BookCopy> {
     return new Promise(async (resolve, reject) => {
       try {
         const copyNumber = await this.getNextCopyNumber(bookId);
         const copyId = uuidv4();
         const now = new Date().toISOString();
         
         const sql = `
           INSERT INTO book_copies (id, book_id, copy_number, status, condition, created_at, updated_at) 
           VALUES (?, ?, ?, 'available', ?, ?, ?)
         `;
         
         const condition = copyData.condition || 'good';
         
         this.db.run(
           sql,
           [copyId, bookId, copyNumber, condition, now, now],
           function (err: Error | null) {
             if (err) {
               console.error('Error in createBookCopy:', err);
               reject(err);
             } else {
               const newCopy: BookCopy = {
                 id: copyId,
                 book_id: bookId,
                 copy_number: copyNumber,
                 status: 'available',
                 condition: condition,
                 created_at: now,
                 updated_at: now
               };
               resolve(newCopy);
             }
           }
         );
       } catch (error) {
         reject(error);
       }
     });
   }
   ```

2. **Add copy retrieval methods:**
   ```typescript
   async getBookCopies(bookId: string): Promise<BookCopy[]> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, book_id, copy_number, status, condition, created_at, updated_at
         FROM book_copies 
         WHERE book_id = ? 
         ORDER BY copy_number ASC
       `;
       
       this.db.all(sql, [bookId], (err: Error | null, rows: any[]) => {
         if (err) {
           console.error('Error in getBookCopies:', err);
           reject(err);
         } else {
           const copies: BookCopy[] = rows.map(row => ({
             id: row.id,
             book_id: row.book_id,
             copy_number: row.copy_number,
             status: row.status,
             condition: row.condition,
             created_at: row.created_at,
             updated_at: row.updated_at
           }));
           resolve(copies);
         }
       });
     });
   }

   async getBookCopyById(copyId: string): Promise<BookCopy | null> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, book_id, copy_number, status, condition, created_at, updated_at
         FROM book_copies 
         WHERE id = ?
       `;
       
       this.db.get(sql, [copyId], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in getBookCopyById:', err);
           reject(err);
         } else if (row) {
           resolve({
             id: row.id,
             book_id: row.book_id,
             copy_number: row.copy_number,
             status: row.status,
             condition: row.condition,
             created_at: row.created_at,
             updated_at: row.updated_at
           });
         } else {
           resolve(null);
         }
       });
     });
   }
   ```

### Step 6: Add Copy Update and Delete Methods

1. **Add copy update methods:**
   ```typescript
   async updateBookCopy(copyId: string, updates: Partial<BookCopy>): Promise<boolean> {
     return new Promise((resolve, reject) => {
       const updateFields: string[] = [];
       const values: any[] = [];
       
       if (updates.status !== undefined) {
         updateFields.push('status = ?');
         values.push(updates.status);
       }
       if (updates.condition !== undefined) {
         updateFields.push('condition = ?');
         values.push(updates.condition);
       }
       
       if (updateFields.length === 0) {
         resolve(false);
         return;
       }
       
       updateFields.push('updated_at = ?');
       values.push(new Date().toISOString());
       values.push(copyId);
       
       const sql = `UPDATE book_copies SET ${updateFields.join(', ')} WHERE id = ?`;
       
       this.db.run(sql, values, function (err: Error | null) {
         if (err) {
           console.error('Error in updateBookCopy:', err);
           reject(err);
         } else {
           resolve(this.changes > 0);
         }
       });
     });
   }

   async updateBookCopyStatus(copyId: string, status: string): Promise<boolean> {
     return this.updateBookCopy(copyId, { status: status as any });
   }

   async deleteBookCopy(copyId: string): Promise<boolean> {
     return new Promise((resolve, reject) => {
       const sql = 'DELETE FROM book_copies WHERE id = ?';
       
       this.db.run(sql, [copyId], function (err: Error | null) {
         if (err) {
           console.error('Error in deleteBookCopy:', err);
           reject(err);
         } else {
           resolve(this.changes > 0);
         }
       });
     });
   }
   ```

### Step 7: Add Availability Methods

1. **Add availability tracking methods:**
   ```typescript
   async getAvailableCopies(bookId: string): Promise<BookCopy[]> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT id, book_id, copy_number, status, condition, created_at, updated_at
         FROM book_copies 
         WHERE book_id = ? AND status = 'available'
         ORDER BY copy_number ASC
       `;
       
       this.db.all(sql, [bookId], (err: Error | null, rows: any[]) => {
         if (err) {
           console.error('Error in getAvailableCopies:', err);
           reject(err);
         } else {
           const copies: BookCopy[] = rows.map(row => ({
             id: row.id,
             book_id: row.book_id,
             copy_number: row.copy_number,
             status: row.status,
             condition: row.condition,
             created_at: row.created_at,
             updated_at: row.updated_at
           }));
           resolve(copies);
         }
       });
     });
   }

   async getBookAvailability(bookId: string): Promise<BookAvailability> {
     return new Promise((resolve, reject) => {
       const sql = `
         SELECT 
           COUNT(*) as total_copies,
           COUNT(CASE WHEN status = 'available' THEN 1 END) as available_copies,
           COUNT(CASE WHEN status = 'borrowed' THEN 1 END) as borrowed_copies,
           COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_copies
         FROM book_copies 
         WHERE book_id = ?
       `;
       
       this.db.get(sql, [bookId], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in getBookAvailability:', err);
           reject(err);
         } else {
           const availability: BookAvailability = {
             book_id: bookId,
             total_copies: row.total_copies || 0,
             available_copies: row.available_copies || 0,
             borrowed_copies: row.borrowed_copies || 0,
             maintenance_copies: row.maintenance_copies || 0
           };
           resolve(availability);
         }
       });
     });
   }
   ```

### Step 8: Add Books with Copies Methods

1. **Add composite methods:**
   ```typescript
   async getBookWithCopies(id: string): Promise<BookWithCopies | null> {
     try {
       const book = await this.getBookById(id);
       if (!book) return null;
       
       const copies = await this.getBookCopies(id);
       const availability = await this.getBookAvailability(id);
       
       const bookWithCopies: BookWithCopies = {
         ...book,
         copies,
         total_copies: availability.total_copies,
         available_copies: availability.available_copies
       };
       
       return bookWithCopies;
     } catch (error) {
       throw error;
     }
   }

   async getAllBooksWithCopies(): Promise<BookWithCopies[]> {
     try {
       const books = await this.getAllBooks();
       const booksWithCopies: BookWithCopies[] = [];
       
       for (const book of books) {
         const copies = await this.getBookCopies(book.id);
         const availability = await this.getBookAvailability(book.id);
         
         booksWithCopies.push({
           ...book,
           copies,
           total_copies: availability.total_copies,
           available_copies: availability.available_copies
         });
       }
       
       return booksWithCopies;
     } catch (error) {
       throw error;
     }
   }
   ```

### Step 9: Add Utility Methods

1. **Add helper methods:**
   ```typescript
   async copyExists(copyId: string): Promise<boolean> {
     return new Promise((resolve, reject) => {
       const sql = 'SELECT 1 FROM book_copies WHERE id = ?';
       
       this.db.get(sql, [copyId], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in copyExists:', err);
           reject(err);
         } else {
           resolve(!!row);
         }
       });
     });
   }

   async getNextCopyNumber(bookId: string): Promise<number> {
     return new Promise((resolve, reject) => {
       const sql = 'SELECT MAX(copy_number) as max_copy FROM book_copies WHERE book_id = ?';
       
       this.db.get(sql, [bookId], (err: Error | null, row: any) => {
         if (err) {
           console.error('Error in getNextCopyNumber:', err);
           reject(err);
         } else {
           const nextNumber = (row.max_copy || 0) + 1;
           resolve(nextNumber);
         }
       });
     });
   }

   async getAllBookAvailabilities(): Promise<BookAvailability[]> {
     try {
       const books = await this.getAllBooks();
       const availabilities: BookAvailability[] = [];
       
       for (const book of books) {
         const availability = await this.getBookAvailability(book.id);
         availabilities.push(availability);
       }
       
       return availabilities;
     } catch (error) {
       throw error;
     }
   }
   ```

### Step 10: Test the Repository

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Test database operations (optional manual test):**
   ```bash
   # Test that we can query the enhanced schema
   sqlite3 library.db "SELECT id, author, title, isbn, genre FROM books LIMIT 1;"
   ```

## Expected Results
- ✅ IBookRepository interface updated with all new methods
- ✅ All existing methods handle new book fields
- ✅ Complete copy management functionality
- ✅ Advanced search and filtering capabilities
- ✅ Book availability tracking working
- ✅ Composite book-with-copies methods functional
- ✅ TypeScript compilation successful

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.ts
2. Verify method signatures match interface exactly
3. Ensure all Promise return types are correct

### If database queries fail:
1. Verify column names match database schema
2. Check that foreign key relationships work
3. Test SQL queries manually in sqlite3 CLI

## Next Steps
After completing this task, proceed to Task 1.4: Update Book Service.

## Files Modified
- ✅ `src/data/BookRepository.ts` (extensively updated)