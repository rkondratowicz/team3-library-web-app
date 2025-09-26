import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port: number = 3001;

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize SQLite database
const db = new sqlite3.Database(join(__dirname, '..', 'library.db'), (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Import types from shared module instead of duplicating them
import type {
  Book,
  BookResponse,
  BooksResponse,
  CreateBookRequest,
  ErrorResponse,
  GreetingResponse,
} from './shared/types.js';

app.use(express.json());

// Validation helper functions
function isValidBookData(data: unknown): data is CreateBookRequest {
  return (
    data !== null &&
    typeof data === 'object' &&
    'author' in data &&
    'title' in data &&
    typeof data.author === 'string' &&
    typeof data.title === 'string' &&
    data.author.trim().length > 0 &&
    data.title.trim().length > 0 &&
    data.author.trim().length <= 255 &&
    data.title.trim().length <= 255
  );
}

app.get('/', (_req: Request, res: Response<BooksResponse | ErrorResponse>) => {
  db.all('SELECT * FROM books ORDER BY author, title', [], (err: Error | null, rows: Book[]) => {
    if (err) {
      console.error('Error fetching books:', err.message);
      res.status(500).json({
        error: 'Failed to fetch books',
        details: 'Internal server error',
      });
      return;
    }
    res.json({ Books: rows });
  });
});

app.post('/books', (req: Request, res: Response<BookResponse | ErrorResponse>) => {
  // Validate request body
  if (!isValidBookData(req.body)) {
    res.status(400).json({
      error: 'Invalid book data',
      details:
        'Author and title are required and must be non-empty strings (max 255 characters each)',
    });
    return;
  }

  const { author, title } = req.body;
  const bookId = uuidv4();

  // Trim whitespace from input
  const trimmedAuthor = author.trim();
  const trimmedTitle = title.trim();

  // Insert book into database
  const query = 'INSERT INTO books (id, author, title) VALUES (?, ?, ?)';

  db.run(query, [bookId, trimmedAuthor, trimmedTitle], (err: Error | null) => {
    if (err) {
      console.error('Error creating book:', err.message);
      res.status(500).json({
        error: 'Failed to create book',
        details: 'Internal server error',
      });
      return;
    }

    // Return the created book
    const currentTimestamp = new Date().toISOString();
    const newBook: Book = {
      id: bookId,
      author: trimmedAuthor,
      title: trimmedTitle,
      isbn: undefined,
      genre: undefined,
      publication_year: undefined,
      description: undefined,
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
    };

    res.status(201).json({ book: newBook });
  });
});

app.get('/greet', (req: Request, res: Response<GreetingResponse>) => {
  const personName: string = (req.query.q as string) || 'Guest';
  res.json({ message: `Hello, ${personName}!` });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
