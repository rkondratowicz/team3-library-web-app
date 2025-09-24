import type { Request, Response } from 'express';
import type {
  BooksResponse,
  BookResponse,
  ErrorResponse,
  CreateBookRequest,
  UpdateBookRequest,
} from '../shared/types.js';
import type { IBookService } from '../business/BookService.js';

export class BookController {
  constructor(private bookService: IBookService) {}

  // GET /books - Get all books
  getAllBooks = async (
    _req: Request,
    res: Response<BooksResponse | ErrorResponse>,
  ): Promise<void> => {
    try {
      const result = await this.bookService.getAllBooks();

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ Books: result.data });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to fetch books',
          details: 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getAllBooks:', error);
      res.status(500).json({
        error: 'Failed to fetch books',
        details: 'Internal server error',
      });
    }
  };

  // GET /books/:id - Get book by ID
  getBookById = async (
    req: Request,
    res: Response<BookResponse | ErrorResponse>,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.bookService.getBookById(id);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ book: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookById:', error);
      res.status(500).json({
        error: 'Failed to fetch book',
        details: 'Internal server error',
      });
    }
  };

  // POST /books - Create new book
  createBook = async (req: Request, res: Response<BookResponse | ErrorResponse>): Promise<void> => {
    try {
      const bookData: CreateBookRequest = req.body;
      const result = await this.bookService.createBook(bookData);

      if (result.success && result.data) {
        res.status(result.statusCode || 201).json({ book: result.data });
      } else {
        res.status(result.statusCode || 400).json({
          error: result.error || 'Failed to create book',
        });
      }
    } catch (error) {
      console.error('Error in BookController.createBook:', error);
      res.status(500).json({
        error: 'Failed to create book',
        details: 'Internal server error',
      });
    }
  };

  // PUT /books/:id - Update book
  updateBook = async (req: Request, res: Response<BookResponse | ErrorResponse>): Promise<void> => {
    try {
      const { id } = req.params;
      const updates: UpdateBookRequest = req.body;
      const result = await this.bookService.updateBook(id, updates);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ book: result.data });
      } else {
        res.status(result.statusCode || 400).json({
          error: result.error || 'Failed to update book',
        });
      }
    } catch (error) {
      console.error('Error in BookController.updateBook:', error);
      res.status(500).json({
        error: 'Failed to update book',
        details: 'Internal server error',
      });
    }
  };

  // DELETE /books/:id - Delete book
  deleteBook = async (req: Request, res: Response<ErrorResponse>): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.bookService.deleteBook(id);

      if (result.success) {
        res.status(result.statusCode || 204).send();
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Failed to delete book',
        });
      }
    } catch (error) {
      console.error('Error in BookController.deleteBook:', error);
      res.status(500).json({
        error: 'Failed to delete book',
        details: 'Internal server error',
      });
    }
  };
}
