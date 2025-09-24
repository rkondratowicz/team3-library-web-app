import express from 'express';
import type { BookController } from './BookController.js';

export function createBookRoutes(bookController: BookController): express.Router {
  const router = express.Router();

  // GET /books - Get all books
  router.get('/', bookController.getAllBooks);

  // GET /books/:id - Get book by ID
  router.get('/:id', bookController.getBookById);

  // POST /books - Create new book
  router.post('/', bookController.createBook);

  // PUT /books/:id - Update book
  router.put('/:id', bookController.updateBook);

  // DELETE /books/:id - Delete book
  router.delete('/:id', bookController.deleteBook);

  return router;
}