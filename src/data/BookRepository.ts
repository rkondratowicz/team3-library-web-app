import sqlite3 from 'sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

  async getAllBooks(): Promise<Book[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM books ORDER BY author, title',
        [],
        (err: Error | null, rows: Book[]) => {
          if (err) {
            reject(new Error(`Failed to fetch books: ${err.message}`));
          } else {
            resolve(rows);
          }
        },
      );
    });
  }

  async getBookById(id: string): Promise<Book | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM books WHERE id = ?', [id], (err: Error | null, row: Book) => {
        if (err) {
          reject(new Error(`Failed to fetch book: ${err.message}`));
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async createBook(book: Book): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO books (id, author, title) VALUES (?, ?, ?)';
      this.db.run(query, [book.id, book.author, book.title], (err: Error | null) => {
        if (err) {
          reject(new Error(`Failed to create book: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: (string | undefined)[] = [];

      if (updates.author !== undefined) {
        fields.push('author = ?');
        values.push(updates.author);
      }
      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }

      if (fields.length === 0) {
        resolve(false);
        return;
      }

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
      this.db.run('DELETE FROM books WHERE id = ?', [id], function (err: Error | null) {
        if (err) {
          reject(new Error(`Failed to delete book: ${err.message}`));
        } else {
          resolve(this.changes > 0);
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
