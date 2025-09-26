import type { Request, Response } from 'express';
import type { IBookService } from '../business/BookService.js';

import type { IMemberService } from '../business/MemberService.js';
import type { Book, Member } from '../shared/types.js';

export class WebController {
  constructor(
    private bookService: IBookService,
    private memberService?: IMemberService,
  ) {}

  // Helper method to convert book data for template rendering
  private mapBookForTemplate(book: Book) {
    return {
      ...book,
      updatedAt: book.updated_at,
      publishedYear: book.publication_year,
      category: book.genre,
    };
  }

  // GET / - Home page
  home = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.bookService.getAllBooks();

      const stats = {
        totalBooks: 0,
        totalCopies: 0,
        availableCopies: 0,
        checkedOutCopies: 0,
        uniqueAuthors: 0,
        booksWithCopies: 0,
      };

      if (result.success && result.data) {
        const books = result.data;
        stats.totalBooks = books.length;
        stats.uniqueAuthors = new Set(books.map((book) => book.author)).size;

        // Get copy statistics for all books
        for (const book of books) {
          try {
            const copiesResult = await this.bookService.getBookCopies(book.id);
            if (copiesResult.success && copiesResult.data) {
              const copies = copiesResult.data;
              if (copies.length > 0) {
                stats.booksWithCopies++;
              }
              stats.totalCopies += copies.length;
              stats.availableCopies += copies.filter((copy) => copy.status === 'available').length;
              stats.checkedOutCopies += copies.filter((copy) => copy.status === 'borrowed').length;
            }
          } catch (error) {
            console.error(`Error getting copies for book ${book.id}:`, error);
          }
        }
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
        // Get copy information for each book
        const booksWithCopyInfo = await Promise.all(
          result.data.map(async (book) => {
            try {
              const copiesResult = await this.bookService.getAvailableCopies(book.id);
              const totalCopiesResult = await this.bookService.getBookCopies(book.id);

              const availableCopies =
                copiesResult.success && copiesResult.data ? copiesResult.data.length : 0;
              const totalCopies =
                totalCopiesResult.success && totalCopiesResult.data
                  ? totalCopiesResult.data.length
                  : 0;

              return {
                ...this.mapBookForTemplate(book),
                available: availableCopies > 0,
                availableCopies,
                totalCopies,
                checkedOutCopies: totalCopies - availableCopies,
              };
            } catch (error) {
              console.error(`Error getting copy info for book ${book.id}:`, error);
              return {
                ...this.mapBookForTemplate(book),
                available: false,
                availableCopies: 0,
                totalCopies: 0,
                checkedOutCopies: 0,
              };
            }
          }),
        );

        // Get unique categories from books
        const categories = [
          ...new Set(result.data.map((book) => book.genre).filter(Boolean)),
        ].sort();

        res.render('books', {
          title: 'Books',
          books: booksWithCopyInfo,
          categories: categories,
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
        const book = result.data;

        // Get copy information for this book
        try {
          const copiesResult = await this.bookService.getBookCopiesWithBorrowers(book.id);
          const availableCopiesResult = await this.bookService.getAvailableCopies(book.id);

          const totalCopies =
            copiesResult.success && copiesResult.data ? copiesResult.data.length : 0;
          const availableCopies =
            availableCopiesResult.success && availableCopiesResult.data
              ? availableCopiesResult.data.length
              : 0;
          const maintenanceCopies =
            copiesResult.success && copiesResult.data
              ? copiesResult.data.filter((copy) => copy.status === 'maintenance').length
              : 0;
          const checkedOutCopies =
            copiesResult.success && copiesResult.data
              ? copiesResult.data.filter((copy) => copy.status === 'borrowed').length
              : 0;

          const bookWithCopyInfo = {
            ...this.mapBookForTemplate(book),
            available: availableCopies > 0,
            totalCopies,
            availableCopies,
            checkedOutCopies,
            maintenanceCopies,
            copies: copiesResult.success && copiesResult.data ? copiesResult.data : [],
          };

          res.render('book-details', {
            title: book.title,
            book: bookWithCopyInfo,
          });
        } catch (copyError) {
          console.error(`Error getting copy info for book ${book.id}:`, copyError);
          // Fallback to book without copy info
          const bookWithCopyInfo = {
            ...this.mapBookForTemplate(book),
            available: false,
            totalCopies: 0,
            availableCopies: 0,
            checkedOutCopies: 0,
            maintenanceCopies: 0,
            copies: [],
          };

          res.render('book-details', {
            title: book.title,
            book: bookWithCopyInfo,
          });
        }
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

  // GET /books/:id/checkout - Member selection page for checkout
  memberSelectionForCheckout = async (req: Request, res: Response): Promise<void> => {
    if (!this.memberService) {
      res.status(500).render('error', {
        title: 'Error',
        error: 'Member service not available',
        details: 'Member functionality is not configured',
      });
      return;
    }

    try {
      const { id: bookId } = req.params;
      const { search: searchTerm } = req.query;

      // Get book information first
      const bookResult = await this.bookService.getBookById(bookId);
      if (!bookResult.success || !bookResult.data) {
        res.status(404).render('error', {
          title: 'Book Not Found',
          error: 'Book not found',
          details: 'The requested book could not be found.',
        });
        return;
      }

      const book = bookResult.data;

      // Get copy information for this book
      const copiesResult = await this.bookService.getBookCopies(book.id);
      const availableCopiesResult = await this.bookService.getAvailableCopies(book.id);

      const totalCopies = copiesResult.success && copiesResult.data ? copiesResult.data.length : 0;
      const availableCopies =
        availableCopiesResult.success && availableCopiesResult.data
          ? availableCopiesResult.data.length
          : 0;

      // Check if book is available for checkout
      if (availableCopies === 0) {
        res.status(400).render('error', {
          title: 'Book Not Available',
          error: 'Book not available for checkout',
          details: 'All copies of this book are currently checked out or under maintenance.',
        });
        return;
      }

      const bookWithCopyInfo = {
        ...this.mapBookForTemplate(book),
        available: availableCopies > 0,
        totalCopies,
        availableCopies,
      };

      // Get members (active only for checkout)
      let memberResult: { success: boolean; data?: Member[]; error?: string };
      if (searchTerm && typeof searchTerm === 'string') {
        memberResult = await this.memberService.searchMembers(searchTerm);
      } else {
        memberResult = await this.memberService.getAllMembers();
      }

      if (memberResult.success && memberResult.data) {
        // Filter to show only active members for checkout
        const activeMembers = memberResult.data.filter((member) => member.status === 'active');

        // Add debugging info
        console.log(`Checkout page: Book ${book.id} has ${availableCopies} available copies`);
        console.log(
          `Found ${memberResult.data.length} total members, ${activeMembers.length} active members`,
        );

        res.render('member-selection', {
          title: `Checkout - ${book.title}`,
          book: bookWithCopyInfo,
          members: activeMembers,
          searchTerm: searchTerm || '',
          isSearchResult: !!searchTerm,
          resultCount: activeMembers.length,
        });
      } else {
        console.error('Failed to load members for checkout:', memberResult.error);
        res.status(500).render('error', {
          title: 'Error',
          error: 'Failed to load members',
          details: memberResult.error || 'Internal server error',
        });
      }
    } catch (error) {
      console.error('Error in WebController.memberSelectionForCheckout:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to load checkout page',
        details: 'Internal server error',
      });
    }
  };
}
