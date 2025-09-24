import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import type { Book, BookDbRow } from '../shared/types.js';

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

  private mapDbRowToBook(row: BookDbRow): Book {
    return {
      id: row.id,
      author: row.author,
      title: row.title,
      isbn: row.isbn,
      genre: row.genre,
      publication_year: row.publication_year,
      description: row.description
    };
  }

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
          const books: Book[] = rows.map(row => this.mapDbRowToBook(row));
          resolve(books);
        }
      });
    });
  }

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
          resolve(this.mapDbRowToBook(row));
        } else {
          resolve(null);
        }
      });
    });
  }

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
