import { v4 as uuidv4 } from 'uuid';
import type {
  Book,
  CreateBookRequest,
  UpdateBookRequest,
  BusinessResult,
} from '../shared/types.js';
import type { IBookRepository } from '../data/BookRepository.js';

export interface IBookService {
  getAllBooks(): Promise<BusinessResult<Book[]>>;
  getBookById(id: string): Promise<BusinessResult<Book>>;
  createBook(bookData: CreateBookRequest): Promise<BusinessResult<Book>>;
  updateBook(id: string, updates: UpdateBookRequest): Promise<BusinessResult<Book>>;
  deleteBook(id: string): Promise<BusinessResult<void>>;
}

export class BookService implements IBookService {
  constructor(private bookRepository: IBookRepository) {}

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
      // Validate input
      const validation = this.validateBookData(bookData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          statusCode: 400,
        };
      }

      // Create book with UUID
      const newBook: Book = {
        id: uuidv4(),
        author: bookData.author.trim(),
        title: bookData.title.trim(),
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
      if (updates.author !== undefined || updates.title !== undefined) {
        const validation = this.validateUpdateData(updates);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error,
            statusCode: 400,
          };
        }
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

  // Private validation methods
  private validateBookData(data: CreateBookRequest): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid request body' };
    }

    if (!data.author || typeof data.author !== 'string' || data.author.trim().length === 0) {
      return { isValid: false, error: 'Author is required and must be a non-empty string' };
    }

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      return { isValid: false, error: 'Title is required and must be a non-empty string' };
    }

    if (data.author.trim().length > 255) {
      return { isValid: false, error: 'Author must be 255 characters or less' };
    }

    if (data.title.trim().length > 255) {
      return { isValid: false, error: 'Title must be 255 characters or less' };
    }

    return { isValid: true };
  }

  private validateUpdateData(data: UpdateBookRequest): { isValid: boolean; error?: string } {
    if (data.author !== undefined) {
      if (typeof data.author !== 'string' || data.author.trim().length === 0) {
        return { isValid: false, error: 'Author must be a non-empty string' };
      }
      if (data.author.trim().length > 255) {
        return { isValid: false, error: 'Author must be 255 characters or less' };
      }
    }

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        return { isValid: false, error: 'Title must be a non-empty string' };
      }
      if (data.title.trim().length > 255) {
        return { isValid: false, error: 'Title must be 255 characters or less' };
      }
    }

    return { isValid: true };
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
}
