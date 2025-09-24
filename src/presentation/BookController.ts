import type { Request, Response } from 'express';
import type { IBookService } from '../business/BookService.js';
import type {
  BookResponse,
  BooksResponse,
  BookWithCopiesResponse,
  BookCopyResponse,
  BookCopiesResponse,
  BookSearchResponse,
  BookInventoryResponse,
  CreateBookRequest,
  UpdateBookRequest,
  CreateBookCopyRequest,
  UpdateBookCopyRequest,
  BookSearchFilters,
  ErrorResponse,
} from '../shared/types.js';

export class BookController {
  constructor(private bookService: IBookService) { }

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

  // GET /books/search - Search books with filters
  searchBooks = async (
    req: Request,
    res: Response<BooksResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const filters: BookSearchFilters = {
        title: req.query.title as string,
        author: req.query.author as string,
        isbn: req.query.isbn as string,
        genre: req.query.genre as string,
        publication_year: req.query.publication_year ? parseInt(req.query.publication_year as string) : undefined,
        available_only: req.query.available_only === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof BookSearchFilters] === undefined) {
          delete filters[key as keyof BookSearchFilters];
        }
      });

      const result = await this.bookService.searchBooks(filters);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ Books: result.data });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to search books',
          details: 'Search operation failed',
        });
      }
    } catch (error) {
      console.error('Error in BookController.searchBooks:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while searching books',
      });
    }
  };

  // GET /books/by-isbn/:isbn - Get book by ISBN
  getBookByISBN = async (
    req: Request,
    res: Response<BookResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { isbn } = req.params;

      if (!isbn) {
        res.status(400).json({
          error: 'ISBN is required',
          details: 'Please provide a valid ISBN',
        });
        return;
      }

      const result = await this.bookService.getBookByISBN(isbn);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ book: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
          details: 'The requested book could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookByISBN:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching book by ISBN',
      });
    }
  };

  // GET /books/by-genre/:genre - Get books by genre
  getBooksByGenre = async (
    req: Request,
    res: Response<BooksResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { genre } = req.params;

      if (!genre) {
        res.status(400).json({
          error: 'Genre is required',
          details: 'Please provide a valid genre',
        });
        return;
      }

      const result = await this.bookService.getBooksByGenre(genre);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ Books: result.data });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to fetch books by genre',
          details: 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBooksByGenre:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching books by genre',
      });
    }
  };

  // GET /books/by-author/:author - Get books by author
  getBooksByAuthor = async (
    req: Request,
    res: Response<BooksResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { author } = req.params;

      if (!author) {
        res.status(400).json({
          error: 'Author is required',
          details: 'Please provide a valid author name',
        });
        return;
      }

      const result = await this.bookService.getBooksByAuthor(author);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ Books: result.data });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to fetch books by author',
          details: 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBooksByAuthor:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching books by author',
      });
    }
  };

  // GET /books/:id/with-copies - Get book with all copies
  getBookWithCopies = async (
    req: Request,
    res: Response<BookWithCopiesResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Book ID is required',
          details: 'Please provide a valid book ID',
        });
        return;
      }

      const result = await this.bookService.getBookWithCopies(id);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ book: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
          details: 'The requested book could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookWithCopies:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching book with copies',
      });
    }
  };

  // GET /books/with-copies - Get all books with copies
  getAllBooksWithCopies = async (
    req: Request,
    res: Response<{ books: any[] } | ErrorResponse>
  ): Promise<void> => {
    try {
      const result = await this.bookService.getAllBooksWithCopies();

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ books: result.data });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to fetch books with copies',
          details: 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getAllBooksWithCopies:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching books with copies',
      });
    }
  };

  // GET /books/:id/copies - Get all copies for a book
  getBookCopies = async (
    req: Request,
    res: Response<BookCopiesResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Book ID is required',
          details: 'Please provide a valid book ID',
        });
        return;
      }

      const result = await this.bookService.getBookCopies(id);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ copies: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
          details: 'The requested book could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookCopies:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching book copies',
      });
    }
  };

  // POST /books/:id/copies - Add a new copy to a book
  addBookCopy = async (
    req: Request,
    res: Response<BookCopyResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const copyData = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Book ID is required',
          details: 'Please provide a valid book ID',
        });
        return;
      }

      // Set book_id from URL parameter
      copyData.book_id = id;

      const result = await this.bookService.addBookCopy(id, copyData);

      if (result.success && result.data) {
        res.status(result.statusCode || 201).json({ copy: result.data });
      } else {
        res.status(result.statusCode || 400).json({
          error: result.error || 'Failed to add book copy',
          details: 'Could not create the book copy',
        });
      }
    } catch (error) {
      console.error('Error in BookController.addBookCopy:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while adding book copy',
      });
    }
  };

  // GET /books/:id/copies/available - Get available copies for a book
  getAvailableCopies = async (
    req: Request,
    res: Response<BookCopiesResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Book ID is required',
          details: 'Please provide a valid book ID',
        });
        return;
      }

      const result = await this.bookService.getAvailableCopies(id);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ copies: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
          details: 'The requested book could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getAvailableCopies:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching available copies',
      });
    }
  };

  // PUT /copies/:id/status - Update copy status
  updateBookCopyStatus = async (
    req: Request,
    res: Response<BookCopyResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Copy ID is required',
          details: 'Please provide a valid copy ID',
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          error: 'Status is required',
          details: 'Please provide a valid status (available, borrowed, maintenance)',
        });
        return;
      }

      const result = await this.bookService.updateBookCopyStatus(id, status);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ copy: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Copy not found',
          details: 'The requested copy could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.updateBookCopyStatus:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while updating copy status',
      });
    }
  };

  // PUT /copies/:id/condition - Update copy condition
  updateBookCopyCondition = async (
    req: Request,
    res: Response<BookCopyResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { condition } = req.body;

      if (!id) {
        res.status(400).json({
          error: 'Copy ID is required',
          details: 'Please provide a valid copy ID',
        });
        return;
      }

      if (!condition) {
        res.status(400).json({
          error: 'Condition is required',
          details: 'Please provide a valid condition (excellent, good, fair, poor)',
        });
        return;
      }

      const result = await this.bookService.updateBookCopyCondition(id, condition);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ copy: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Copy not found',
          details: 'The requested copy could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.updateBookCopyCondition:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while updating copy condition',
      });
    }
  };

  // DELETE /copies/:id - Remove a book copy
  removeBookCopy = async (
    req: Request,
    res: Response<ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Copy ID is required',
          details: 'Please provide a valid copy ID',
        });
        return;
      }

      const result = await this.bookService.removeBookCopy(id);

      if (result.success) {
        res.status(result.statusCode || 204).send();
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Copy not found',
          details: 'The requested copy could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.removeBookCopy:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while removing copy',
      });
    }
  };

  // GET /books/inventory - Get book inventory report
  getBookInventory = async (
    req: Request,
    res: Response<BookInventoryResponse | ErrorResponse>
  ): Promise<void> => {
    try {
      const result = await this.bookService.getBookInventory();

      if (result.success && result.data) {
        const summary = {
          total_books: result.data.length,
          total_copies: result.data.reduce((sum, item) => sum + item.total_copies, 0),
          available_copies: result.data.reduce((sum, item) => sum + item.available_copies, 0),
          borrowed_copies: result.data.reduce((sum, item) => sum + item.borrowed_copies, 0),
          maintenance_copies: result.data.reduce((sum, item) => sum + item.maintenance_copies, 0),
        };

        res.status(result.statusCode || 200).json({
          inventory: result.data,
          summary
        });
      } else {
        res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to fetch book inventory',
          details: 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookInventory:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching book inventory',
      });
    }
  };

  // GET /books/:id/availability - Get availability for a specific book
  getBookAvailability = async (
    req: Request,
    res: Response<{ availability: any } | ErrorResponse>
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Book ID is required',
          details: 'Please provide a valid book ID',
        });
        return;
      }

      const result = await this.bookService.getBookAvailability(id);

      if (result.success && result.data) {
        res.status(result.statusCode || 200).json({ availability: result.data });
      } else {
        res.status(result.statusCode || 404).json({
          error: result.error || 'Book not found',
          details: 'The requested book could not be found',
        });
      }
    } catch (error) {
      console.error('Error in BookController.getBookAvailability:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred while fetching book availability',
      });
    }
  };
}
