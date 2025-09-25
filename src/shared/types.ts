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

// Database row types (raw data from SQLite)
export interface BookDbRow {
  id: string;
  author: string;
  title: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Aggregated fields from joins
  total_copies?: number;
  available_copies?: number;
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

// Member interfaces
export interface Member {
  id: string;
  memberName: string;
  email: string;
  phone?: string;
  memAddress?: string;
  status?: 'active' | 'suspended' | 'inactive';
  max_books?: number;
  member_since?: string;
  updated_at?: string;
}

export interface CreateMemberRequest {
  memberName: string;
  email: string;
  phone?: string;
  memAddress?: string;
  max_books?: number;
}

export interface UpdateMemberRequest {
  memberName?: string;
  email?: string;
  phone?: string;
  memAddress?: string;
  status?: 'active' | 'suspended' | 'inactive';
  max_books?: number;
}

// Member search functionality
export interface MemberSearchFilters {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'suspended' | 'inactive';
  memberSince?: string;
}

export interface MemberSearchRequest {
  query?: string; // General search term
  filters?: MemberSearchFilters;
  sortBy?: 'memberName' | 'email' | 'member_since' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MemberResponse {
  member: Member;
}

export interface MembersResponse {
  members: Member[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface MemberSearchResponse {
  members: Member[];
  total: number;
  query?: string;
  filters?: MemberSearchFilters;
  hasMore: boolean;
}

// Business layer result type
export interface BusinessResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
