import express, { Request, Response } from 'express';

const app = express();
const port: number = 3001;

// Interface for Book object
interface Book {
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
  res.json({
    "Books": [
      { "title": "Book 1" },
      { "title": "Book 2" },
    ]
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