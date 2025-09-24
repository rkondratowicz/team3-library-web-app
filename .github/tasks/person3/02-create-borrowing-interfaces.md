# Task 3.2: Create Borrowing TypeScript Interfaces

## Objective
Define comprehensive TypeScript interfaces for the borrowing system, including borrowing transactions, fines, reservations, and analytics data structures. These interfaces will provide type safety and clear contracts for the borrowing system.

## Current State
- Borrowing database schema implemented
- Need TypeScript interfaces to match database schema
- Must integrate with existing book and member interfaces

## What You Will Create
- Complete borrowing type definitions
- Request/response interfaces for API
- Analytics data structures
- Integration interfaces with book and member systems

## Step-by-Step Instructions

### Step 1: Examine Existing Types

1. **Review existing type definitions:**
   ```bash
   cat src/shared/types.ts
   ```

2. **Identify integration points with existing types:**
   - Book and BookCopy interfaces from Person 1
   - Member interfaces from Person 2
   - BusinessResult pattern for consistent responses

### Step 2: Add Borrowing Core Interfaces

1. **Open `src/shared/types.ts` and add borrowing interfaces after existing types:**

   ```typescript
   // ==========================================
   // Borrowing System Types
   // ==========================================

   // Core borrowing transaction interface
   export interface Borrowing {
     id: string;
     member_id: string;
     book_copy_id: string;
     borrowed_date: string; // ISO date string (YYYY-MM-DD)
     due_date: string; // ISO date string (YYYY-MM-DD)
     returned_date: string | null; // ISO date string or null
     renewal_count: number;
     status: BorrowingStatus;
     notes: string | null;
     created_at: string; // ISO datetime string
     updated_at: string; // ISO datetime string
   }

   // Borrowing status enumeration
   export type BorrowingStatus = 'active' | 'returned' | 'overdue' | 'lost';

   // Extended borrowing with related data for display/analytics
   export interface BorrowingWithDetails extends Borrowing {
     member_name: string;
     member_email: string;
     book_title: string;
     book_author: string;
     book_isbn: string | null;
     days_borrowed: number;
     overdue_days: number;
   }

   // Fine management interface
   export interface Fine {
     id: string;
     borrowing_id: string;
     member_id: string;
     fine_type: FineType;
     amount: number;
     assessed_date: string; // ISO date string
     paid_date: string | null; // ISO date string or null
     status: FineStatus;
     description: string | null;
     created_at: string; // ISO datetime string
     updated_at: string; // ISO datetime string
   }

   // Fine type enumeration
   export type FineType = 'overdue' | 'lost' | 'damage' | 'late_return';

   // Fine status enumeration
   export type FineStatus = 'unpaid' | 'paid' | 'waived' | 'disputed';

   // Reservation management interface
   export interface Reservation {
     id: string;
     member_id: string;
     book_id: string;
     reserved_date: string; // ISO date string
     expiry_date: string; // ISO date string
     status: ReservationStatus;
     priority: number;
     fulfilled_date: string | null; // ISO date string or null
     notes: string | null;
     created_at: string; // ISO datetime string
     updated_at: string; // ISO datetime string
   }

   // Reservation status enumeration
   export type ReservationStatus = 'active' | 'fulfilled' | 'cancelled' | 'expired';

   // Extended reservation with related data
   export interface ReservationWithDetails extends Reservation {
     member_name: string;
     member_email: string;
     book_title: string;
     book_author: string;
     book_isbn: string | null;
     available_copies: number;
     queue_position: number;
   }
   ```

### Step 3: Add Request/Response Interfaces

1. **Add API request interfaces:**

   ```typescript
   // ==========================================
   // Borrowing API Request/Response Types
   // ==========================================

   // Request to borrow a book
   export interface BorrowBookRequest {
     member_id: string;
     book_id: string; // Will find available copy
     loan_period_days?: number; // Optional, defaults to 14 days
     notes?: string;
   }

   // Request to return a book
   export interface ReturnBookRequest {
     borrowing_id: string;
     returned_date?: string; // Optional, defaults to today
     condition_notes?: string;
   }

   // Request to renew a borrowing
   export interface RenewBorrowingRequest {
     borrowing_id: string;
     renewal_period_days?: number; // Optional, defaults to 14 days
     notes?: string;
   }

   // Request to create a reservation
   export interface CreateReservationRequest {
     member_id: string;
     book_id: string;
     notes?: string;
   }

   // Request to update a reservation
   export interface UpdateReservationRequest {
     status?: ReservationStatus;
     notes?: string;
   }

   // Request to assess a fine
   export interface AssessFineRequest {
     borrowing_id: string;
     fine_type: FineType;
     amount: number;
     description?: string;
   }

   // Request to pay/update a fine
   export interface UpdateFineRequest {
     status: FineStatus;
     paid_date?: string; // Required when status is 'paid'
     notes?: string;
   }

   // Search filters for borrowings
   export interface BorrowingSearchFilters {
     member_id?: string;
     book_id?: string;
     status?: BorrowingStatus;
     overdue_only?: boolean;
     due_date_from?: string; // ISO date
     due_date_to?: string; // ISO date
     borrowed_date_from?: string; // ISO date
     borrowed_date_to?: string; // ISO date
     limit?: number;
     offset?: number;
   }

   // Search filters for fines
   export interface FineSearchFilters {
     member_id?: string;
     status?: FineStatus;
     fine_type?: FineType;
     amount_min?: number;
     amount_max?: number;
     assessed_date_from?: string; // ISO date
     assessed_date_to?: string; // ISO date
     limit?: number;
     offset?: number;
   }

   // Search filters for reservations
   export interface ReservationSearchFilters {
     member_id?: string;
     book_id?: string;
     status?: ReservationStatus;
     reserved_date_from?: string; // ISO date
     reserved_date_to?: string; // ISO date
     limit?: number;
     offset?: number;
   }
   ```

### Step 4: Add Analytics and Statistics Interfaces

1. **Add analytics data structures:**

   ```typescript
   // ==========================================
   // Borrowing Analytics Types
   // ==========================================

   // Overall borrowing statistics
   export interface BorrowingStatistics {
     total_borrowings: number;
     active_borrowings: number;
     overdue_borrowings: number;
     returned_borrowings: number;
     lost_borrowings: number;
     total_renewals: number;
     average_loan_duration: number; // in days
     popular_books: PopularBook[];
     active_members: number;
     overdue_rate: number; // percentage
   }

   // Popular book statistics
   export interface PopularBook {
     book_id: string;
     title: string;
     author: string;
     isbn: string | null;
     borrow_count: number;
     current_reservations: number;
   }

   // Member borrowing summary
   export interface MemberBorrowingSummary {
     member_id: string;
     member_name: string;
     member_email: string;
     total_borrowings: number;
     active_borrowings: number;
     overdue_borrowings: number;
     total_renewals: number;
     unpaid_fines: number;
     total_fine_amount: number;
     can_borrow: boolean;
     borrowing_history: BorrowingWithDetails[];
   }

   // Fine statistics
   export interface FineStatistics {
     total_fines_assessed: number;
     total_fine_amount: number;
     unpaid_fines: number;
     unpaid_fine_amount: number;
     paid_fines: number;
     paid_fine_amount: number;
     waived_fines: number;
     waived_fine_amount: number;
     fine_by_type: FineTypeStatistics[];
   }

   // Fine statistics by type
   export interface FineTypeStatistics {
     fine_type: FineType;
     count: number;
     total_amount: number;
     average_amount: number;
   }

   // Reservation statistics
   export interface ReservationStatistics {
     total_reservations: number;
     active_reservations: number;
     fulfilled_reservations: number;
     cancelled_reservations: number;
     expired_reservations: number;
     average_wait_time: number; // in days
     books_with_reservations: number;
   }

   // Daily/Monthly borrowing trends
   export interface BorrowingTrend {
     date: string; // ISO date
     borrowings: number;
     returns: number;
     renewals: number;
     new_reservations: number;
   }
   ```

### Step 5: Add Integration and Utility Interfaces

1. **Add integration interfaces:**

   ```typescript
   // ==========================================
   // Integration and Utility Types
   // ==========================================

   // Member eligibility status (extended from member system)
   export interface MemberBorrowingEligibility extends MemberBorrowingStatus {
     borrowing_details: {
       active_borrowings: BorrowingWithDetails[];
       overdue_borrowings: BorrowingWithDetails[];
       unpaid_fines: Fine[];
       total_unpaid_amount: number;
       reservations: ReservationWithDetails[];
     };
   }

   // Book availability status
   export interface BookAvailability {
     book_id: string;
     title: string;
     author: string;
     total_copies: number;
     available_copies: number;
     borrowed_copies: number;
     reserved_copies: number;
     lost_copies: number;
     available_copy_ids: string[];
     next_return_date: string | null; // ISO date
     reservation_queue_length: number;
   }

   // Borrowing workflow status
   export interface BorrowingWorkflowResult {
     success: boolean;
     borrowing?: Borrowing;
     fine?: Fine;
     reservation?: Reservation;
     message: string;
     next_actions?: string[];
   }

   // Overdue notification data
   export interface OverdueNotification {
     borrowing_id: string;
     member_id: string;
     member_name: string;
     member_email: string;
     book_title: string;
     book_author: string;
     due_date: string;
     days_overdue: number;
     fine_amount: number;
     renewal_count: number;
     max_renewals: number;
     can_renew: boolean;
   }

   // Return condition assessment
   export interface ReturnConditionAssessment {
     condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
     damage_description?: string;
     requires_fine: boolean;
     suggested_fine_amount?: number;
     suggested_fine_type?: FineType;
   }

   // Batch operations
   export interface BatchBorrowingOperation {
     operation: 'borrow' | 'return' | 'renew' | 'assess_fine';
     items: string[]; // Array of IDs (borrowing_id, member_id, etc.)
     parameters?: Record<string, any>;
   }

   export interface BatchOperationResult {
     total_items: number;
     successful_items: number;
     failed_items: number;
     results: Array<{
       item_id: string;
       success: boolean;
       error?: string;
       data?: any;
     }>;
   }
   ```

### Step 6: Add Validation and Configuration Types

1. **Add configuration and validation types:**

   ```typescript
   // ==========================================
   // Configuration and Validation Types
   // ==========================================

   // Borrowing policy configuration
   export interface BorrowingPolicy {
     default_loan_period_days: number;
     max_renewals: number;
     renewal_period_days: number;
     max_books_per_member: number;
     overdue_fine_per_day: number;
     lost_book_fine_multiplier: number;
     reservation_expiry_days: number;
     grace_period_days: number;
     member_types: {
       [key: string]: {
         max_books: number;
         loan_period: number;
         can_renew: boolean;
         can_reserve: boolean;
       };
     };
   }

   // Validation result for borrowing operations
   export interface BorrowingValidationResult {
     valid: boolean;
     errors: string[];
     warnings: string[];
     member_eligible: boolean;
     book_available: boolean;
     copy_available: boolean;
     suggested_actions: string[];
   }

   // Date range for analytics queries
   export interface DateRange {
     start_date: string; // ISO date
     end_date: string; // ISO date
   }

   // Pagination parameters
   export interface PaginationParams {
     page: number;
     page_size: number;
     total_count?: number;
     total_pages?: number;
   }

   // Sorting parameters
   export interface SortParams {
     field: string;
     direction: 'asc' | 'desc';
   }

   // Complete search parameters combining filters, pagination, and sorting
   export interface BorrowingSearchParams extends BorrowingSearchFilters {
     pagination?: PaginationParams;
     sort?: SortParams;
   }

   export interface FineSearchParams extends FineSearchFilters {
     pagination?: PaginationParams;
     sort?: SortParams;
   }

   export interface ReservationSearchParams extends ReservationSearchFilters {
     pagination?: PaginationParams;
     sort?: SortParams;
   }
   ```

### Step 7: Update Existing Member Interfaces (if needed)

1. **Check if MemberBorrowingStatus needs updates for borrowing integration:**

   ```typescript
   // Update the existing MemberBorrowingStatus if needed
   // This should already exist from Person 2's work, but verify it has:
   
   // export interface MemberBorrowingStatus {
   //   member_id: string;
   //   member_name: string;
   //   current_borrowed_count: number;
   //   max_books: number;
   //   overdue_count: number;
   //   can_borrow: boolean;
   //   status: string;
   //   restrictions: string[];
   // }
   ```

### Step 8: Compile and Validate Types

1. **Test TypeScript compilation:**
   ```bash
   # Compile to check for type errors
   npm run build
   ```

2. **Create a type validation test file:**
   ```bash
   cat > test-borrowing-types.ts << 'EOF'
   // Test file to validate borrowing types
   import type {
     Borrowing,
     BorrowingWithDetails,
     Fine,
     Reservation,
     BorrowBookRequest,
     BorrowingStatistics,
     MemberBorrowingEligibility,
     BookAvailability,
     BorrowingPolicy
   } from './src/shared/types.js';

   // Test basic borrowing interface
   const testBorrowing: Borrowing = {
     id: '550e8400-e29b-41d4-a716-446655440000',
     member_id: 'member-id',
     book_copy_id: 'copy-id',
     borrowed_date: '2024-01-15',
     due_date: '2024-01-29',
     returned_date: null,
     renewal_count: 0,
     status: 'active',
     notes: null,
     created_at: '2024-01-15T10:30:00.000Z',
     updated_at: '2024-01-15T10:30:00.000Z'
   };

   // Test request interface
   const testBorrowRequest: BorrowBookRequest = {
     member_id: 'member-id',
     book_id: 'book-id',
     loan_period_days: 14,
     notes: 'Test borrowing'
   };

   // Test fine interface
   const testFine: Fine = {
     id: 'fine-id',
     borrowing_id: 'borrowing-id',
     member_id: 'member-id',
     fine_type: 'overdue',
     amount: 5.50,
     assessed_date: '2024-01-20',
     paid_date: null,
     status: 'unpaid',
     description: 'Overdue fine',
     created_at: '2024-01-20T09:00:00.000Z',
     updated_at: '2024-01-20T09:00:00.000Z'
   };

   // Test statistics interface
   const testStats: BorrowingStatistics = {
     total_borrowings: 100,
     active_borrowings: 25,
     overdue_borrowings: 5,
     returned_borrowings: 70,
     lost_borrowings: 0,
     total_renewals: 15,
     average_loan_duration: 12.5,
     popular_books: [],
     active_members: 50,
     overdue_rate: 5.0
   };

   console.log('Borrowing types validation successful!');
   console.log('Test borrowing:', testBorrowing.id);
   console.log('Test request:', testBorrowRequest.member_id);
   console.log('Test fine:', testFine.amount);
   console.log('Test stats:', testStats.total_borrowings);
   EOF

   # Compile the test
   npx tsc test-borrowing-types.ts --moduleResolution node --module esnext --target es2020 --skipLibCheck

   # Run the test
   node test-borrowing-types.js

   # Clean up
   rm test-borrowing-types.ts test-borrowing-types.js
   ```

3. **Verify integration with existing types:**
   ```bash
   # Check that all imports work correctly
   cat > test-type-integration.ts << 'EOF'
   import type {
     // Existing types from book system
     Book,
     BookCopy,
     
     // Existing types from member system
     Member,
     MemberBorrowingStatus,
     BusinessResult,
     
     // New borrowing types
     Borrowing,
     BorrowingWithDetails,
     Fine,
     Reservation,
     BorrowingStatistics
   } from './src/shared/types.js';

   // Test that types integrate properly
   function testBorrowingWithMember(member: Member, borrowing: Borrowing): BusinessResult<BorrowingWithDetails> {
     return {
       success: true,
       data: {
         ...borrowing,
         member_name: member.name,
         member_email: member.email,
         book_title: 'Test Book',
         book_author: 'Test Author',
         book_isbn: '978-0000000000',
         days_borrowed: 10,
         overdue_days: 0
       },
       statusCode: 200
     };
   }

   console.log('Type integration test successful!');
   EOF

   # Compile integration test
   npx tsc test-type-integration.ts --moduleResolution node --module esnext --target es2020 --skipLibCheck

   # Clean up
   rm test-type-integration.ts test-type-integration.js
   ```

## Expected Results
- ✅ Complete borrowing type system implemented
- ✅ 15+ core interfaces defined
- ✅ Request/response types for all API operations
- ✅ Analytics and statistics interfaces
- ✅ Integration interfaces with member/book systems
- ✅ Validation and configuration types
- ✅ TypeScript compilation successful
- ✅ Type integration validated

## Interfaces Created

### Core Data Types
- ✅ `Borrowing` - Main borrowing transaction
- ✅ `BorrowingWithDetails` - Extended borrowing with related data
- ✅ `Fine` - Fine management
- ✅ `Reservation` - Book reservation
- ✅ `ReservationWithDetails` - Extended reservation data

### Request/Response Types
- ✅ `BorrowBookRequest` - Borrow book API request
- ✅ `ReturnBookRequest` - Return book API request
- ✅ `RenewBorrowingRequest` - Renew borrowing request
- ✅ `CreateReservationRequest` - Create reservation request
- ✅ Search filter interfaces for all entities

### Analytics Types
- ✅ `BorrowingStatistics` - Overall borrowing analytics
- ✅ `MemberBorrowingSummary` - Member-specific statistics
- ✅ `FineStatistics` - Fine analytics
- ✅ `ReservationStatistics` - Reservation analytics
- ✅ `BorrowingTrend` - Trend analysis data

### Integration Types
- ✅ `MemberBorrowingEligibility` - Extended eligibility
- ✅ `BookAvailability` - Book availability status
- ✅ `BorrowingWorkflowResult` - Workflow results
- ✅ `OverdueNotification` - Notification data

### Utility Types
- ✅ `BorrowingPolicy` - Configuration settings
- ✅ `BorrowingValidationResult` - Validation results
- ✅ Batch operation interfaces
- ✅ Pagination and sorting interfaces

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in existing codebase
2. Verify enum values match database constraints
3. Ensure interface names don't conflict with existing types

### If integration issues occur:
1. Check that BusinessResult pattern is consistent
2. Verify member and book interfaces are imported correctly
3. Test type compatibility with existing systems

### If type validation fails:
1. Review interface field types against database schema
2. Check that optional fields are properly marked
3. Validate date string formats are consistent

## Next Steps
After completing this task, proceed to Task 3.3: Create Borrowing Repository.

## Files Modified
- ✅ `src/shared/types.ts` (added comprehensive borrowing interfaces)