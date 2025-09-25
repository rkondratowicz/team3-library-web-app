import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import { create } from 'express-handlebars';
import methodOverride from 'method-override';

import { BookService } from './business/BookService.js';
import { MemberService } from './business/MemberService.js';
import { BookRepository } from './data/BookRepository.js';
import { BookController } from './presentation/BookController.js';
import { HealthController } from './presentation/HealthController.js';

import { MemberController } from './presentation/MemberController.js';
import {
  createBookRoutes,
  createMemberFormRoutes,
  createMemberRoutes,
} from './presentation/routes.js';
import { WebController } from './presentation/WebController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port: number = 3001;

// Configure Handlebars
const hbs = create({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: (a: unknown, b: unknown) => a === b,
    gt: (a: unknown, b: unknown) => Number(a) > Number(b),
    truncate: (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return `${str.substring(0, length)}...`;
    },
    formatDate: (date: string) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },
    statusClass: (status: string) => {
      switch (status) {
        case 'available':
          return 'bg-success';
        case 'borrowed':
          return 'bg-warning';
        case 'maintenance':
          return 'bg-danger';
        default:
          return 'bg-secondary';
      }
    },
    statusIcon: (status: string) => {
      switch (status) {
        case 'available':
          return 'fas fa-check';
        case 'borrowed':
          return 'fas fa-user';
        case 'maintenance':
          return 'fas fa-wrench';
        default:
          return 'fas fa-question';
      }
    },
  },
});

// Set up view engine
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Method override middleware for handling HTML form _method parameter
app.use(
  methodOverride((req, _res) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // Extract method from form body and clean it up
      const method = req.body._method;
      delete req.body._method;
      return method;
    }
  }),
);
app.use(express.static(path.join(__dirname, 'public')));

// Initialize layers (Dependency Injection)
const bookRepository = new BookRepository();
const bookService = new BookService(bookRepository);
const bookController = new BookController(bookService);

const memberService = new MemberService();
const memberController = new MemberController(memberService);
const webController = new WebController(bookService, memberService);
const healthController = new HealthController();

// API Routes (with /api prefix)
app.use('/api/books', createBookRoutes(bookController));

app.use('/api/members', createMemberRoutes(memberController));

// Form handling routes (for web application forms with redirects)
app.use('/api/form/members', createMemberFormRoutes(memberController));

app.get('/api/health', healthController.healthCheck);
app.get('/api/greet', healthController.greet);

// Web Routes (HTML pages)
app.get('/', webController.home);
app.get('/books', webController.books);
app.get('/books/add', webController.addBookForm);
app.get('/books/:id', webController.bookDetails);
app.get('/books/:id/edit', webController.editBookForm);

// Member Web Routes
app.get('/members', webController.members);
app.get('/members/add', webController.addMemberForm);
app.get('/members/:id', webController.memberDetails);
app.get('/members/:id/edit', webController.editMemberForm);

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    res.status(500).json({
      error: 'Internal server error',
      details: 'Something went wrong',
    });
  } else {
    // Render error page for web requests
    res.status(500).render('error', {
      title: 'Server Error',
      error: 'Internal Server Error',
      details: 'Something went wrong on our end.',
    });
  }
});

// 404 handler
app.use((req, res) => {
  // Check if it's an API request
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      error: 'Not found',
      details: 'The requested API endpoint was not found',
    });
  } else {
    // Render 404 page for web requests
    res.status(404).render('error', {
      title: 'Page Not Found',
      error: 'Page Not Found',
      details: 'The requested page could not be found.',
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  bookRepository.close();
  memberService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  bookRepository.close();
  memberService.close();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Library API server listening on port ${port}`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /books      - Get all books`);
  console.log(`  POST   /books      - Create a new book`);
  console.log(`  GET    /books/:id  - Get book by ID`);
  console.log(`  PUT    /books/:id  - Update book`);
  console.log(`  DELETE /books/:id  - Delete book`);
  console.log(`  GET    /health     - Health check`);
  console.log(`  GET    /greet?q=name - Greeting`);
});

export default app;
