import express from 'express';
import type { BookController } from './BookController.js';
import type { MemberController } from './MemberController.js';

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

  // Checkout route
  router.post('/:id/checkout', bookController.checkoutBook);

  return router;
}

export function createMemberRoutes(memberController: MemberController): express.Router {
  const router = express.Router();

  // JSON API Routes
  // GET /members - Get all members
  router.get('/', memberController.getAllMembers);

  // GET /members/search - Search members
  router.get('/search', memberController.searchMembers);

  // GET /members/:id - Get member by ID
  router.get('/:id', memberController.getMemberById);

  // POST /members - Create new member (JSON API)
  router.post('/', memberController.createMember);

  // PUT /members/:id - Update member (JSON API)
  router.put('/:id', memberController.updateMember);

  // DELETE /members/:id - Delete member (JSON API)
  router.delete('/:id', memberController.deleteMember);

  return router;
}

export function createMemberFormRoutes(memberController: MemberController): express.Router {
  const router = express.Router();

  // Form handling routes (for web application forms)
  // POST /form/members - Create new member from form
  router.post('/', memberController.createMemberFromForm);

  // PUT /form/members/:id - Update member from form
  router.put('/:id', memberController.updateMemberFromForm);

  // DELETE /form/members/:id - Delete member from form
  router.delete('/:id', memberController.deleteMemberFromForm);

  return router;
}
