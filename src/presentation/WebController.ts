import type { Request, Response } from 'express';
import type { IBookService } from '../business/BookService.js';

export class WebController {
  constructor(private bookService: IBookService) { }

  // GET / - Home page
  home = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.bookService.getAllBooks();

      const stats = {
        totalBooks: 0,
        availableBooks: 0,
        checkedOut: 0,
        uniqueAuthors: 0,
      };

      if (result.success && result.data) {
        const books = result.data;
        stats.totalBooks = books.length;
        // For now, assume all books are available until copy tracking is fully implemented
        stats.availableBooks = books.length;
        stats.checkedOut = 0;
        stats.uniqueAuthors = new Set(books.map((book) => book.author)).size;
      }

      res.render('home', {
        title: 'Home',
        ...stats,
      });
    } catch (error) {
      console.error('Error in WebController.home:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load home page',
        details: 'Internal server error',
      });
    }
  };

  // GET /books - Books list page
  books = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.bookService.getAllBooks();

      if (result.success && result.data) {
        res.render('books', {
          title: 'Books',
          books: result.data,
        });
      } else {
        res.render('books', {
          title: 'Books',
          books: [],
          error: result.error || 'Failed to fetch books',
        });
      }
    } catch (error) {
      console.error('Error in WebController.books:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load books',
        details: 'Internal server error',
      });
    }
  };

  // GET /books/add - Add book form
  addBookForm = (_req: Request, res: Response): void => {
    res.render('book-form', {
      title: 'Add New Book',
    });
  };

  // GET /books/:id - Book details page
  bookDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.bookService.getBookById(id);

      if (result.success && result.data) {
        res.render('book-details', {
          title: result.data.title,
          book: result.data,
        });
      } else {
        res.status(404).render('error', {
          title: 'Book Not Found',
          error: 'Book not found',
          details: 'The requested book could not be found.',
        });
      }
    } catch (error) {
      console.error('Error in WebController.bookDetails:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load book details',
        details: 'Internal server error',
      });
    }
  };

  // GET /books/:id/edit - Edit book form
  editBookForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.bookService.getBookById(id);

      if (result.success && result.data) {
        res.render('book-form', {
          title: `Edit ${result.data.title}`,
          book: result.data,
        });
      } else {
        res.status(404).render('error', {
          title: 'Book Not Found',
          error: 'Book not found',
          details: 'The requested book could not be found.',
        });
      }
    } catch (error) {
      console.error('Error in WebController.editBookForm:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load book for editing',
        details: 'Internal server error',
      });
    }
  };
}
