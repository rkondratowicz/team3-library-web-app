import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import type { Book } from '../shared/types.js';

export interface IBookRepository {
  getAllBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | null>;
  createBook(book: Book): Promise<void>;
  updateBook(id: string, updates: Partial<Book>): Promise<boolean>;
  deleteBook(id: string): Promise<boolean>;
  bookExists(id: string): Promise<boolean>;
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

  private async getBookCopiesCount(bookId: string): Promise<{ total: number; available: number }> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available
        FROM book_copies 
        WHERE book_id = ?
      `, [bookId], (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Failed to get copy counts: ${err.message}`));
        } else {
          resolve({
            total: row?.total || 0,
            available: row?.available || 0
          });
        }
      });
    });
  }

  private enhanceBookWithCopyInfo(book: any): Book {
    const enhanced: Book = {
      ...book,
      // Map database fields to UI-friendly names
      category: book.genre,
      publishedYear: book.publication_year,
      // Will be populated by getBookCopiesCount
      totalCopies: 1,
      availableCopies: 1,
      available: true
    };
    return enhanced;
  }

  async getAllBooks(): Promise<Book[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          b.*,
          COUNT(bc.id) as total_copies,
          SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as available_copies
        FROM books b
        LEFT JOIN book_copies bc ON b.id = bc.book_id
        GROUP BY b.id
        ORDER BY b.author, b.title
      `, [], async (err: Error | null, rows: any[]) => {
        if (err) {
          reject(new Error(`Failed to fetch books: ${err.message}`));
        } else {
          const books = rows.map(row => {
            const book = this.enhanceBookWithCopyInfo(row);
            book.totalCopies = row.total_copies || 1;
            book.availableCopies = row.available_copies || (row.total_copies > 0 ? 0 : 1);
            book.available = (book.availableCopies || 0) > 0;
            return book;
          });
          resolve(books);
        }
      });
    });
  }

  async getBookById(id: string): Promise<Book | null> {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          b.*,
          COUNT(bc.id) as total_copies,
          SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as available_copies
        FROM books b
        LEFT JOIN book_copies bc ON b.id = bc.book_id
        WHERE b.id = ?
        GROUP BY b.id
      `, [id], (err: Error | null, row: any) => {
        if (err) {
          reject(new Error(`Failed to fetch book: ${err.message}`));
        } else if (!row) {
          resolve(null);
        } else {
          const book = this.enhanceBookWithCopyInfo(row);
          book.totalCopies = row.total_copies || 1;
          book.availableCopies = row.available_copies || (row.total_copies > 0 ? 0 : 1);
          book.available = (book.availableCopies || 0) > 0;
          resolve(book);
        }
      });
    });
  }

  async createBook(book: Book): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO books (id, author, title, isbn, genre, publication_year, description, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;

      // Map UI fields to database fields
      const genre = book.category || book.genre;
      const publicationYear = book.publishedYear || book.publication_year;

      this.db.run(query, [
        book.id,
        book.author,
        book.title,
        book.isbn,
        genre,
        publicationYear,
        book.description
      ], (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to create book: ${err.message}`));
        } else {
          // Create initial book copies
          const totalCopies = book.totalCopies || 1;
          this.createBookCopies(book.id, totalCopies)
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  private async createBookCopies(bookId: string, count: number): Promise<void> {
    const promises = [];
    for (let i = 1; i <= count; i++) {
      const copyId = `${bookId}-copy-${i}`;
      const promise = new Promise<void>((resolve, reject) => {
        this.db.run(`
          INSERT INTO book_copies (id, book_id, copy_number, status, condition, created_at, updated_at)
          VALUES (?, ?, ?, 'available', 'good', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [copyId, bookId, i], (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      // Map UI fields to database fields and build update query
      if (updates.author !== undefined) {
        fields.push('author = ?');
        values.push(updates.author);
      }
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.isbn !== undefined) {
        fields.push('isbn = ?');
        values.push(updates.isbn);
      }
      if (updates.category !== undefined || updates.genre !== undefined) {
        fields.push('genre = ?');
        values.push(updates.category || updates.genre);
      }
      if (updates.publishedYear !== undefined || updates.publication_year !== undefined) {
        fields.push('publication_year = ?');
        values.push(updates.publishedYear || updates.publication_year);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }

      if (fields.length === 0) {
        resolve(false);
        return;
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      const query = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(query, values, function (err: Error | null) {
        if (err) {
          reject(new Error(`Failed to update book: ${err.message}`));
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
