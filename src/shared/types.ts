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
}

export interface BookCopy {
  id: string;
  book_id: string;
  copy_number: number;
  status: 'available' | 'borrowed' | 'maintenance';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  created_at: string;
  updated_at: string;
}

export interface CreateBookCopyRequest {
  book_id: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UpdateBookCopyRequest {
  status?: 'available' | 'borrowed' | 'maintenance';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BookWithCopies extends Book {
  copies: BookCopy[];
  total_copies: number;
  available_copies: number;
}

export interface BookAvailability {
  book_id: string;
  total_copies: number;
  available_copies: number;
  borrowed_copies: number;
  maintenance_copies: number;
}

export interface BookSearchFilters {
  title?: string;
  author?: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  available_only?: boolean;
  limit?: number;
  offset?: number;
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
}

export interface UpdateBookRequest {
  author?: string;
  title?: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
}

// Response types
export interface BooksResponse {
  Books: Book[];
}

export interface BookResponse {
  book: Book;
}

export interface BookWithCopiesResponse {
  book: BookWithCopies;
}

export interface BookCopyResponse {
  copy: BookCopy;
}

export interface BookCopiesResponse {
  copies: BookCopy[];
}

export interface BookSearchResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

export interface BookInventoryResponse {
  inventory: BookAvailability[];
  summary: {
    total_books: number;
    total_copies: number;
    available_copies: number;
    borrowed_copies: number;
    maintenance_copies: number;
  };
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
  username?: string;
  password_hash?: string; // Only used internally, never sent to client
}

export interface CreateMemberRequest {
  memberName: string;
  email: string;
  phone?: string;
  memAddress?: string;
  max_books?: number;
  username?: string;
  password?: string;
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

// Authentication interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  member?: Omit<Member, 'password_hash'>; // Never include password hash in responses
  token?: string; // For future JWT implementation
  message?: string;
}

export interface SetPasswordRequest {
  username: string;
  password: string;
}

export interface AuthSession {
  memberId: string;
  username: string;
  loginTime: string;
}

// Business layer result type
export interface BusinessResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
