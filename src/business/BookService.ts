import { v4 as uuidv4 } from 'uuid';
import type { IBookRepository } from '../data/BookRepository.js';
import type {
  Book,
  BookCopy,
  BookWithCopies,
  BookAvailability,
  BookSearchFilters,
  CreateBookRequest,
  UpdateBookRequest,
  CreateBookCopyRequest,
  BusinessResult,
} from '../shared/types.js';

export interface IBookService {
  // Enhanced existing methods
  getAllBooks(): Promise<BusinessResult<Book[]>>;
  getBookById(id: string): Promise<BusinessResult<Book>>;
  createBook(bookData: CreateBookRequest): Promise<BusinessResult<Book>>;
  updateBook(id: string, updates: UpdateBookRequest): Promise<BusinessResult<Book>>;
  deleteBook(id: string): Promise<BusinessResult<void>>;

  // New search and filter methods
  searchBooks(filters: BookSearchFilters): Promise<BusinessResult<Book[]>>;
  getBookByISBN(isbn: string): Promise<BusinessResult<Book>>;
  getBooksByGenre(genre: string): Promise<BusinessResult<Book[]>>;
  getBooksByAuthor(author: string): Promise<BusinessResult<Book[]>>;

  // Book with copies methods
  getBookWithCopies(id: string): Promise<BusinessResult<BookWithCopies>>;
  getAllBooksWithCopies(): Promise<BusinessResult<BookWithCopies[]>>;

  // Copy management methods
  addBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BusinessResult<BookCopy>>;
  removeBookCopy(copyId: string): Promise<BusinessResult<void>>;
  updateBookCopyStatus(copyId: string, status: string): Promise<BusinessResult<BookCopy>>;
  updateBookCopyCondition(copyId: string, condition: string): Promise<BusinessResult<BookCopy>>;
  getBookCopies(bookId: string): Promise<BusinessResult<BookCopy[]>>;
  getAvailableCopies(bookId: string): Promise<BusinessResult<BookCopy[]>>;

  // Inventory and availability methods
  getBookInventory(): Promise<BusinessResult<BookAvailability[]>>;
  getBookAvailability(bookId: string): Promise<BusinessResult<BookAvailability>>;

  // Validation methods
  validateISBN(isbn: string): boolean;
  validateBookData(bookData: CreateBookRequest | UpdateBookRequest): BusinessResult<void>;
}

export class BookService implements IBookService {
  constructor(private bookRepository: IBookRepository) { }

  async getAllBooks(): Promise<BusinessResult<Book[]>> {
    try {
      const books = await this.bookRepository.getAllBooks();
      return {
        success: true,
        data: books,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getAllBooks:', error);
      return {
        success: false,
        error: 'Failed to fetch books',
        statusCode: 500,
      };
    }
  }

  async getBookById(id: string): Promise<BusinessResult<Book>> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      const book = await this.bookRepository.getBookById(id);

      if (!book) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: book,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getBookById:', error);
      return {
        success: false,
        error: 'Failed to fetch book',
        statusCode: 500,
      };
    }
  }

  async createBook(bookData: CreateBookRequest): Promise<BusinessResult<Book>> {
    try {
      // Validate input data
      const validation = this.validateBookData(bookData);
      if (!validation.success) {
        return validation as BusinessResult<Book>;
      }

      // Create book with UUID and all fields
      const newBook: Book = {
        id: uuidv4(),
        author: bookData.author.trim(),
        title: bookData.title.trim(),
        isbn: bookData.isbn,
        genre: bookData.genre,
        publication_year: bookData.publication_year,
        description: bookData.description,
      };

      await this.bookRepository.createBook(newBook);

      return {
        success: true,
        data: newBook,
        statusCode: 201,
      };
    } catch (error) {
      console.error('Error in BookService.createBook:', error);
      return {
        success: false,
        error: 'Failed to create book',
        statusCode: 500,
      };
    }
  }

  async updateBook(id: string, updates: UpdateBookRequest): Promise<BusinessResult<Book>> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // Validate update data
      const validation = this.validateBookData(updates);
      if (!validation.success) {
        return validation as BusinessResult<Book>;
      }

      // Check if book exists
      const bookExists = await this.bookRepository.bookExists(id);
      if (!bookExists) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      // Prepare updates with trimmed values
      const trimmedUpdates: Partial<Book> = {};
      if (updates.author !== undefined) {
        trimmedUpdates.author = updates.author.trim();
      }
      if (updates.title !== undefined) {
        trimmedUpdates.title = updates.title.trim();
      }

      // Update book
      const updated = await this.bookRepository.updateBook(id, trimmedUpdates);

      if (!updated) {
        return {
          success: false,
          error: 'No changes were made',
          statusCode: 400,
        };
      }

      // Fetch and return updated book
      const updatedBook = await this.bookRepository.getBookById(id);

      return {
        success: true,
        data: updatedBook!,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.updateBook:', error);
      return {
        success: false,
        error: 'Failed to update book',
        statusCode: 500,
      };
    }
  }

  async deleteBook(id: string): Promise<BusinessResult<void>> {
    try {
      // Validate UUID format
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      const deleted = await this.bookRepository.deleteBook(id);

      if (!deleted) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        statusCode: 204,
      };
    } catch (error) {
      console.error('Error in BookService.deleteBook:', error);
      return {
        success: false,
        error: 'Failed to delete book',
        statusCode: 500,
      };
    }
  }

  // New search and filter methods
  async searchBooks(filters: BookSearchFilters): Promise<BusinessResult<Book[]>> {
    try {
      // TODO: Implement when repository method is available
      const books = await this.bookRepository.getAllBooks();
      return {
        success: true,
        data: books,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.searchBooks:', error);
      return {
        success: false,
        error: 'Failed to search books',
        statusCode: 500,
      };
    }
  }

  async getBookByISBN(isbn: string): Promise<BusinessResult<Book>> {
    try {
      if (!this.validateISBN(isbn)) {
        return {
          success: false,
          error: 'Invalid ISBN format',
          statusCode: 400,
        };
      }

      // TODO: Implement when repository method is available
      const books = await this.bookRepository.getAllBooks();
      const book = books.find(b => b.isbn === isbn);

      if (!book) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      return {
        success: true,
        data: book,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getBookByISBN:', error);
      return {
        success: false,
        error: 'Failed to fetch book by ISBN',
        statusCode: 500,
      };
    }
  }

  async getBooksByGenre(genre: string): Promise<BusinessResult<Book[]>> {
    try {
      // TODO: Implement when repository method is available
      const books = await this.bookRepository.getAllBooks();
      const filteredBooks = books.filter(book => book.genre === genre);

      return {
        success: true,
        data: filteredBooks,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getBooksByGenre:', error);
      return {
        success: false,
        error: 'Failed to fetch books by genre',
        statusCode: 500,
      };
    }
  }

  async getBooksByAuthor(author: string): Promise<BusinessResult<Book[]>> {
    try {
      // TODO: Implement when repository method is available
      const books = await this.bookRepository.getAllBooks();
      const filteredBooks = books.filter(book =>
        book.author.toLowerCase().includes(author.toLowerCase())
      );

      return {
        success: true,
        data: filteredBooks,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getBooksByAuthor:', error);
      return {
        success: false,
        error: 'Failed to fetch books by author',
        statusCode: 500,
      };
    }
  }

  // Book with copies methods
  async getBookWithCopies(id: string): Promise<BusinessResult<BookWithCopies>> {
    try {
      if (!this.isValidUUID(id)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // TODO: Implement when repository method is available
      return {
        success: false,
        error: 'Method not implemented yet',
        statusCode: 501,
      };
    } catch (error) {
      console.error('Error in BookService.getBookWithCopies:', error);
      return {
        success: false,
        error: 'Failed to fetch book with copies',
        statusCode: 500,
      };
    }
  }

  async getAllBooksWithCopies(): Promise<BusinessResult<BookWithCopies[]>> {
    try {
      // TODO: Implement when repository method is available
      return {
        success: false,
        error: 'Method not implemented yet',
        statusCode: 501,
      };
    } catch (error) {
      console.error('Error in BookService.getAllBooksWithCopies:', error);
      return {
        success: false,
        error: 'Failed to fetch books with copies',
        statusCode: 500,
      };
    }
  }

  // Copy management methods
  async addBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BusinessResult<BookCopy>> {
    try {
      if (!this.isValidUUID(bookId)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // Check if book exists first
      const bookExists = await this.bookRepository.bookExists(bookId);
      if (!bookExists) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      // Get next copy number
      const copyNumber = await this.bookRepository.getNextCopyNumber(bookId);

      // Create new book copy
      const newBookCopy: BookCopy = {
        id: uuidv4(),
        book_id: bookId,
        copy_number: copyNumber,
        status: 'available',
        condition: copyData.condition || 'good',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.bookRepository.createBookCopy(newBookCopy);

      return {
        success: true,
        data: newBookCopy,
        statusCode: 201,
      };
    } catch (error) {
      console.error('Error in BookService.addBookCopy:', error);
      return {
        success: false,
        error: 'Failed to add book copy',
        statusCode: 500,
      };
    }
  }

  async removeBookCopy(copyId: string): Promise<BusinessResult<void>> {
    try {
      if (!this.isValidUUID(copyId)) {
        return {
          success: false,
          error: 'Invalid copy ID format',
          statusCode: 400,
        };
      }

      // Check if copy exists first
      const copy = await this.bookRepository.getBookCopyById(copyId);
      if (!copy) {
        return {
          success: false,
          error: 'Book copy not found',
          statusCode: 404,
        };
      }

      // Check if copy can be removed (not borrowed)
      if (copy.status === 'borrowed') {
        return {
          success: false,
          error: 'Cannot remove borrowed book copy',
          statusCode: 400,
        };
      }

      const deleted = await this.bookRepository.deleteBookCopy(copyId);
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to remove book copy',
          statusCode: 500,
        };
      }

      return {
        success: true,
        statusCode: 204,
      };
    } catch (error) {
      console.error('Error in BookService.removeBookCopy:', error);
      return {
        success: false,
        error: 'Failed to remove book copy',
        statusCode: 500,
      };
    }
  }

  async updateBookCopyStatus(copyId: string, status: string): Promise<BusinessResult<BookCopy>> {
    try {
      if (!this.isValidUUID(copyId)) {
        return {
          success: false,
          error: 'Invalid copy ID format',
          statusCode: 400,
        };
      }

      // Validate status
      const validStatuses = ['available', 'borrowed', 'maintenance'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: 'Invalid status. Must be one of: available, borrowed, maintenance',
          statusCode: 400,
        };
      }

      // Check if copy exists
      const copy = await this.bookRepository.getBookCopyById(copyId);
      if (!copy) {
        return {
          success: false,
          error: 'Book copy not found',
          statusCode: 404,
        };
      }

      // Update the copy status
      const updated = await this.bookRepository.updateBookCopy(copyId, { status: status as 'available' | 'borrowed' | 'maintenance' });
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update book copy status',
          statusCode: 500,
        };
      }

      // Get updated copy
      const updatedCopy = await this.bookRepository.getBookCopyById(copyId);
      return {
        success: true,
        data: updatedCopy!,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.updateBookCopyStatus:', error);
      return {
        success: false,
        error: 'Failed to update book copy status',
        statusCode: 500,
      };
    }
  }

  async updateBookCopyCondition(copyId: string, condition: string): Promise<BusinessResult<BookCopy>> {
    try {
      if (!this.isValidUUID(copyId)) {
        return {
          success: false,
          error: 'Invalid copy ID format',
          statusCode: 400,
        };
      }

      // Validate condition
      const validConditions = ['excellent', 'good', 'fair', 'poor'];
      if (!validConditions.includes(condition)) {
        return {
          success: false,
          error: 'Invalid condition. Must be one of: excellent, good, fair, poor',
          statusCode: 400,
        };
      }

      // Check if copy exists
      const copy = await this.bookRepository.getBookCopyById(copyId);
      if (!copy) {
        return {
          success: false,
          error: 'Book copy not found',
          statusCode: 404,
        };
      }

      // Update the copy condition
      const updated = await this.bookRepository.updateBookCopy(copyId, { condition: condition as 'excellent' | 'good' | 'fair' | 'poor' });
      if (!updated) {
        return {
          success: false,
          error: 'Failed to update book copy condition',
          statusCode: 500,
        };
      }

      // Get updated copy
      const updatedCopy = await this.bookRepository.getBookCopyById(copyId);
      return {
        success: true,
        data: updatedCopy!,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.updateBookCopyCondition:', error);
      return {
        success: false,
        error: 'Failed to update book copy condition',
        statusCode: 500,
      };
    }
  }

  async getBookCopies(bookId: string): Promise<BusinessResult<BookCopy[]>> {
    try {
      if (!this.isValidUUID(bookId)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // Check if book exists first
      const bookExists = await this.bookRepository.bookExists(bookId);
      if (!bookExists) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      const copies = await this.bookRepository.getBookCopies(bookId);
      return {
        success: true,
        data: copies,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getBookCopies:', error);
      return {
        success: false,
        error: 'Failed to fetch book copies',
        statusCode: 500,
      };
    }
  }

  async getAvailableCopies(bookId: string): Promise<BusinessResult<BookCopy[]>> {
    try {
      if (!this.isValidUUID(bookId)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // Check if book exists first
      const bookExists = await this.bookRepository.bookExists(bookId);
      if (!bookExists) {
        return {
          success: false,
          error: 'Book not found',
          statusCode: 404,
        };
      }

      const availableCopies = await this.bookRepository.getAvailableBookCopies(bookId);
      return {
        success: true,
        data: availableCopies,
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error in BookService.getAvailableCopies:', error);
      return {
        success: false,
        error: 'Failed to fetch available copies',
        statusCode: 500,
      };
    }
  }

  // Inventory and availability methods
  async getBookInventory(): Promise<BusinessResult<BookAvailability[]>> {
    try {
      // TODO: Implement when repository method is available
      return {
        success: false,
        error: 'Method not implemented yet',
        statusCode: 501,
      };
    } catch (error) {
      console.error('Error in BookService.getBookInventory:', error);
      return {
        success: false,
        error: 'Failed to fetch book inventory',
        statusCode: 500,
      };
    }
  }

  async getBookAvailability(bookId: string): Promise<BusinessResult<BookAvailability>> {
    try {
      if (!this.isValidUUID(bookId)) {
        return {
          success: false,
          error: 'Invalid book ID format',
          statusCode: 400,
        };
      }

      // TODO: Implement when repository method is available
      return {
        success: false,
        error: 'Method not implemented yet',
        statusCode: 501,
      };
    } catch (error) {
      console.error('Error in BookService.getBookAvailability:', error);
      return {
        success: false,
        error: 'Failed to fetch book availability',
        statusCode: 500,
      };
    }
  }

  // Validation methods
  validateISBN(isbn: string): boolean {
    // Remove any hyphens or spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // Check if it's 10 or 13 digits
    if (!/^\d{10}$|^\d{13}$/.test(cleanISBN)) {
      return false;
    }

    if (cleanISBN.length === 10) {
      // ISBN-10 validation
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanISBN[i]) * (10 - i);
      }
      const checkDigit = (11 - (sum % 11)) % 11;
      const lastDigit = cleanISBN[9] === 'X' ? 10 : parseInt(cleanISBN[9]);
      return checkDigit === lastDigit;
    } else {
      // ISBN-13 validation
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanISBN[i]) * (i % 2 === 0 ? 1 : 3);
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(cleanISBN[12]);
    }
  }

  validateBookData(bookData: CreateBookRequest | UpdateBookRequest): BusinessResult<void> {
    // Validate required fields for creation
    if ('author' in bookData && 'title' in bookData) {
      // This is a CreateBookRequest
      const createData = bookData as CreateBookRequest;
      if (!createData.author || createData.author.trim().length === 0) {
        return {
          success: false,
          error: 'Author is required and cannot be empty',
          statusCode: 400
        };
      }

      if (!createData.title || createData.title.trim().length === 0) {
        return {
          success: false,
          error: 'Title is required and cannot be empty',
          statusCode: 400
        };
      }
    }

    // Validate ISBN if provided
    if (bookData.isbn) {
      if (!this.validateISBN(bookData.isbn)) {
        return {
          success: false,
          error: 'Invalid ISBN format. Must be a valid 10 or 13 digit ISBN',
          statusCode: 400
        };
      }
    }

    // Validate publication year if provided
    if (bookData.publication_year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (bookData.publication_year < 1000 || bookData.publication_year > currentYear + 1) {
        return {
          success: false,
          error: `Publication year must be between 1000 and ${currentYear + 1}`,
          statusCode: 400
        };
      }
    }

    // Validate genre length if provided
    if (bookData.genre && bookData.genre.length > 100) {
      return {
        success: false,
        error: 'Genre must be 100 characters or less',
        statusCode: 400
      };
    }

    // Validate description length if provided
    if (bookData.description && bookData.description.length > 2000) {
      return {
        success: false,
        error: 'Description must be 2000 characters or less',
        statusCode: 400
      };
    }

    return {
      success: true,
      statusCode: 200
    };
  }



  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
