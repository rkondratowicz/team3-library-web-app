# Task 1.5: Update Book Controller

## Objective
Enhance the existing BookController to support all new functionality including new endpoints for copy management, search, and inventory tracking.

## Current State
- Basic BookController with: getAllBooks, getBookById, createBook, updateBook, deleteBook
- Only handles basic book operations
- No endpoints for copies, search, or inventory

## What You Will Create
- Enhanced existing endpoints to handle new book fields
- New endpoints for copy management
- Search and filtering endpoints
- Inventory and availability endpoints

## Step-by-Step Instructions

### Step 1: Add New Imports

1. **Open `src/presentation/BookController.ts`**

2. **Update the imports to include new types:**
   ```typescript
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
   ```

### Step 2: Add New Search Endpoint

1. **Add the searchBooks method after existing methods:**
   ```typescript
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
   ```

### Step 3: Add Book with Copies Endpoints

1. **Add the getBookWithCopies method:**
   ```typescript
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
   ```

### Step 4: Add Copy Management Endpoints

1. **Add copy management methods:**
   ```typescript
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

   // POST /books/:id/copies - Add a new copy for a book
   addBookCopy = async (
     req: Request<{ id: string }, BookCopyResponse | ErrorResponse, CreateBookCopyRequest>,
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
   ```

### Step 5: Add Copy Update and Delete Endpoints

1. **Add copy modification methods:**
   ```typescript
   // PUT /copies/:id/status - Update copy status
   updateBookCopyStatus = async (
     req: Request<{ id: string }, BookCopyResponse | ErrorResponse, { status: string }>,
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
         res.status(result.statusCode || 400).json({
           error: result.error || 'Failed to update copy status',
           details: 'Could not update the copy status',
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
     req: Request<{ id: string }, BookCopyResponse | ErrorResponse, { condition: string }>,
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
         res.status(result.statusCode || 400).json({
           error: result.error || 'Failed to update copy condition',
           details: 'Could not update the copy condition',
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

   // DELETE /copies/:id - Delete a book copy
   removeBookCopy = async (
     req: Request,
     res: Response<{} | ErrorResponse>
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
         res.status(result.statusCode || 204).json({});
       } else {
         res.status(result.statusCode || 400).json({
           error: result.error || 'Failed to delete copy',
           details: 'Could not delete the book copy',
         });
       }
     } catch (error) {
       console.error('Error in BookController.removeBookCopy:', error);
       res.status(500).json({
         error: 'Internal server error',
         details: 'An unexpected error occurred while deleting copy',
       });
     }
   };
   ```

### Step 6: Add Inventory and Availability Endpoints

1. **Add inventory tracking methods:**
   ```typescript
   // GET /books/inventory - Get inventory summary for all books
   getBookInventory = async (
     req: Request,
     res: Response<BookInventoryResponse | ErrorResponse>
   ): Promise<void> => {
     try {
       const result = await this.bookService.getBookInventory();

       if (result.success && result.data) {
         // Calculate summary statistics
         const summary = {
           total_books: result.data.length,
           total_copies: result.data.reduce((sum, book) => sum + book.total_copies, 0),
           available_copies: result.data.reduce((sum, book) => sum + book.available_copies, 0),
           borrowed_copies: result.data.reduce((sum, book) => sum + book.borrowed_copies, 0),
           maintenance_copies: result.data.reduce((sum, book) => sum + book.maintenance_copies, 0),
         };

         res.status(result.statusCode || 200).json({
           inventory: result.data,
           summary
         });
       } else {
         res.status(result.statusCode || 500).json({
           error: result.error || 'Failed to get inventory',
           details: 'Could not retrieve book inventory',
         });
       }
     } catch (error) {
       console.error('Error in BookController.getBookInventory:', error);
       res.status(500).json({
         error: 'Internal server error',
         details: 'An unexpected error occurred while fetching inventory',
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
         details: 'An unexpected error occurred while fetching availability',
       });
     }
   };

   // GET /books/isbn/:isbn - Get book by ISBN
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
           details: 'No book found with the provided ISBN',
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
   ```

### Step 7: Test the Controller

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Verify method signatures match the expected patterns**

## Expected Results
- ✅ All existing endpoints enhanced to handle new book fields
- ✅ New search endpoint with filtering capabilities
- ✅ Complete copy management endpoints
- ✅ Book with copies endpoints functional
- ✅ Inventory and availability endpoints working
- ✅ ISBN lookup endpoint implemented
- ✅ Proper error handling for all endpoints
- ✅ TypeScript compilation successful

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.ts
2. Verify method signatures and parameter types
3. Ensure response types match what's being returned

### If request/response types don't match:
1. Make sure Request and Response generic types are correct
2. Verify that body parsing middleware is configured
3. Check that query parameters are properly typed

## Next Steps
After completing this task, proceed to Task 1.6: Update Book Routes.

## Files Modified
- ✅ `src/presentation/BookController.ts` (extensively updated)