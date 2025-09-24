import express from 'express';
import type { BookController } from './BookController.js';

export function createBookRoutes(bookController: BookController): express.Router {
  const router = express.Router();

  // Search and filter routes (must come before /:id routes)
  router.get('/search', bookController.searchBooks);
  router.get('/with-copies', bookController.getAllBooksWithCopies);
  router.get('/inventory', bookController.getBookInventory);
  router.get('/by-isbn/:isbn', bookController.getBookByISBN);
  router.get('/by-genre/:genre', bookController.getBooksByGenre);
  router.get('/by-author/:author', bookController.getBooksByAuthor);

  // Basic book routes
  router.get('/', bookController.getAllBooks);
  router.post('/', bookController.createBook);

  // Book with copies routes
  router.get('/:id/with-copies', bookController.getBookWithCopies);
  router.get('/:id/availability', bookController.getBookAvailability);

  // Copy management routes
  router.get('/:id/copies', bookController.getBookCopies);
  router.post('/:id/copies', bookController.addBookCopy);
  router.get('/:id/copies/available', bookController.getAvailableCopies);

  // Individual book routes
  router.get('/:id', bookController.getBookById);
  router.put('/:id', bookController.updateBook);
  router.delete('/:id', bookController.deleteBook);

  return router;
}

export function createCopyRoutes(bookController: BookController): express.Router {
  const router = express.Router();

  // Copy-specific routes
  router.put('/:id/status', bookController.updateBookCopyStatus);
  router.put('/:id/condition', bookController.updateBookCopyCondition);
  router.delete('/:id', bookController.removeBookCopy);

  return router;
}
