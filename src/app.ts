import express from 'express';
import { create } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import { BookService } from './business/BookService.js';
import { BookRepository } from './data/BookRepository.js';
import { BookController } from './presentation/BookController.js';
import { HealthController } from './presentation/HealthController.js';
import { WebController } from './presentation/WebController.js';
import { createBookRoutes } from './presentation/routes.js';

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
    eq: (a: any, b: any) => a === b,
    truncate: (str: string, length: number) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    },
    formatDate: (date: string) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    }
  }
});

// Set up view engine
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize layers (Dependency Injection)
const bookRepository = new BookRepository();
const bookService = new BookService(bookRepository);
const bookController = new BookController(bookService);
const webController = new WebController(bookService);
const healthController = new HealthController();

// API Routes (with /api prefix)
app.use('/api/books', createBookRoutes(bookController));
app.get('/api/health', healthController.healthCheck);
app.get('/api/greet', healthController.greet);

// Web Routes (HTML pages)
app.get('/', webController.home);
app.get('/books', webController.books);
app.get('/books/add', webController.addBookForm);
app.get('/books/:id', webController.bookDetails);
app.get('/books/:id/edit', webController.editBookForm);

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
      details: 'Something went wrong on our end.'
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
      details: 'The requested page could not be found.'
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  bookRepository.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  bookRepository.close();
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
