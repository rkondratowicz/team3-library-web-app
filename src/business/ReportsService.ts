import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';
import type {
  BusinessResult,
  PopularBook,
  PopularBooksResponse,
  ReportsFilters,
} from '../shared/types.js';

// Database query result interfaces
interface PopularBookRow {
  book_id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  total_borrows: number;
  current_borrows: number;
  total_copies: number;
  popularity_score: number;
}

interface StatsRow {
  total_unique_books: number;
  total_borrowings: number;
  unique_borrowers: number;
  avg_borrows_per_book: number;
  max_borrows_single_book: number;
}

interface PopularBooksWithStatsResponse extends PopularBooksResponse {
  statistics: {
    total_unique_books: number;
    total_borrowings: number;
    unique_borrowers: number;
    avg_borrows_per_book: number;
    max_borrows_single_book: number;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ReportsService {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(__dirname, '..', '..', 'library.db');
    this.db = new sqlite3.Database(dbPath);
  }

  /**
   * Get most popular books based on borrowing frequency
   */
  async getPopularBooks(filters: ReportsFilters): Promise<BusinessResult<PopularBooksResponse>> {
    return new Promise((resolve) => {
      try {
        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];

        // Apply period filter
        if (filters.period && filters.period !== 'all-time') {
          const dateThreshold = this.getDateThreshold(filters.period);
          whereClause += ' AND b.borrowed_date >= ?';
          params.push(dateThreshold);
        }

        // Apply genre filter
        if (filters.genre) {
          whereClause += ' AND books.genre = ?';
          params.push(filters.genre);
        }

        // Apply minimum borrows filter
        const minBorrows = filters.min_borrows || 1;
        const limit = filters.limit || 20;

        const query = `
          SELECT 
            books.id as book_id,
            books.title,
            books.author,
            books.isbn,
            books.genre,
            books.publication_year,
            COUNT(DISTINCT b.id) as total_borrows,
            COUNT(DISTINCT CASE WHEN b.status = 'active' THEN b.id END) as current_borrows,
            COUNT(DISTINCT bc.id) as total_copies,
            CAST(COUNT(DISTINCT b.id) AS FLOAT) / COUNT(DISTINCT bc.id) as popularity_score
          FROM books
          LEFT JOIN book_copies bc ON books.id = bc.book_id
          LEFT JOIN borrowings b ON bc.id = b.book_copy_id
          ${whereClause}
          GROUP BY books.id, books.title, books.author, books.isbn, books.genre, books.publication_year
          HAVING COUNT(DISTINCT b.id) >= ?
          ORDER BY total_borrows DESC, popularity_score DESC
          LIMIT ?
        `;

        params.push(minBorrows, limit);

        this.db.all(query, params, (err, rows: PopularBookRow[]) => {
          if (err) {
            console.error('Database error in getPopularBooks:', err);
            resolve({
              success: false,
              error: 'Database query failed',
              statusCode: 500,
            });
            return;
          }

          const books: PopularBook[] = rows.map((row) => ({
            book_id: row.book_id,
            title: row.title || '',
            author: row.author || '',
            isbn: row.isbn || undefined,
            genre: row.genre || undefined,
            publication_year: row.publication_year || undefined,
            total_borrows: Number(row.total_borrows) || 0,
            current_borrows: Number(row.current_borrows) || 0,
            total_copies: Number(row.total_copies) || 0,
            popularity_score: Number(row.popularity_score) || 0,
          }));

          const response: PopularBooksResponse = {
            books,
            total: books.length,
            period: filters.period || 'all-time',
            generated_at: new Date().toISOString(),
          };

          resolve({
            success: true,
            data: response,
          });
        });
      } catch (error) {
        console.error('Error in getPopularBooks service:', error);
        resolve({
          success: false,
          error: 'Failed to retrieve popular books',
          statusCode: 500,
        });
      }
    });
  }

  /**
   * Get popular books with additional statistics
   */
  async getPopularBooksWithStats(
    filters: ReportsFilters,
  ): Promise<BusinessResult<PopularBooksWithStatsResponse>> {
    return new Promise((resolve) => {
      try {
        // First get the popular books
        this.getPopularBooks(filters).then((booksResult) => {
          if (!booksResult.success || !booksResult.data) {
            resolve({
              success: false,
              error: booksResult.error || 'Failed to retrieve popular books',
              statusCode: booksResult.statusCode || 500,
            });
            return;
          } // Get additional statistics
          const statsQuery = `
            SELECT 
              COUNT(DISTINCT books.id) as total_unique_books,
              COUNT(DISTINCT b.id) as total_borrowings,
              COUNT(DISTINCT b.member_id) as unique_borrowers,
              AVG(CAST(book_stats.borrow_count AS FLOAT)) as avg_borrows_per_book,
              MAX(book_stats.borrow_count) as max_borrows_single_book
            FROM books
            LEFT JOIN book_copies bc ON books.id = bc.book_id
            LEFT JOIN borrowings b ON bc.id = b.book_copy_id
            LEFT JOIN (
              SELECT 
                books.id,
                COUNT(b.id) as borrow_count
              FROM books
              LEFT JOIN book_copies bc ON books.id = bc.book_id
              LEFT JOIN borrowings b ON bc.id = b.book_copy_id
              GROUP BY books.id
            ) book_stats ON books.id = book_stats.id
          `;

          this.db.get(statsQuery, [], (err, statsRow: StatsRow) => {
            if (err) {
              console.error('Database error in getPopularBooksWithStats:', err);
              resolve({
                success: false,
                error: 'Failed to retrieve statistics',
                statusCode: 500,
              });
              return;
            }

            const response: PopularBooksWithStatsResponse = {
              books: booksResult.data!.books,
              total: booksResult.data!.total,
              period: booksResult.data!.period,
              generated_at: booksResult.data!.generated_at,
              statistics: {
                total_unique_books: Number(statsRow?.total_unique_books) || 0,
                total_borrowings: Number(statsRow?.total_borrowings) || 0,
                unique_borrowers: Number(statsRow?.unique_borrowers) || 0,
                avg_borrows_per_book: Number(statsRow?.avg_borrows_per_book) || 0,
                max_borrows_single_book: Number(statsRow?.max_borrows_single_book) || 0,
              },
            };

            resolve({
              success: true,
              data: response,
            });
          });
        });
      } catch (error) {
        console.error('Error in getPopularBooksWithStats service:', error);
        resolve({
          success: false,
          error: 'Failed to retrieve detailed statistics',
          statusCode: 500,
        });
      }
    });
  }

  /**
   * Helper method to get date threshold based on period
   */
  private getDateThreshold(period: string): string {
    const now = new Date();

    switch (period) {
      case 'last-week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          .toISOString()
          .split('T')[0];
      case 'last-year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          .toISOString()
          .split('T')[0];
      default:
        return '1900-01-01'; // Very old date for all-time
    }
  }
}
