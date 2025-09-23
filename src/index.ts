import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Interface for Book object
interface Book {
  id: string;
  author: string;
  title: string;
}

// Interface for the books response
interface BooksResponse {
  Books: Book[];
}

// Interface for greeting response
interface GreetingResponse {
  message: string;
}

app.use(express.json());

app.get('/', (req: Request, res: Response<BooksResponse>) => {
  db.all('SELECT * FROM books', [], (err: Error | null, rows: Book[]) => {
    if (err) {
      console.error('Error fetching books:', err.message);
      res.status(500).json({ Books: [] });
      return;
    }
    res.json({ Books: rows });
  });
});

app.post('/books', (req: Request, res: Response) => {
  const body = req.body;
  res.send("Book created, youve sent: " + JSON.stringify(body));
});

app.get('/greet', (req: Request, res: Response<GreetingResponse>) => {
  const personName: string = (req.query.q as string) || 'Guest';
  res.json({ "message": `Hello, ${personName}!` });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});