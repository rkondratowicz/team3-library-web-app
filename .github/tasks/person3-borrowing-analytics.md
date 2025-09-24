# Person 3: Borrowing System & Analytics

## Overview
You are responsible for building the complete borrowing/return system and analytics dashboard. This is the core functionality that connects books and members, implementing all the business rules for library operations, and providing comprehensive reporting and statistics.

## Current State Analysis
**What's Already Implemented:**
- Nothing for borrowing system - you're building from scratch
- Books system (basic, being enhanced by Person 1)
- Members system (being built by Person 2)
- Existing project structure with TypeScript, Express, SQLite

**What You Need to Build:**
- Complete borrowing transaction system
- Check-out and check-in processes
- Borrowing business rules enforcement
- Statistics and analytics system
- Dashboard APIs for library insights

## Day 1 Tasks

### Task 3.1: Create Borrowing Database Schema
**Objective:** Design and implement borrowing transaction system

1. **Create borrowing transactions table**
   - Create file: `src/data/migrations/05-create-borrowing-transactions.sql`
   ```sql
   CREATE TABLE borrowing_transactions (
       id TEXT PRIMARY KEY,
       member_id TEXT NOT NULL,
       book_copy_id TEXT NOT NULL,
       borrowed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
       due_date DATETIME NOT NULL,
       returned_date DATETIME NULL,
       status VARCHAR(20) DEFAULT 'borrowed', -- 'borrowed', 'returned', 'overdue'
       notes TEXT,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (member_id) REFERENCES members(id),
       FOREIGN KEY (book_copy_id) REFERENCES book_copies(id)
   );

   CREATE INDEX idx_borrowing_member ON borrowing_transactions(member_id);
   CREATE INDEX idx_borrowing_copy ON borrowing_transactions(book_copy_id);
   CREATE INDEX idx_borrowing_status ON borrowing_transactions(status);
   CREATE INDEX idx_borrowing_due_date ON borrowing_transactions(due_date);
   ```

2. **Create analytics helper table (optional optimization)**
   - Create file: `src/data/migrations/06-create-analytics-views.sql`
   ```sql
   -- View for popular books statistics
   CREATE VIEW popular_books AS
   SELECT 
       b.id,
       b.title,
       b.author,
       b.genre,
       COUNT(bt.id) as borrow_count,
       COUNT(DISTINCT bt.member_id) as unique_borrowers
   FROM books b
   LEFT JOIN book_copies bc ON b.id = bc.book_id
   LEFT JOIN borrowing_transactions bt ON bc.id = bt.book_copy_id
   GROUP BY b.id, b.title, b.author, b.genre;

   -- View for member activity
   CREATE VIEW member_activity AS
   SELECT 
       m.id,
       m.name,
       m.email,
       COUNT(bt.id) as total_borrows,
       COUNT(CASE WHEN bt.status = 'borrowed' THEN 1 END) as current_borrows,
       COUNT(CASE WHEN bt.status = 'overdue' THEN 1 END) as overdue_count
   FROM members m
   LEFT JOIN borrowing_transactions bt ON m.id = bt.member_id
   GROUP BY m.id, m.name, m.email;
   ```

3. **Run migrations**
   ```bash
   sqlite3 library.db < src/data/migrations/05-create-borrowing-transactions.sql
   sqlite3 library.db < src/data/migrations/06-create-analytics-views.sql
   ```

### Task 3.2: Create Borrowing TypeScript Interfaces
**Objective:** Define all borrowing-related types and interfaces

1. **Add to `src/shared/types.ts`**
   ```typescript
   // Borrowing interfaces
   export interface BorrowingTransaction {
     id: string;
     member_id: string;
     book_copy_id: string;
     borrowed_date: string;
     due_date: string;
     returned_date?: string;
     status: 'borrowed' | 'returned' | 'overdue';
     notes?: string;
     created_at: string;
     updated_at: string;
   }

   export interface BorrowingTransactionDetails extends BorrowingTransaction {
     member_name: string;
     member_email: string;
     book_title: string;
     book_author: string;
     book_isbn?: string;
     copy_number: number;
   }

   export interface CheckoutRequest {
     member_id: string;
     book_copy_id: string;
     due_date?: string; // Optional, defaults to 14 days
     notes?: string;
   }

   export interface CheckinRequest {
     transaction_id: string;
     returned_date?: string; // Optional, defaults to current timestamp
     notes?: string;
   }

   export interface MemberBorrowingStatus {
     member_id: string;
     member_name: string;
     current_borrowed_count: number;
     max_books: number;
     overdue_count: number;
     can_borrow: boolean;
     active_transactions: BorrowingTransactionDetails[];
   }

   // Analytics interfaces
   export interface BookPopularityStats {
     book_id: string;
     title: string;
     author: string;
     genre?: string;
     borrow_count: number;
     unique_borrowers: number;
     last_borrowed?: string;
   }

   export interface LibraryStats {
     total_books: number;
     total_copies: number;
     total_members: number;
     active_borrows: number;
     overdue_items: number;
     popular_books: BookPopularityStats[];
     member_activity: any[];
   }

   export interface DashboardData {
     summary: {
       total_books: number;
       available_copies: number;
       total_members: number;
       active_borrows: number;
       overdue_items: number;
     };
     recent_activity: BorrowingTransactionDetails[];
     popular_books_weekly: BookPopularityStats[];
     alerts: {
       overdue_books: number;
       members_at_limit: number;
     };
   }

   // Response types
   export interface BorrowingResponse {
     transaction: BorrowingTransactionDetails;
   }

   export interface BorrowingHistoryResponse {
     transactions: BorrowingTransactionDetails[];
   }

   export interface LibraryStatsResponse {
     stats: LibraryStats;
   }

   export interface DashboardResponse {
     dashboard: DashboardData;
   }
   ```

### Task 3.3: Create Borrowing Repository
**Objective:** Implement data access layer for borrowing operations

1. **Create `src/data/BorrowingRepository.ts`**
   ```typescript
   import { dirname, join } from 'node:path';
   import { fileURLToPath } from 'node:url';
   import sqlite3 from 'sqlite3';
   import type { 
     BorrowingTransaction, 
     BorrowingTransactionDetails,
     CheckoutRequest,
     BookPopularityStats,
     LibraryStats
   } from '../shared/types.js';

   export interface IBorrowingRepository {
     // Transaction management
     createTransaction(transaction: BorrowingTransaction): Promise<void>;
     getTransactionById(id: string): Promise<BorrowingTransactionDetails | null>;
     updateTransaction(id: string, updates: Partial<BorrowingTransaction>): Promise<boolean>;
     getAllTransactions(): Promise<BorrowingTransactionDetails[]>;
     
     // Member-specific queries
     getMemberTransactions(memberId: string): Promise<BorrowingTransactionDetails[]>;
     getMemberActiveTransactions(memberId: string): Promise<BorrowingTransactionDetails[]>;
     getMemberBorrowingCount(memberId: string): Promise<number>;
     getMemberOverdueCount(memberId: string): Promise<number>;
     
     // Book-specific queries
     getBookBorrowingHistory(bookId: string): Promise<BorrowingTransactionDetails[]>;
     getCopyBorrowingHistory(copyId: string): Promise<BorrowingTransactionDetails[]>;
     
     // Analytics queries
     getPopularBooks(timeframe: 'week' | 'month' | 'year', limit: number): Promise<BookPopularityStats[]>;
     getOverdueTransactions(): Promise<BorrowingTransactionDetails[]>;
     getLibraryStats(): Promise<LibraryStats>;
     updateOverdueStatus(): Promise<void>;
   }

   export class BorrowingRepository implements IBorrowingRepository {
     private db: sqlite3.Database;

     constructor() {
       const __filename = fileURLToPath(import.meta.url);
       const __dirname = dirname(__filename);
       
       this.db = new sqlite3.Database(
         join(__dirname, '..', '..', 'library.db'),
         (err: Error | null) => {
           if (err) {
             console.error('Error opening database:', err.message);
           } else {
             console.log('Connected to the SQLite database for Borrowing.');
           }
         }
       );
     }

     // Implement all interface methods
     // Use complex JOIN queries to get detailed transaction information
   }
   ```

### Task 3.4: Create Borrowing Service
**Objective:** Implement business logic for borrowing operations

1. **Create `src/business/BorrowingService.ts`**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import type { IBorrowingRepository } from '../data/BorrowingRepository.js';
   import type {
     BorrowingTransaction,
     BorrowingTransactionDetails,
     CheckoutRequest,
     CheckinRequest,
     MemberBorrowingStatus,
     BusinessResult,
     LibraryStats,
     DashboardData,
   } from '../shared/types.js';

   export interface IBorrowingService {
     // Core borrowing operations
     checkoutBook(checkoutData: CheckoutRequest): Promise<BusinessResult<BorrowingTransactionDetails>>;
     checkinBook(checkinData: CheckinRequest): Promise<BusinessResult<BorrowingTransactionDetails>>;
     
     // Status and history
     getMemberBorrowingStatus(memberId: string): Promise<BusinessResult<MemberBorrowingStatus>>;
     getBorrowingHistory(memberId?: string): Promise<BusinessResult<BorrowingTransactionDetails[]>>;
     
     // Analytics and reporting
     getLibraryStats(): Promise<BusinessResult<LibraryStats>>;
     getDashboardData(): Promise<BusinessResult<DashboardData>>;
     getPopularBooks(timeframe: 'week' | 'month' | 'year'): Promise<BusinessResult<any[]>>;
     getOverdueItems(): Promise<BusinessResult<BorrowingTransactionDetails[]>>;
     
     // Utility methods
     updateOverdueStatus(): Promise<BusinessResult<void>>;
     validateBorrowingEligibility(memberId: string): Promise<BusinessResult<boolean>>;
   }

   export class BorrowingService implements IBorrowingService {
     constructor(private borrowingRepository: IBorrowingRepository) {}

     // Implement business rules:
     // - Maximum 3 books per member
     // - 14-day borrowing period
     // - Cannot borrow if overdue items exist
     // - Automatic overdue status updates
   }
   ```

## Day 2 Tasks

### Task 3.5: Create Borrowing Controller
**Objective:** Implement API endpoints for borrowing operations

1. **Create `src/presentation/BorrowingController.ts`**
   ```typescript
   import type { Request, Response } from 'express';
   import type { IBorrowingService } from '../business/BorrowingService.js';
   import type {
     BorrowingResponse,
     BorrowingHistoryResponse,
     LibraryStatsResponse,
     DashboardResponse,
     CheckoutRequest,
     CheckinRequest,
     ErrorResponse,
   } from '../shared/types.js';

   export class BorrowingController {
     constructor(private borrowingService: IBorrowingService) {}

     // POST /borrowing/checkout - Check out a book
     checkoutBook = async (
       req: Request<{}, BorrowingResponse | ErrorResponse, CheckoutRequest>,
       res: Response<BorrowingResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation with validation
     };

     // POST /borrowing/checkin - Return a book
     checkinBook = async (
       req: Request<{}, BorrowingResponse | ErrorResponse, CheckinRequest>,
       res: Response<BorrowingResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /borrowing/member/:id/status - Get member borrowing status
     getMemberStatus = async (
       req: Request,
       res: Response<any | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /borrowing/history/:memberId? - Get borrowing history
     getBorrowingHistory = async (
       req: Request,
       res: Response<BorrowingHistoryResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /borrowing/overdue - Get overdue items
     getOverdueItems = async (
       req: Request,
       res: Response<BorrowingHistoryResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /analytics/stats - Get library statistics
     getLibraryStats = async (
       req: Request,
       res: Response<LibraryStatsResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /analytics/dashboard - Get dashboard data
     getDashboardData = async (
       req: Request,
       res: Response<DashboardResponse | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };

     // GET /analytics/popular/:timeframe - Get popular books
     getPopularBooks = async (
       req: Request,
       res: Response<any | ErrorResponse>
     ): Promise<void> => {
       // Implementation
     };
   }
   ```

### Task 3.6: Create Borrowing Routes
**Objective:** Set up routing for borrowing and analytics endpoints

1. **Add borrowing routes**
   ```typescript
   import express from 'express';
   import type { BorrowingController } from './BorrowingController.js';

   export function createBorrowingRoutes(borrowingController: BorrowingController): express.Router {
     const router = express.Router();

     // Borrowing operations
     router.post('/checkout', borrowingController.checkoutBook);
     router.post('/checkin', borrowingController.checkinBook);
     router.get('/member/:id/status', borrowingController.getMemberStatus);
     router.get('/history/:memberId?', borrowingController.getBorrowingHistory);
     router.get('/overdue', borrowingController.getOverdueItems);

     return router;
   }

   export function createAnalyticsRoutes(borrowingController: BorrowingController): express.Router {
     const router = express.Router();

     // Analytics and reporting
     router.get('/stats', borrowingController.getLibraryStats);
     router.get('/dashboard', borrowingController.getDashboardData);
     router.get('/popular/:timeframe', borrowingController.getPopularBooks);

     return router;
   }
   ```

### Task 3.7: Integration with Book and Member Systems
**Objective:** Connect borrowing system with books and members

1. **Integration points to implement:**
   - Validate member exists and is eligible before checkout
   - Validate book copy exists and is available
   - Update book copy status when borrowed/returned
   - Update member borrowing counts
   - Handle cascade deletions properly

2. **Cross-system validation:**
   - Cannot delete book with active borrows
   - Cannot delete member with active borrows
   - Member borrowing limit enforcement
   - Book copy availability tracking

### Task 3.8: Create Borrowing Seed Data
**Objective:** Add sample borrowing transactions for testing

1. **Create `src/data/seeds/borrowing.sql`**
   ```sql
   -- Sample borrowing transactions
   INSERT INTO borrowing_transactions (id, member_id, book_copy_id, borrowed_date, due_date, status) VALUES
   ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'copy-id-1', '2024-09-10 10:00:00', '2024-09-24 10:00:00', 'borrowed'),
   ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'copy-id-2', '2024-09-15 14:30:00', '2024-09-29 14:30:00', 'borrowed'),
   ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'copy-id-3', '2024-09-01 09:15:00', '2024-09-15 09:15:00', 'returned', '2024-09-14 16:20:00');
   ```

### Task 3.9: Advanced Analytics Implementation
**Objective:** Build comprehensive reporting system

1. **Statistical calculations:**
   - Weekly, monthly, yearly popular books
   - Member engagement metrics
   - Collection utilization rates
   - Borrowing trend analysis

2. **Dashboard metrics:**
   - Real-time library status
   - Recent activity feed
   - Alert system for overdue items
   - Quick action insights

### Task 3.10: Testing and Validation
**Objective:** Ensure all borrowing rules work correctly

1. **Test borrowing business rules:**
   - 3-book limit per member
   - 14-day borrowing period
   - Cannot borrow with overdue items
   - Proper status updates

2. **Test analytics accuracy:**
   - Popular books calculations
   - Statistical reporting
   - Dashboard data integrity

## Technical Requirements

### Business Rules Implementation
- Maximum 3 books per member at any time
- 14-day standard loan period
- Block new borrowing for members with overdue items
- Automatic overdue status calculation
- Book copy availability updates

### Performance Considerations
- Index all foreign keys
- Optimize complex JOIN queries for analytics
- Consider caching for dashboard data
- Efficient overdue status updates

### Error Handling
- Member not found or inactive
- Book copy not available
- Member at borrowing limit
- Invalid transaction states

## Integration Points
- **With Person 1 (Books):** Book copy status updates, availability checking
- **With Person 2 (Members):** Member eligibility, borrowing limits, deletion constraints

## Success Criteria
- [ ] Borrowing database schema created and indexed
- [ ] All borrowing TypeScript interfaces defined
- [ ] Borrowing repository with all operations
- [ ] Borrowing service with business rules
- [ ] Complete checkout/checkin workflow
- [ ] Member borrowing status tracking
- [ ] Analytics and reporting system
- [ ] Dashboard data endpoints
- [ ] Popular books statistics
- [ ] Overdue item management
- [ ] Integration with books and members
- [ ] All business rules enforced
- [ ] Comprehensive testing completed