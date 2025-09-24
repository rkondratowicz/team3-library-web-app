// Domain types and interfaces

export interface Book {
  id: string;
  author: string;
  title: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Computed properties
  available?: boolean;
  totalCopies?: number;
  availableCopies?: number;
  category?: string; // Alias for genre for UI consistency
  publishedYear?: number; // Alias for publication_year for UI consistency
}

export interface BookCopy {
  id: string;
  book_id: string;
  copy_number: number;
  status: 'available' | 'borrowed' | 'maintenance';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  created_at?: string;
  updated_at?: string;
}

export interface CreateBookRequest {
  author: string;
  title: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
  category?: string; // Will be mapped to genre
  publishedYear?: number; // Will be mapped to publication_year
  totalCopies?: number;
}

export interface UpdateBookRequest {
  author?: string;
  title?: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
  category?: string; // Will be mapped to genre
  publishedYear?: number; // Will be mapped to publication_year
  totalCopies?: number;
  available?: boolean;
  availableCopies?: number;
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
