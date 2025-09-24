import express from 'express';
import { BookRepository } from './data/BookRepository.js';
import { BookService } from './business/BookService.js';
import { BookController } from './presentation/BookController.js';
import { HealthController } from './presentation/HealthController.js';
import { createBookRoutes } from './presentation/routes.js';

const app = express();
const port: number = 3001;

// Middleware
app.use(express.json());

// Initialize layers (Dependency Injection)
const bookRepository = new BookRepository();
const bookService = new BookService(bookRepository);
const bookController = new BookController(bookService);
const healthController = new HealthController();

// Routes
app.use('/books', createBookRoutes(bookController));
app.get('/health', healthController.healthCheck);
app.get('/greet', healthController.greet);

// Legacy route for backward compatibility - redirects to /books
app.get('/', (_req, res) => {
  res.redirect('/books');
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: 'Something went wrong',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    details: 'The requested resource was not found',
  });
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
