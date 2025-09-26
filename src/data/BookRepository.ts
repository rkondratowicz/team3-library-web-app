import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import type {
  Book,
  BookCopy,
  BookCopyWithBorrower,
  BookDbRow,
  Borrowing,
  CreateBorrowingRequest,
} from '../shared/types.js';

interface BookCopyWithBorrowerRow {
  id: string;
  book_id: string;
  copy_number: number;
  status: 'available' | 'borrowed' | 'maintenance';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  created_at: string;
  updated_at: string;
  borrowing_id?: string;
  member_id?: string;
  borrowed_date?: string;
  due_date?: string;
  memberName?: string;
  email?: string;
}

export interface IBookRepository {
  getAllBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | null>;
  createBook(book: Book): Promise<void>;
  updateBook(id: string, updates: Partial<Book>): Promise<boolean>;
  deleteBook(id: string): Promise<boolean>;
  bookExists(id: string): Promise<boolean>;

  // Book copy methods
  getBookCopies(bookId: string): Promise<BookCopy[]>;
  getBookCopiesWithBorrowers(bookId: string): Promise<BookCopyWithBorrower[]>;
  getBookCopyById(copyId: string): Promise<BookCopy | null>;
  createBookCopy(bookCopy: BookCopy): Promise<void>;
  updateBookCopy(copyId: string, updates: Partial<BookCopy>): Promise<boolean>;
  deleteBookCopy(copyId: string): Promise<boolean>;
  getAvailableBookCopies(bookId: string): Promise<BookCopy[]>;
  getNextCopyNumber(bookId: string): Promise<number>;

  // Borrowing methods
  createBorrowing(borrowingData: CreateBorrowingRequest): Promise<Borrowing>;
  getBorrowingById(id: string): Promise<Borrowing | null>;
  getMemberActiveBorrowings(memberId: string): Promise<Borrowing[]>;
  returnBook(borrowingId: string): Promise<Borrowing>;
}

export class BookRepository implements IBookRepository {
  private db: sqlite3.Database;

  constructor() {
    // Get the directory path for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    this.db = new sqlite3.Database(
      join(__dirname, '..', '..', 'library.db'),
      (err: Error | null) => {
        if (err) {
          console.error('Error opening database:', err.message);
        } else {
          console.log('Connected to the SQLite database.');
        }
      },
    );
  }

  private mapDbRowToBook(row: BookDbRow): Book {
    return {
      id: row.id,
      author: row.author,
      title: row.title,
      isbn: row.isbn,
      genre: row.genre,
      publication_year: row.publication_year,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getAllBooks(): Promise<Book[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, author, title, isbn, genre, publication_year, description, created_at, updated_at 
        FROM books 
        ORDER BY title ASC
      `;

      this.db.all(sql, [], (err: Error | null, rows: BookDbRow[]) => {
        if (err) {
          console.error('Error in getAllBooks:', err);
          reject(err);
        } else {
          const books: Book[] = rows.map((row) => this.mapDbRowToBook(row));
          resolve(books);
        }
      });
    });
  }

  async getBookById(id: string): Promise<Book | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, author, title, isbn, genre, publication_year, description, created_at, updated_at
        FROM books 
        WHERE id = ?
      `;

      this.db.get(sql, [id], (err: Error | null, row: BookDbRow) => {
        if (err) {
          console.error('Error in getBookById:', err);
          reject(err);
        } else if (row) {
          const book = this.mapDbRowToBook(row);
          resolve(book);
        } else {
          resolve(null);
        }
      });
    });
  }

  async createBook(book: Book): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO books (id, author, title, isbn, genre, publication_year, description, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          book.id,
          book.author,
          book.title,
          book.isbn,
          book.genre,
          book.publication_year,
          book.description,
          book.created_at,
          book.updated_at,
        ],
        (err: Error | null) => {
          if (err) {
            console.error('Error in createBook:', err);
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updateFields: string[] = [];
      const values: (string | number | undefined)[] = [];

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

      // Always update the timestamp
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());

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

  async deleteBook(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Delete book copies first (due to foreign key constraint)
      this.db.run('DELETE FROM book_copies WHERE book_id = ?', [id], (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to delete book copies: ${err.message}`));
        } else {
          // Then delete the book
          this.db.run('DELETE FROM books WHERE id = ?', [id], function (err: Error | null) {
            if (err) {
              reject(new Error(`Failed to delete book: ${err.message}`));
            } else {
              resolve(this.changes > 0);
            }
          });
        }
      });
    });
  }

  async bookExists(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT 1 FROM books WHERE id = ? LIMIT 1',
        [id],
        (err: Error | null, row: unknown) => {
          if (err) {
            reject(new Error(`Failed to check book existence: ${err.message}`));
          } else {
            resolve(!!row);
          }
        },
      );
    });
  }

  // Book Copy Methods

  async getBookCopies(bookId: string): Promise<BookCopy[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, book_id, copy_number, status, condition, created_at, updated_at 
        FROM book_copies 
        WHERE book_id = ? 
        ORDER BY copy_number ASC
      `;

      this.db.all(sql, [bookId], (err: Error | null, rows: BookCopy[]) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          const copies: BookCopy[] = rows.map((row) => ({
            id: row.id,
            book_id: row.book_id,
            copy_number: row.copy_number,
            status: row.status,
            condition: row.condition,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
          resolve(copies);
        }
      });
    });
  }

  async getBookCopiesWithBorrowers(bookId: string): Promise<BookCopyWithBorrower[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          bc.id, 
          bc.book_id, 
          bc.copy_number, 
          bc.status, 
          bc.condition, 
          bc.created_at, 
          bc.updated_at,
          b.id as borrowing_id,
          b.member_id,
          b.borrowed_date,
          b.due_date,
          m.memberName,
          m.email
        FROM book_copies bc
        LEFT JOIN borrowings b ON bc.id = b.book_copy_id AND b.status = 'active'
        LEFT JOIN members m ON b.member_id = m.id
        WHERE bc.book_id = ? 
        ORDER BY bc.copy_number ASC
      `;

      this.db.all(sql, [bookId], (err: Error | null, rows: BookCopyWithBorrowerRow[]) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          const copies: BookCopyWithBorrower[] = rows.map((row) => {
            const copy: BookCopyWithBorrower = {
              id: row.id,
              book_id: row.book_id,
              copy_number: row.copy_number,
              status: row.status,
              condition: row.condition,
              created_at: row.created_at,
              updated_at: row.updated_at,
            };

            // Add borrower information if the copy is borrowed
            if (
              row.borrowing_id &&
              row.member_id &&
              row.memberName &&
              row.email &&
              row.borrowed_date &&
              row.due_date
            ) {
              copy.borrower = {
                id: row.member_id,
                name: row.memberName,
                email: row.email,
                borrowed_date: row.borrowed_date,
                due_date: row.due_date,
              };
            }

            return copy;
          });
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

      this.db.get(sql, [copyId], (err: Error | null, row: BookCopy) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else if (row) {
          const copy: BookCopy = {
            id: row.id,
            book_id: row.book_id,
            copy_number: row.copy_number,
            status: row.status,
            condition: row.condition,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
          resolve(copy);
        } else {
          resolve(null);
        }
      });
    });
  }

  async createBookCopy(bookCopy: BookCopy): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO book_copies (id, book_id, copy_number, status, condition)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [bookCopy.id, bookCopy.book_id, bookCopy.copy_number, bookCopy.status, bookCopy.condition],
        (err: Error | null) => {
          if (err) {
            console.error('Database error:', err.message);
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  async updateBookCopy(copyId: string, updates: Partial<BookCopy>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updateFields: string[] = [];
      const values: string[] = [];

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

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(copyId);

      const sql = `UPDATE book_copies SET ${updateFields.join(', ')} WHERE id = ?`;

      this.db.run(sql, values, function (err: Error | null) {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async deleteBookCopy(copyId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM book_copies WHERE id = ?';

      this.db.run(sql, [copyId], function (err: Error | null) {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async getAvailableBookCopies(bookId: string): Promise<BookCopy[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, book_id, copy_number, status, condition, created_at, updated_at 
        FROM book_copies 
        WHERE book_id = ? AND status = 'available'
        ORDER BY copy_number ASC
      `;

      this.db.all(sql, [bookId], (err: Error | null, rows: BookCopy[]) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          const copies: BookCopy[] = rows.map((row) => ({
            id: row.id,
            book_id: row.book_id,
            copy_number: row.copy_number,
            status: row.status,
            condition: row.condition,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));
          resolve(copies);
        }
      });
    });
  }

  async getNextCopyNumber(bookId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT MAX(copy_number) as max_copy_number 
        FROM book_copies 
        WHERE book_id = ?
      `;

      this.db.get(sql, [bookId], (err: Error | null, row: { max_copy_number: number } | null) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          const nextNumber = (row?.max_copy_number || 0) + 1;
          resolve(nextNumber);
        }
      });
    });
  }

  // Borrowing methods
  async createBorrowing(borrowingData: CreateBorrowingRequest): Promise<Borrowing> {
    const borrowingId = crypto.randomUUID();
    const borrowedDate = borrowingData.borrowed_date || new Date().toISOString().split('T')[0];
    const dueDate = borrowingData.due_date || this.calculateDueDate(borrowedDate);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO borrowings (id, member_id, book_copy_id, borrowed_date, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          borrowingId,
          borrowingData.member_id,
          borrowingData.book_copy_id,
          borrowedDate,
          dueDate,
          borrowingData.notes || null,
        ],
        (err) => {
          if (err) {
            console.error('Database error:', err.message);
            reject(err);
          } else {
            // Return the created borrowing
            const borrowing: Borrowing = {
              id: borrowingId,
              member_id: borrowingData.member_id,
              book_copy_id: borrowingData.book_copy_id,
              borrowed_date: borrowedDate,
              due_date: dueDate,
              renewal_count: 0,
              status: 'active',
              notes: borrowingData.notes || undefined,
            };
            resolve(borrowing);
          }
        },
      );
    });
  }

  async getBorrowingById(id: string): Promise<Borrowing | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM borrowings WHERE id = ?
      `;

      this.db.get(sql, [id], (err: Error | null, row: Borrowing | undefined) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async getMemberActiveBorrowings(memberId: string): Promise<Borrowing[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM borrowings 
        WHERE member_id = ? AND status = 'active'
        ORDER BY borrowed_date DESC
      `;

      this.db.all(sql, [memberId], (err: Error | null, rows: Borrowing[]) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async returnBook(borrowingId: string): Promise<Borrowing> {
    const returnedDate = new Date().toISOString().split('T')[0];

    return new Promise((resolve, reject) => {
      // Start transaction to update borrowing and book copy status
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Update borrowing record
        const updateBorrowingSql = `
          UPDATE borrowings 
          SET returned_date = ?, status = 'returned', updated_at = datetime('now')
          WHERE id = ? AND status = 'active'
        `;

        this.db.run(updateBorrowingSql, [returnedDate, borrowingId], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            console.error('Database error updating borrowing:', err.message);
            reject(err);
            return;
          }

          // Update book copy status to available
          const updateCopySql = `
            UPDATE book_copies 
            SET status = 'available', updated_at = datetime('now')
            WHERE id = (
              SELECT book_copy_id FROM borrowings WHERE id = ?
            )
          `;

          this.db.run(updateCopySql, [borrowingId], (err) => {
            if (err) {
              this.db.run('ROLLBACK');
              console.error('Database error updating copy status:', err.message);
              reject(err);
              return;
            }

            // Get the updated borrowing record
            const getBorrowingSql = 'SELECT * FROM borrowings WHERE id = ?';
            this.db.get(getBorrowingSql, [borrowingId], (err: Error | null, row: Borrowing) => {
              if (err) {
                this.db.run('ROLLBACK');
                console.error('Database error retrieving borrowing:', err.message);
                reject(err);
                return;
              }

              this.db.run('COMMIT');
              resolve(row);
            });
          });
        });
      });
    });
  }

  private calculateDueDate(borrowedDate: string): string {
    const date = new Date(borrowedDate);
    date.setDate(date.getDate() + 14); // 2 weeks checkout period
    return date.toISOString().split('T')[0];
  }

  // Clean up database connection
  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}
