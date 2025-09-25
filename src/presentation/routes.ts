import express from 'express';
import type { BookController } from './BookController.js';
import type { MemberController } from './MemberController.js';

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
