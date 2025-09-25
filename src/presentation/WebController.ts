import type { Request, Response } from 'express';
import type { IBookService } from '../business/BookService.js';
import type { IMemberService } from '../business/MemberService.js';
import type { Member } from '../shared/types.js';

export class WebController {
  constructor(private bookService: IBookService, private memberService?: IMemberService) {}

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
        stats.availableBooks = books.filter((book) => book.available).length;
        stats.checkedOut = stats.totalBooks - stats.availableBooks;
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

  // GET /members - Members list page with search
  members = async (req: Request, res: Response): Promise<void> => {
    if (!this.memberService) {
      res.status(500).render('error', {
        title: 'Error',
        error: 'Member service not available',
        details: 'Member functionality is not configured',
      });
      return;
    }

    try {
      const searchTerm = req.query.search as string;
      let result: { success: boolean; data?: Member[]; error?: string };
      
      if (searchTerm?.trim()) {
        result = await this.memberService.searchMembers(searchTerm);
      } else {
        result = await this.memberService.getAllMembers();
      }

      if (result.success && result.data) {
        res.render('members', {
          title: searchTerm ? `Members - Search: "${searchTerm}"` : 'Members',
          members: result.data,
          searchTerm: searchTerm || '',
          resultCount: result.data.length,
          isSearchResult: !!searchTerm,
        });
      } else {
        res.status(500).render('error', {
          title: 'Error',
          error: 'Failed to load members',
          details: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Error in WebController.members:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load members page',
        details: 'Internal server error',
      });
    }
  };

  // GET /members/add - Add member form
  addMemberForm = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('member-form', {
        title: 'Add New Member',
        isEdit: false,
      });
    } catch (error) {
      console.error('Error in WebController.addMemberForm:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load add member form',
        details: 'Internal server error',
      });
    }
  };

  // GET /members/:id - Member details page
  memberDetails = async (req: Request, res: Response): Promise<void> => {
    if (!this.memberService) {
      res.status(500).render('error', {
        title: 'Error',
        error: 'Member service not available',
        details: 'Member functionality is not configured',
      });
      return;
    }

    try {
      const { id } = req.params;
      const result = await this.memberService.getMemberById(id);

      if (result.success && result.data) {
        res.render('member-details', {
          title: `Member - ${result.data.memberName}`,
          member: result.data,
        });
      } else {
        res.status(404).render('error', {
          title: 'Member Not Found',
          error: 'Member not found',
          details: result.error || 'The requested member does not exist',
        });
      }
    } catch (error) {
      console.error('Error in WebController.memberDetails:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load member details',
        details: 'Internal server error',
      });
    }
  };

  // GET /members/:id/edit - Edit member form
  editMemberForm = async (req: Request, res: Response): Promise<void> => {
    if (!this.memberService) {
      res.status(500).render('error', {
        title: 'Error',
        error: 'Member service not available',
        details: 'Member functionality is not configured',
      });
      return;
    }

    try {
      const { id } = req.params;
      const result = await this.memberService.getMemberById(id);

      if (result.success && result.data) {
        res.render('member-form', {
          title: `Edit Member - ${result.data.memberName}`,
          member: result.data,
          isEdit: true,
        });
      } else {
        res.status(404).render('error', {
          title: 'Member Not Found',
          error: 'Member not found',
          details: result.error || 'The requested member does not exist',
        });
      }
    } catch (error) {
      console.error('Error in WebController.editMemberForm:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load member for editing',
        details: 'Internal server error',
      });
    }
  };
}
