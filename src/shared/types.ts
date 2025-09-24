// Domain types and interfaces

export interface Book {
  id: string;
  author: string;
  title: string;
}

export interface CreateBookRequest {
  author: string;
  title: string;
}

export interface UpdateBookRequest {
  author?: string;
  title?: string;
}

// Response types
export interface BooksResponse {
  Books: Book[];
}

export interface BookResponse {
  book: Book;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface GreetingResponse {
  message: string;
}

// Business layer result type
export interface BusinessResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}