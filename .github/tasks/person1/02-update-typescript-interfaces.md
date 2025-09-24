# Task 1.2: Update TypeScript Interfaces

## Objective
Update all TypeScript interfaces and types to match the enhanced database schema and support the new book copy functionality.

## Current State
- Basic `Book` interface with: `id`, `author`, `title`
- Basic request/response types for books
- No copy-related types

## What You Will Create
- Enhanced `Book` interface with new fields
- New `BookCopy` interface and related types
- Updated request/response interfaces
- Search and filtering interfaces

## Step-by-Step Instructions

### Step 1: Update the Existing Book Interface

1. **Open `src/shared/types.ts`**

2. **Replace the existing `Book` interface with:**
   ```typescript
   export interface Book {
     id: string;
     author: string;
     title: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }
   ```

### Step 2: Add New Book Copy Interface

1. **Add the `BookCopy` interface after the `Book` interface:**
   ```typescript
   export interface BookCopy {
     id: string;
     book_id: string;
     copy_number: number;
     status: 'available' | 'borrowed' | 'maintenance';
     condition: 'excellent' | 'good' | 'fair' | 'poor';
     created_at: string;
     updated_at: string;
   }
   ```

### Step 3: Add Book Copy Request Interfaces

1. **Add the following interfaces after `BookCopy`:**
   ```typescript
   export interface CreateBookCopyRequest {
     book_id: string;
     condition?: 'excellent' | 'good' | 'fair' | 'poor';
   }

   export interface UpdateBookCopyRequest {
     status?: 'available' | 'borrowed' | 'maintenance';
     condition?: 'excellent' | 'good' | 'fair' | 'poor';
   }
   ```

### Step 4: Add Enhanced Book Interfaces

1. **Add the following composite interfaces:**
   ```typescript
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
   ```

### Step 5: Add Search and Filter Interfaces

1. **Add the search filter interface:**
   ```typescript
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
   ```

### Step 6: Update Existing Request Interfaces

1. **Replace the existing `CreateBookRequest` interface:**
   ```typescript
   export interface CreateBookRequest {
     author: string;
     title: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }
   ```

2. **Replace the existing `UpdateBookRequest` interface:**
   ```typescript
   export interface UpdateBookRequest {
     author?: string;
     title?: string;
     isbn?: string;
     genre?: string;
     publication_year?: number;
     description?: string;
   }
   ```

### Step 7: Add New Response Types

1. **Add the following response interfaces after existing response types:**
   ```typescript
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
   ```

### Step 8: Validate TypeScript Compilation

1. **Run TypeScript compiler to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Verify no TypeScript errors exist:**
   ```bash
   npx tsc --noEmit
   ```

### Step 9: Test Import Statements

1. **Check that existing files can still import from types.ts:**
   ```bash
   # This should not show any import errors
   grep -r "from.*types" src/
   ```

## Complete Updated types.ts Structure

After all changes, your `src/shared/types.ts` should include:

```typescript
// Domain types and interfaces

// Enhanced Book interface
export interface Book {
  id: string;
  author: string;
  title: string;
  isbn?: string;
  genre?: string;
  publication_year?: number;
  description?: string;
}

// Book Copy interface
export interface BookCopy {
  id: string;
  book_id: string;
  copy_number: number;
  status: 'available' | 'borrowed' | 'maintenance';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  created_at: string;
  updated_at: string;
}

// Request interfaces
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

export interface CreateBookCopyRequest {
  book_id: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface UpdateBookCopyRequest {
  status?: 'available' | 'borrowed' | 'maintenance';
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
}

// Composite interfaces
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

// Search and filter interfaces
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

// Response types (keep existing ones and add new ones)
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

// Business layer result type
export interface BusinessResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}
```

## Expected Results
- ✅ All TypeScript interfaces updated to match database schema
- ✅ New copy-related interfaces defined
- ✅ Search and filtering types added
- ✅ All response types comprehensive
- ✅ TypeScript compilation successful
- ✅ No import errors in existing files

## Troubleshooting

### If TypeScript compilation fails:
1. Check for typos in interface names
2. Ensure all optional properties use `?` correctly
3. Verify union types are properly formatted (e.g., `'available' | 'borrowed'`)

### If import errors occur:
1. Make sure you didn't accidentally remove existing interfaces
2. Check that interface names match what's being imported in other files

## Next Steps
After completing this task, proceed to Task 1.3: Update Book Repository.

## Files Modified
- ✅ `src/shared/types.ts` (significantly updated)