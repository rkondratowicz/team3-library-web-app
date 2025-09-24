# Task 1.4: Update Book Service

## Objective
Enhance the existing BookService to implement business logic for the new book functionality, including validation rules, copy management, and advanced operations.

## Current State
- Basic BookService with: getAllBooks, getBookById, createBook, updateBook, deleteBook
- No validation for ISBN or business rules
- No copy management logic

## What You Will Create
- Enhanced service methods with proper validation
- Business logic for copy management
- ISBN validation and uniqueness checking
- Book deletion validation (prevent deletion with active borrows)
- Search and filtering business logic

## Step-by-Step Instructions

### Step 1: Update the IBookService Interface

1. **Open `src/business/BookService.ts`**

2. **Replace the existing `IBookService` interface with this enhanced version:**
   ```typescript
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
   ```

### Step 2: Add Required Imports

1. **Update the imports at the top of the file:**
   ```typescript
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
   ```

### Step 3: Add Validation Methods

1. **Add ISBN validation method to the BookService class:**
   ```typescript
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
   ```

2. **Add book data validation method:**
   ```typescript
   validateBookData(bookData: CreateBookRequest | UpdateBookRequest): BusinessResult<void> {
     // Validate required fields for creation
     if ('author' in bookData && 'title' in bookData) {
       // This is a CreateBookRequest
       if (!bookData.author || bookData.author.trim().length === 0) {
         return {
           success: false,
           error: 'Author is required and cannot be empty',
           statusCode: 400
         };
       }
       
       if (!bookData.title || bookData.title.trim().length === 0) {
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
   ```

### Step 4: Update Existing Methods

1. **Replace the `createBook` method with enhanced validation:**
   ```typescript
   async createBook(bookData: CreateBookRequest): Promise<BusinessResult<Book>> {
     try {
       // Validate input data
       const validation = this.validateBookData(bookData);
       if (!validation.success) {
         return validation as BusinessResult<Book>;
       }
       
       // Check ISBN uniqueness if provided
       if (bookData.isbn) {
         const existingBook = await this.bookRepository.getBookByISBN(bookData.isbn);
         if (existingBook) {
           return {
             success: false,
             error: 'A book with this ISBN already exists',
             statusCode: 409
           };
         }
       }
       
       // Create the book
       const book: Book = {
         id: uuidv4(),
         author: bookData.author.trim(),
         title: bookData.title.trim(),
         isbn: bookData.isbn?.trim(),
         genre: bookData.genre?.trim(),
         publication_year: bookData.publication_year,
         description: bookData.description?.trim()
       };
       
       await this.bookRepository.createBook(book);
       
       return {
         success: true,
         data: book,
         statusCode: 201
       };
     } catch (error) {
       console.error('Error in BookService.createBook:', error);
       return {
         success: false,
         error: 'Failed to create book',
         statusCode: 500
       };
     }
   }
   ```

2. **Replace the `updateBook` method with enhanced validation:**
   ```typescript
   async updateBook(id: string, updates: UpdateBookRequest): Promise<BusinessResult<Book>> {
     try {
       // Check if book exists
       const existingBook = await this.bookRepository.getBookById(id);
       if (!existingBook) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       // Validate update data
       const validation = this.validateBookData(updates);
       if (!validation.success) {
         return validation as BusinessResult<Book>;
       }
       
       // Check ISBN uniqueness if being updated
       if (updates.isbn && updates.isbn !== existingBook.isbn) {
         const bookWithSameISBN = await this.bookRepository.getBookByISBN(updates.isbn);
         if (bookWithSameISBN && bookWithSameISBN.id !== id) {
           return {
             success: false,
             error: 'A book with this ISBN already exists',
             statusCode: 409
           };
         }
       }
       
       // Trim string fields
       const trimmedUpdates: UpdateBookRequest = {};
       if (updates.author !== undefined) trimmedUpdates.author = updates.author.trim();
       if (updates.title !== undefined) trimmedUpdates.title = updates.title.trim();
       if (updates.isbn !== undefined) trimmedUpdates.isbn = updates.isbn.trim();
       if (updates.genre !== undefined) trimmedUpdates.genre = updates.genre.trim();
       if (updates.description !== undefined) trimmedUpdates.description = updates.description.trim();
       if (updates.publication_year !== undefined) trimmedUpdates.publication_year = updates.publication_year;
       
       // Update the book
       const updateSuccess = await this.bookRepository.updateBook(id, trimmedUpdates);
       if (!updateSuccess) {
         return {
           success: false,
           error: 'Failed to update book',
           statusCode: 500
         };
       }
       
       // Return updated book
       const updatedBook = await this.bookRepository.getBookById(id);
       return {
         success: true,
         data: updatedBook!,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.updateBook:', error);
       return {
         success: false,
         error: 'Failed to update book',
         statusCode: 500
       };
     }
   }
   ```

3. **Replace the `deleteBook` method with borrowing validation:**
   ```typescript
   async deleteBook(id: string): Promise<BusinessResult<void>> {
     try {
       // Check if book exists
       const book = await this.bookRepository.getBookById(id);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       // Check if book has any borrowed copies
       // Note: This will be fully implemented after Person 3 creates the borrowing system
       const copies = await this.bookRepository.getBookCopies(id);
       const borrowedCopies = copies.filter(copy => copy.status === 'borrowed');
       
       if (borrowedCopies.length > 0) {
         return {
           success: false,
           error: `Cannot delete book. ${borrowedCopies.length} copy(ies) are currently borrowed`,
           statusCode: 409
         };
       }
       
       // Delete the book (this will cascade delete copies due to foreign key)
       const deleteSuccess = await this.bookRepository.deleteBook(id);
       if (!deleteSuccess) {
         return {
           success: false,
           error: 'Failed to delete book',
           statusCode: 500
         };
       }
       
       return {
         success: true,
         statusCode: 204
       };
     } catch (error) {
       console.error('Error in BookService.deleteBook:', error);
       return {
         success: false,
         error: 'Failed to delete book',
         statusCode: 500
       };
     }
   }
   ```

### Step 5: Add New Search Methods

1. **Add search and filter methods:**
   ```typescript
   async searchBooks(filters: BookSearchFilters): Promise<BusinessResult<Book[]>> {
     try {
       // Validate search parameters
       if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
         return {
           success: false,
           error: 'Limit must be between 1 and 100',
           statusCode: 400
         };
       }
       
       if (filters.offset && filters.offset < 0) {
         return {
           success: false,
           error: 'Offset cannot be negative',
           statusCode: 400
         };
       }
       
       const books = await this.bookRepository.searchBooks(filters);
       
       return {
         success: true,
         data: books,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.searchBooks:', error);
       return {
         success: false,
         error: 'Failed to search books',
         statusCode: 500
       };
     }
   }

   async getBookByISBN(isbn: string): Promise<BusinessResult<Book>> {
     try {
       if (!this.validateISBN(isbn)) {
         return {
           success: false,
           error: 'Invalid ISBN format',
           statusCode: 400
         };
       }
       
       const book = await this.bookRepository.getBookByISBN(isbn);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       return {
         success: true,
         data: book,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBookByISBN:', error);
       return {
         success: false,
         error: 'Failed to get book by ISBN',
         statusCode: 500
       };
     }
   }

   async getBooksByGenre(genre: string): Promise<BusinessResult<Book[]>> {
     try {
       if (!genre || genre.trim().length === 0) {
         return {
           success: false,
           error: 'Genre cannot be empty',
           statusCode: 400
         };
       }
       
       const books = await this.bookRepository.getBooksByGenre(genre.trim());
       
       return {
         success: true,
         data: books,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBooksByGenre:', error);
       return {
         success: false,
         error: 'Failed to get books by genre',
         statusCode: 500
       };
     }
   }

   async getBooksByAuthor(author: string): Promise<BusinessResult<Book[]>> {
     try {
       if (!author || author.trim().length === 0) {
         return {
           success: false,
           error: 'Author cannot be empty',
           statusCode: 400
         };
       }
       
       const books = await this.bookRepository.getBooksByAuthor(author.trim());
       
       return {
         success: true,
         data: books,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBooksByAuthor:', error);
       return {
         success: false,
         error: 'Failed to get books by author',
         statusCode: 500
       };
     }
   }
   ```

### Step 6: Add Book with Copies Methods

1. **Add composite book methods:**
   ```typescript
   async getBookWithCopies(id: string): Promise<BusinessResult<BookWithCopies>> {
     try {
       const bookWithCopies = await this.bookRepository.getBookWithCopies(id);
       if (!bookWithCopies) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       return {
         success: true,
         data: bookWithCopies,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBookWithCopies:', error);
       return {
         success: false,
         error: 'Failed to get book with copies',
         statusCode: 500
       };
     }
   }

   async getAllBooksWithCopies(): Promise<BusinessResult<BookWithCopies[]>> {
     try {
       const booksWithCopies = await this.bookRepository.getAllBooksWithCopies();
       
       return {
         success: true,
         data: booksWithCopies,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getAllBooksWithCopies:', error);
       return {
         success: false,
         error: 'Failed to get books with copies',
         statusCode: 500
       };
     }
   }
   ```

### Step 7: Add Copy Management Methods

1. **Add copy management business logic:**
   ```typescript
   async addBookCopy(bookId: string, copyData: CreateBookCopyRequest): Promise<BusinessResult<BookCopy>> {
     try {
       // Check if book exists
       const book = await this.bookRepository.getBookById(bookId);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       // Validate copy data
       if (copyData.condition && !['excellent', 'good', 'fair', 'poor'].includes(copyData.condition)) {
         return {
           success: false,
           error: 'Invalid condition. Must be: excellent, good, fair, or poor',
           statusCode: 400
         };
       }
       
       const newCopy = await this.bookRepository.createBookCopy(bookId, copyData);
       
       return {
         success: true,
         data: newCopy,
         statusCode: 201
       };
     } catch (error) {
       console.error('Error in BookService.addBookCopy:', error);
       return {
         success: false,
         error: 'Failed to add book copy',
         statusCode: 500
       };
     }
   }

   async removeBookCopy(copyId: string): Promise<BusinessResult<void>> {
     try {
       // Check if copy exists
       const copy = await this.bookRepository.getBookCopyById(copyId);
       if (!copy) {
         return {
           success: false,
           error: 'Book copy not found',
           statusCode: 404
         };
       }
       
       // Check if copy is currently borrowed
       if (copy.status === 'borrowed') {
         return {
           success: false,
           error: 'Cannot delete a copy that is currently borrowed',
           statusCode: 409
         };
       }
       
       const deleteSuccess = await this.bookRepository.deleteBookCopy(copyId);
       if (!deleteSuccess) {
         return {
           success: false,
           error: 'Failed to delete book copy',
           statusCode: 500
         };
       }
       
       return {
         success: true,
         statusCode: 204
       };
     } catch (error) {
       console.error('Error in BookService.removeBookCopy:', error);
       return {
         success: false,
         error: 'Failed to remove book copy',
         statusCode: 500
       };
     }
   }

   async updateBookCopyStatus(copyId: string, status: string): Promise<BusinessResult<BookCopy>> {
     try {
       // Validate status
       if (!['available', 'borrowed', 'maintenance'].includes(status)) {
         return {
           success: false,
           error: 'Invalid status. Must be: available, borrowed, or maintenance',
           statusCode: 400
         };
       }
       
       // Check if copy exists
       const copy = await this.bookRepository.getBookCopyById(copyId);
       if (!copy) {
         return {
           success: false,
           error: 'Book copy not found',
           statusCode: 404
         };
       }
       
       const updateSuccess = await this.bookRepository.updateBookCopyStatus(copyId, status);
       if (!updateSuccess) {
         return {
           success: false,
           error: 'Failed to update copy status',
           statusCode: 500
         };
       }
       
       // Return updated copy
       const updatedCopy = await this.bookRepository.getBookCopyById(copyId);
       return {
         success: true,
         data: updatedCopy!,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.updateBookCopyStatus:', error);
       return {
         success: false,
         error: 'Failed to update copy status',
         statusCode: 500
       };
     }
   }

   async updateBookCopyCondition(copyId: string, condition: string): Promise<BusinessResult<BookCopy>> {
     try {
       // Validate condition
       if (!['excellent', 'good', 'fair', 'poor'].includes(condition)) {
         return {
           success: false,
           error: 'Invalid condition. Must be: excellent, good, fair, or poor',
           statusCode: 400
         };
       }
       
       // Check if copy exists
       const copy = await this.bookRepository.getBookCopyById(copyId);
       if (!copy) {
         return {
           success: false,
           error: 'Book copy not found',
           statusCode: 404
         };
       }
       
       const updateSuccess = await this.bookRepository.updateBookCopy(copyId, { condition: condition as any });
       if (!updateSuccess) {
         return {
           success: false,
           error: 'Failed to update copy condition',
           statusCode: 500
         };
       }
       
       // Return updated copy
       const updatedCopy = await this.bookRepository.getBookCopyById(copyId);
       return {
         success: true,
         data: updatedCopy!,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.updateBookCopyCondition:', error);
       return {
         success: false,
         error: 'Failed to update copy condition',
         statusCode: 500
       };
     }
   }

   async getBookCopies(bookId: string): Promise<BusinessResult<BookCopy[]>> {
     try {
       // Check if book exists
       const book = await this.bookRepository.getBookById(bookId);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       const copies = await this.bookRepository.getBookCopies(bookId);
       
       return {
         success: true,
         data: copies,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBookCopies:', error);
       return {
         success: false,
         error: 'Failed to get book copies',
         statusCode: 500
       };
     }
   }

   async getAvailableCopies(bookId: string): Promise<BusinessResult<BookCopy[]>> {
     try {
       // Check if book exists
       const book = await this.bookRepository.getBookById(bookId);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       const availableCopies = await this.bookRepository.getAvailableCopies(bookId);
       
       return {
         success: true,
         data: availableCopies,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getAvailableCopies:', error);
       return {
         success: false,
         error: 'Failed to get available copies',
         statusCode: 500
       };
     }
   }
   ```

### Step 8: Add Inventory Methods

1. **Add inventory and availability methods:**
   ```typescript
   async getBookInventory(): Promise<BusinessResult<BookAvailability[]>> {
     try {
       const inventory = await this.bookRepository.getAllBookAvailabilities();
       
       return {
         success: true,
         data: inventory,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBookInventory:', error);
       return {
         success: false,
         error: 'Failed to get book inventory',
         statusCode: 500
       };
     }
   }

   async getBookAvailability(bookId: string): Promise<BusinessResult<BookAvailability>> {
     try {
       // Check if book exists
       const book = await this.bookRepository.getBookById(bookId);
       if (!book) {
         return {
           success: false,
           error: 'Book not found',
           statusCode: 404
         };
       }
       
       const availability = await this.bookRepository.getBookAvailability(bookId);
       
       return {
         success: true,
         data: availability,
         statusCode: 200
       };
     } catch (error) {
       console.error('Error in BookService.getBookAvailability:', error);
       return {
         success: false,
         error: 'Failed to get book availability',
         statusCode: 500
       };
     }
   }
   ```

### Step 9: Test the Service

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

## Expected Results
- ✅ IBookService interface updated with all new methods
- ✅ All existing methods enhanced with proper validation
- ✅ ISBN validation implemented and working
- ✅ Book data validation comprehensive
- ✅ Copy management business logic implemented
- ✅ Search and filtering methods functional
- ✅ Inventory tracking methods working
- ✅ Business rules enforced (no deletion with borrowed copies)
- ✅ TypeScript compilation successful

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.ts
2. Verify method signatures match interface exactly
3. Ensure all BusinessResult return types are correct

### If validation logic fails:
1. Test ISBN validation with known valid/invalid ISBNs
2. Verify publication year validation logic
3. Check string trimming and length validations

## Next Steps
After completing this task, proceed to Task 1.5: Update Book Controller.

## Files Modified
- ✅ `src/business/BookService.ts` (extensively updated)