# Task 3.4: Create Borrowing Service

## Objective
Implement the business logic layer for the borrowing system, including borrowing workflows, fine management, reservation handling, and integration with member and book systems.

## Current State
- Borrowing repository implemented with data access layer
- Need business logic layer following service pattern
- Must implement complex borrowing workflows and validation

## What You Will Create
- Complete IBorrowingService interface
- Full BorrowingService implementation
- Borrowing workflow logic (borrow, return, renew)
- Fine assessment and management
- Reservation management system
- Integration with member and book systems

## Step-by-Step Instructions

### Step 1: Create the Borrowing Service File

1. **Create `src/business/BorrowingService.ts`:**
   ```bash
   touch src/business/BorrowingService.ts
   ```

### Step 2: Add Imports and Interface Definition

1. **Add the following content to `src/business/BorrowingService.ts`:**
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import type { IBorrowingRepository } from '../data/BorrowingRepository.js';
   import type { IMemberService } from './MemberService.js';
   import type { IBookService } from './BookService.js';
   import type {
     Borrowing,
     BorrowingWithDetails,
     Fine,
     Reservation,
     ReservationWithDetails,
     BorrowBookRequest,
     ReturnBookRequest,
     RenewBorrowingRequest,
     CreateReservationRequest,
     UpdateReservationRequest,
     AssessFineRequest,
     UpdateFineRequest,
     BorrowingSearchFilters,
     FineSearchFilters,
     ReservationSearchFilters,
     BorrowingStatistics,
     MemberBorrowingSummary,
     FineStatistics,
     ReservationStatistics,
     BookAvailability,
     OverdueNotification,
     BorrowingTrend,
     BorrowingWorkflowResult,
     BorrowingValidationResult,
     MemberBorrowingEligibility,
     BusinessResult,
     BorrowingPolicy,
   } from '../shared/types.js';

   export interface IBorrowingService {
     // Borrowing workflow operations
     borrowBook(request: BorrowBookRequest): Promise<BusinessResult<BorrowingWorkflowResult>>;
     returnBook(request: ReturnBookRequest): Promise<BusinessResult<BorrowingWorkflowResult>>;
     renewBorrowing(request: RenewBorrowingRequest): Promise<BusinessResult<BorrowingWorkflowResult>>;
     
     // Borrowing queries
     getAllBorrowings(): Promise<BusinessResult<BorrowingWithDetails[]>>;
     getBorrowingById(id: string): Promise<BusinessResult<BorrowingWithDetails>>;
     getMemberBorrowings(memberId: string): Promise<BusinessResult<BorrowingWithDetails[]>>;
     searchBorrowings(filters: BorrowingSearchFilters): Promise<BusinessResult<BorrowingWithDetails[]>>;
     getOverdueBorrowings(): Promise<BusinessResult<BorrowingWithDetails[]>>;
     
     // Fine management
     assessFine(request: AssessFineRequest): Promise<BusinessResult<Fine>>;
     updateFine(fineId: string, request: UpdateFineRequest): Promise<BusinessResult<Fine>>;
     getFinesByMember(memberId: string): Promise<BusinessResult<Fine[]>>;
     searchFines(filters: FineSearchFilters): Promise<BusinessResult<Fine[]>>;
     
     // Reservation management
     createReservation(request: CreateReservationRequest): Promise<BusinessResult<Reservation>>;
     updateReservation(reservationId: string, request: UpdateReservationRequest): Promise<BusinessResult<Reservation>>;
     cancelReservation(reservationId: string): Promise<BusinessResult<void>>;
     getMemberReservations(memberId: string): Promise<BusinessResult<ReservationWithDetails[]>>;
     getBookReservations(bookId: string): Promise<BusinessResult<ReservationWithDetails[]>>;
     searchReservations(filters: ReservationSearchFilters): Promise<BusinessResult<ReservationWithDetails[]>>;
     
     // Analytics and reporting
     getBorrowingStatistics(): Promise<BusinessResult<BorrowingStatistics>>;
     getMemberBorrowingSummary(memberId: string): Promise<BusinessResult<MemberBorrowingSummary>>;
     getFineStatistics(): Promise<BusinessResult<FineStatistics>>;
     getReservationStatistics(): Promise<BusinessResult<ReservationStatistics>>;
     getBorrowingTrends(startDate: string, endDate: string): Promise<BusinessResult<BorrowingTrend[]>>;
     
     // Book availability and management
     getBookAvailability(bookId: string): Promise<BusinessResult<BookAvailability>>;
     
     // Member eligibility and validation
     checkMemberEligibility(memberId: string): Promise<BusinessResult<MemberBorrowingEligibility>>;
     validateBorrowingRequest(request: BorrowBookRequest): Promise<BusinessResult<BorrowingValidationResult>>;
     
     // Overdue management
     getOverdueNotifications(): Promise<BusinessResult<OverdueNotification[]>>;
     processOverdueItems(): Promise<BusinessResult<{ updated: number; fines_assessed: number }>>;
     
     // System maintenance
     updateOverdueStatus(): Promise<BusinessResult<number>>;
     processExpiredReservations(): Promise<BusinessResult<number>>;
   }
   ```

### Step 3: Implement the BorrowingService Class Structure

1. **Add the class implementation start:**
   ```typescript
   export class BorrowingService implements IBorrowingService {
     private readonly DEFAULT_LOAN_PERIOD_DAYS = 14;
     private readonly MAX_RENEWALS = 3;
     private readonly OVERDUE_FINE_PER_DAY = 0.50;
     private readonly RESERVATION_EXPIRY_DAYS = 7;

     constructor(
       private borrowingRepository: IBorrowingRepository,
       private memberService: IMemberService,
       private bookService: IBookService
     ) {}

     // Helper method for creating consistent business results
     private createBusinessResult<T>(
       success: boolean,
       data?: T,
       error?: string,
       statusCode: number = 200
     ): BusinessResult<T> {
       const result: BusinessResult<T> = {
         success,
         statusCode,
       };

       if (data !== undefined) result.data = data;
       if (error) result.error = error;

       return result;
     }

     // Helper method for date calculations
     private addDays(date: Date, days: number): string {
       const result = new Date(date);
       result.setDate(result.getDate() + days);
       return result.toISOString().split('T')[0]; // Return YYYY-MM-DD format
     }

     // Helper method for validating UUID format
     private isValidUUID(id: string): boolean {
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
       return uuidRegex.test(id);
     }
   ```

### Step 4: Implement Core Borrowing Workflow Methods

1. **Add borrowBook method:**
   ```typescript
     async borrowBook(request: BorrowBookRequest): Promise<BusinessResult<BorrowingWorkflowResult>> {
       try {
         // Validate the request
         const validation = await this.validateBorrowingRequest(request);
         if (!validation.success || !validation.data?.valid) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: validation.data?.errors.join(', ') || 'Borrowing request validation failed',
               next_actions: validation.data?.suggested_actions || []
             },
             validation.error || 'Validation failed',
             400
           );
         }

         // Get available copy
         const availableCopiess = await this.borrowingRepository.getAvailableBookCopies(request.book_id);
         if (availableCopiess.length === 0) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'No available copies of this book',
               next_actions: ['Create a reservation', 'Check back later']
             },
             'No available copies',
             409
           );
         }

         // Create borrowing record
         const now = new Date();
         const loanPeriod = request.loan_period_days || this.DEFAULT_LOAN_PERIOD_DAYS;
         
         const borrowing: Borrowing = {
           id: uuidv4(),
           member_id: request.member_id,
           book_copy_id: availableCopiess[0],
           borrowed_date: now.toISOString().split('T')[0],
           due_date: this.addDays(now, loanPeriod),
           returned_date: null,
           renewal_count: 0,
           status: 'active',
           notes: request.notes || null,
           created_at: now.toISOString(),
           updated_at: now.toISOString(),
         };

         await this.borrowingRepository.createBorrowing(borrowing);

         // Check if this fulfills any reservations
         const memberReservations = await this.borrowingRepository.getReservationsByMember(request.member_id);
         const bookReservation = memberReservations.find(r => 
           r.book_id === request.book_id && r.status === 'active'
         );

         if (bookReservation) {
           await this.borrowingRepository.updateReservation(bookReservation.id, {
             status: 'fulfilled',
             fulfilled_date: now.toISOString().split('T')[0],
             updated_at: now.toISOString(),
           });
         }

         return this.createBusinessResult(
           true,
           {
             success: true,
             borrowing,
             message: 'Book borrowed successfully',
             next_actions: [`Due date: ${borrowing.due_date}`, 'Enjoy your reading!']
           },
           undefined,
           201
         );

       } catch (error) {
         console.error('Error in BorrowingService.borrowBook:', error);
         return this.createBusinessResult(
           false,
           {
             success: false,
             message: 'Failed to borrow book',
             next_actions: ['Please try again later', 'Contact library staff if issue persists']
           },
           'Internal server error',
           500
         );
       }
     }

     async returnBook(request: ReturnBookRequest): Promise<BusinessResult<BorrowingWorkflowResult>> {
       try {
         // Validate borrowing exists
         const borrowing = await this.borrowingRepository.getBorrowingById(request.borrowing_id);
         if (!borrowing) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Borrowing record not found',
               next_actions: ['Verify borrowing ID', 'Contact library staff']
             },
             'Borrowing not found',
             404
           );
         }

         if (borrowing.returned_date) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Book has already been returned',
               next_actions: ['Check borrowing history']
             },
             'Book already returned',
             409
           );
         }

         // Calculate return details
         const returnDate = request.returned_date ? new Date(request.returned_date) : new Date();
         const returnDateStr = returnDate.toISOString().split('T')[0];
         const dueDate = new Date(borrowing.due_date);
         const isOverdue = returnDate > dueDate;
         
         // Update borrowing status
         await this.borrowingRepository.updateBorrowing(request.borrowing_id, {
           returned_date: returnDateStr,
           status: 'returned',
           updated_at: new Date().toISOString(),
         });

         let fine: Fine | undefined;

         // Assess overdue fine if applicable
         if (isOverdue) {
           const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
           const fineAmount = overdueDays * this.OVERDUE_FINE_PER_DAY;

           fine = {
             id: uuidv4(),
             borrowing_id: request.borrowing_id,
             member_id: borrowing.member_id,
             fine_type: 'late_return',
             amount: parseFloat(fineAmount.toFixed(2)),
             assessed_date: returnDateStr,
             paid_date: null,
             status: 'unpaid',
             description: `Late return fine - ${overdueDays} day(s) overdue`,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           };

           await this.borrowingRepository.createFine(fine);
         }

         // Check if any reservations can be fulfilled
         const bookReservations = await this.borrowingRepository.getReservationsByBook(borrowing.book_copy_id);
         const nextReservation = bookReservations.find(r => r.status === 'active');

         const nextActions = ['Book returned successfully'];
         if (fine) {
           nextActions.push(`Fine assessed: $${fine.amount.toFixed(2)}`);
         }
         if (nextReservation) {
           nextActions.push('Next reservation will be notified');
         }

         return this.createBusinessResult(
           true,
           {
             success: true,
             borrowing: { ...borrowing, returned_date: returnDateStr, status: 'returned' },
             fine,
             message: `Book returned successfully${isOverdue ? ' (late return fine applied)' : ''}`,
             next_actions: nextActions
           },
           undefined,
           200
         );

       } catch (error) {
         console.error('Error in BorrowingService.returnBook:', error);
         return this.createBusinessResult(
           false,
           {
             success: false,
             message: 'Failed to return book',
             next_actions: ['Please try again later', 'Contact library staff']
           },
           'Internal server error',
           500
         );
       }
     }

     async renewBorrowing(request: RenewBorrowingRequest): Promise<BusinessResult<BorrowingWorkflowResult>> {
       try {
         // Validate borrowing exists
         const borrowing = await this.borrowingRepository.getBorrowingById(request.borrowing_id);
         if (!borrowing) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Borrowing record not found',
               next_actions: ['Verify borrowing ID']
             },
             'Borrowing not found',
             404
           );
         }

         if (borrowing.returned_date) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Cannot renew returned book',
               next_actions: ['Borrow the book again if needed']
             },
             'Book already returned',
             409
           );
         }

         if (borrowing.renewal_count >= this.MAX_RENEWALS) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: `Maximum renewals (${this.MAX_RENEWALS}) reached`,
               next_actions: ['Return the book', 'Borrow again if available']
             },
             'Maximum renewals reached',
             409
           );
         }

         // Check member eligibility
         const eligibility = await this.checkMemberEligibility(borrowing.member_id);
         if (!eligibility.success || !eligibility.data?.can_borrow) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Member not eligible for renewal',
               next_actions: eligibility.data?.restrictions || ['Contact library staff']
             },
             'Member not eligible',
             409
           );
         }

         // Check if book has reservations
         const bookReservations = await this.borrowingRepository.getReservationsByBook(borrowing.book_copy_id);
         const activeReservations = bookReservations.filter(r => r.status === 'active');
         
         if (activeReservations.length > 0) {
           return this.createBusinessResult(
             false,
             {
               success: false,
               message: 'Cannot renew - book has active reservations',
               next_actions: ['Return on due date', 'Reserve the book for future borrowing']
             },
             'Book has reservations',
             409
           );
         }

         // Perform renewal
         const renewalPeriod = request.renewal_period_days || this.DEFAULT_LOAN_PERIOD_DAYS;
         const currentDueDate = new Date(borrowing.due_date);
         const newDueDate = this.addDays(currentDueDate, renewalPeriod);

         await this.borrowingRepository.updateBorrowing(request.borrowing_id, {
           due_date: newDueDate,
           renewal_count: borrowing.renewal_count + 1,
           notes: request.notes || borrowing.notes,
           updated_at: new Date().toISOString(),
         });

         const renewedBorrowing = await this.borrowingRepository.getBorrowingById(request.borrowing_id);

         return this.createBusinessResult(
           true,
           {
             success: true,
             borrowing: renewedBorrowing!,
             message: 'Book renewed successfully',
             next_actions: [
               `New due date: ${newDueDate}`,
               `Renewals remaining: ${this.MAX_RENEWALS - (borrowing.renewal_count + 1)}`
             ]
           },
           undefined,
           200
         );

       } catch (error) {
         console.error('Error in BorrowingService.renewBorrowing:', error);
         return this.createBusinessResult(
           false,
           {
             success: false,
             message: 'Failed to renew borrowing',
             next_actions: ['Please try again later', 'Contact library staff']
           },
           'Internal server error',
           500
         );
       }
     }
   ```

### Step 5: Implement Query and Search Methods

1. **Add borrowing query methods:**
   ```typescript
     async getAllBorrowings(): Promise<BusinessResult<BorrowingWithDetails[]>> {
       try {
         const borrowings = await this.borrowingRepository.searchBorrowings({});
         return this.createBusinessResult(true, borrowings);
       } catch (error) {
         console.error('Error in BorrowingService.getAllBorrowings:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve borrowings', 500);
       }
     }

     async getBorrowingById(id: string): Promise<BusinessResult<BorrowingWithDetails>> {
       try {
         if (!this.isValidUUID(id)) {
           return this.createBusinessResult(false, undefined, 'Invalid borrowing ID format', 400);
         }

         const borrowings = await this.borrowingRepository.searchBorrowings({ 
           limit: 1 
         });
         const borrowing = borrowings.find(b => b.id === id);

         if (!borrowing) {
           return this.createBusinessResult(false, undefined, 'Borrowing not found', 404);
         }

         return this.createBusinessResult(true, borrowing);
       } catch (error) {
         console.error('Error in BorrowingService.getBorrowingById:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve borrowing', 500);
       }
     }

     async getMemberBorrowings(memberId: string): Promise<BusinessResult<BorrowingWithDetails[]>> {
       try {
         if (!this.isValidUUID(memberId)) {
           return this.createBusinessResult(false, undefined, 'Invalid member ID format', 400);
         }

         const borrowings = await this.borrowingRepository.searchBorrowings({ 
           member_id: memberId 
         });
         return this.createBusinessResult(true, borrowings);
       } catch (error) {
         console.error('Error in BorrowingService.getMemberBorrowings:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve member borrowings', 500);
       }
     }

     async searchBorrowings(filters: BorrowingSearchFilters): Promise<BusinessResult<BorrowingWithDetails[]>> {
       try {
         // Validate filters
         if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
           return this.createBusinessResult(false, undefined, 'Limit must be between 1 and 100', 400);
         }

         if (filters.offset && filters.offset < 0) {
           return this.createBusinessResult(false, undefined, 'Offset cannot be negative', 400);
         }

         const borrowings = await this.borrowingRepository.searchBorrowings(filters);
         return this.createBusinessResult(true, borrowings);
       } catch (error) {
         console.error('Error in BorrowingService.searchBorrowings:', error);
         return this.createBusinessResult(false, undefined, 'Failed to search borrowings', 500);
       }
     }

     async getOverdueBorrowings(): Promise<BusinessResult<BorrowingWithDetails[]>> {
       try {
         const overdueBorrowings = await this.borrowingRepository.getOverdueBorrowings();
         return this.createBusinessResult(true, overdueBorrowings);
       } catch (error) {
         console.error('Error in BorrowingService.getOverdueBorrowings:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve overdue borrowings', 500);
       }
     }
   ```

### Step 6: Implement Fine Management Methods

1. **Add fine management methods:**
   ```typescript
     async assessFine(request: AssessFineRequest): Promise<BusinessResult<Fine>> {
       try {
         // Validate borrowing exists
         const borrowing = await this.borrowingRepository.getBorrowingById(request.borrowing_id);
         if (!borrowing) {
           return this.createBusinessResult(false, undefined, 'Borrowing not found', 404);
         }

         // Validate fine amount
         if (request.amount <= 0) {
           return this.createBusinessResult(false, undefined, 'Fine amount must be positive', 400);
         }

         // Create fine
         const fine: Fine = {
           id: uuidv4(),
           borrowing_id: request.borrowing_id,
           member_id: borrowing.member_id,
           fine_type: request.fine_type,
           amount: parseFloat(request.amount.toFixed(2)),
           assessed_date: new Date().toISOString().split('T')[0],
           paid_date: null,
           status: 'unpaid',
           description: request.description || null,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
         };

         await this.borrowingRepository.createFine(fine);
         return this.createBusinessResult(true, fine, undefined, 201);

       } catch (error) {
         console.error('Error in BorrowingService.assessFine:', error);
         return this.createBusinessResult(false, undefined, 'Failed to assess fine', 500);
       }
     }

     async updateFine(fineId: string, request: UpdateFineRequest): Promise<BusinessResult<Fine>> {
       try {
         if (!this.isValidUUID(fineId)) {
           return this.createBusinessResult(false, undefined, 'Invalid fine ID format', 400);
         }

         const existingFine = await this.borrowingRepository.getFineById(fineId);
         if (!existingFine) {
           return this.createBusinessResult(false, undefined, 'Fine not found', 404);
         }

         // Validate status transition
         if (request.status === 'paid' && !request.paid_date) {
           request.paid_date = new Date().toISOString().split('T')[0];
         }

         const updates: Partial<Fine> = {
           status: request.status,
           paid_date: request.paid_date || existingFine.paid_date,
           updated_at: new Date().toISOString(),
         };

         const success = await this.borrowingRepository.updateFine(fineId, updates);
         if (!success) {
           return this.createBusinessResult(false, undefined, 'Failed to update fine', 500);
         }

         const updatedFine = await this.borrowingRepository.getFineById(fineId);
         return this.createBusinessResult(true, updatedFine!);

       } catch (error) {
         console.error('Error in BorrowingService.updateFine:', error);
         return this.createBusinessResult(false, undefined, 'Failed to update fine', 500);
       }
     }

     async getFinesByMember(memberId: string): Promise<BusinessResult<Fine[]>> {
       try {
         if (!this.isValidUUID(memberId)) {
           return this.createBusinessResult(false, undefined, 'Invalid member ID format', 400);
         }

         const fines = await this.borrowingRepository.getFinesByMember(memberId);
         return this.createBusinessResult(true, fines);
       } catch (error) {
         console.error('Error in BorrowingService.getFinesByMember:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve member fines', 500);
       }
     }

     async searchFines(filters: FineSearchFilters): Promise<BusinessResult<Fine[]>> {
       try {
         // Validate filters
         if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
           return this.createBusinessResult(false, undefined, 'Limit must be between 1 and 100', 400);
         }

         const fines = await this.borrowingRepository.searchFines(filters);
         return this.createBusinessResult(true, fines);
       } catch (error) {
         console.error('Error in BorrowingService.searchFines:', error);
         return this.createBusinessResult(false, undefined, 'Failed to search fines', 500);
       }
     }
   ```

### Step 7: Implement Reservation Management Methods

1. **Add reservation management methods:**
   ```typescript
     async createReservation(request: CreateReservationRequest): Promise<BusinessResult<Reservation>> {
       try {
         // Validate member eligibility
         const eligibility = await this.checkMemberEligibility(request.member_id);
         if (!eligibility.success || !eligibility.data?.can_borrow) {
           return this.createBusinessResult(
             false, 
             undefined, 
             'Member not eligible to make reservations', 
             409
           );
         }

         // Check if book exists and get availability
         const bookAvailability = await this.borrowingRepository.getBookAvailability(request.book_id);
         if (!bookAvailability) {
           return this.createBusinessResult(false, undefined, 'Book not found', 404);
         }

         // Check if member already has a reservation for this book
         const memberReservations = await this.borrowingRepository.getReservationsByMember(request.member_id);
         const existingReservation = memberReservations.find(r => 
           r.book_id === request.book_id && r.status === 'active'
         );

         if (existingReservation) {
           return this.createBusinessResult(
             false, 
             undefined, 
             'Member already has an active reservation for this book', 
             409
           );
         }

         // If book is available, suggest borrowing instead
         if (bookAvailability.available_copies > 0) {
           return this.createBusinessResult(
             false, 
             undefined, 
             'Book is currently available for borrowing', 
             409
           );
         }

         // Calculate priority (next in queue)
         const bookReservations = await this.borrowingRepository.getReservationsByBook(request.book_id);
         const maxPriority = Math.max(0, ...bookReservations.map(r => r.priority));

         // Create reservation
         const reservation: Reservation = {
           id: uuidv4(),
           member_id: request.member_id,
           book_id: request.book_id,
           reserved_date: new Date().toISOString().split('T')[0],
           expiry_date: this.addDays(new Date(), this.RESERVATION_EXPIRY_DAYS),
           status: 'active',
           priority: maxPriority + 1,
           fulfilled_date: null,
           notes: request.notes || null,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString(),
         };

         await this.borrowingRepository.createReservation(reservation);
         return this.createBusinessResult(true, reservation, undefined, 201);

       } catch (error) {
         console.error('Error in BorrowingService.createReservation:', error);
         return this.createBusinessResult(false, undefined, 'Failed to create reservation', 500);
       }
     }

     async updateReservation(reservationId: string, request: UpdateReservationRequest): Promise<BusinessResult<Reservation>> {
       try {
         if (!this.isValidUUID(reservationId)) {
           return this.createBusinessResult(false, undefined, 'Invalid reservation ID format', 400);
         }

         const existingReservation = await this.borrowingRepository.getReservationById(reservationId);
         if (!existingReservation) {
           return this.createBusinessResult(false, undefined, 'Reservation not found', 404);
         }

         const updates: Partial<Reservation> = {
           ...request,
           updated_at: new Date().toISOString(),
         };

         if (request.status === 'fulfilled' && !existingReservation.fulfilled_date) {
           updates.fulfilled_date = new Date().toISOString().split('T')[0];
         }

         const success = await this.borrowingRepository.updateReservation(reservationId, updates);
         if (!success) {
           return this.createBusinessResult(false, undefined, 'Failed to update reservation', 500);
         }

         const updatedReservation = await this.borrowingRepository.getReservationById(reservationId);
         return this.createBusinessResult(true, updatedReservation!);

       } catch (error) {
         console.error('Error in BorrowingService.updateReservation:', error);
         return this.createBusinessResult(false, undefined, 'Failed to update reservation', 500);
       }
     }

     async cancelReservation(reservationId: string): Promise<BusinessResult<void>> {
       try {
         if (!this.isValidUUID(reservationId)) {
           return this.createBusinessResult(false, undefined, 'Invalid reservation ID format', 400);
         }

         const reservation = await this.borrowingRepository.getReservationById(reservationId);
         if (!reservation) {
           return this.createBusinessResult(false, undefined, 'Reservation not found', 404);
         }

         if (reservation.status !== 'active') {
           return this.createBusinessResult(
             false, 
             undefined, 
             'Can only cancel active reservations', 
             409
           );
         }

         const success = await this.borrowingRepository.updateReservation(reservationId, {
           status: 'cancelled',
           updated_at: new Date().toISOString(),
         });

         if (!success) {
           return this.createBusinessResult(false, undefined, 'Failed to cancel reservation', 500);
         }

         return this.createBusinessResult(true, undefined, undefined, 204);

       } catch (error) {
         console.error('Error in BorrowingService.cancelReservation:', error);
         return this.createBusinessResult(false, undefined, 'Failed to cancel reservation', 500);
       }
     }

     async getMemberReservations(memberId: string): Promise<BusinessResult<ReservationWithDetails[]>> {
       try {
         if (!this.isValidUUID(memberId)) {
           return this.createBusinessResult(false, undefined, 'Invalid member ID format', 400);
         }

         const reservations = await this.borrowingRepository.getReservationsByMember(memberId);
         return this.createBusinessResult(true, reservations);
       } catch (error) {
         console.error('Error in BorrowingService.getMemberReservations:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve member reservations', 500);
       }
     }

     async getBookReservations(bookId: string): Promise<BusinessResult<ReservationWithDetails[]>> {
       try {
         if (!this.isValidUUID(bookId)) {
           return this.createBusinessResult(false, undefined, 'Invalid book ID format', 400);
         }

         const reservations = await this.borrowingRepository.getReservationsByBook(bookId);
         return this.createBusinessResult(true, reservations);
       } catch (error) {
         console.error('Error in BorrowingService.getBookReservations:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve book reservations', 500);
       }
     }

     async searchReservations(filters: ReservationSearchFilters): Promise<BusinessResult<ReservationWithDetails[]>> {
       try {
         // Validate filters
         if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
           return this.createBusinessResult(false, undefined, 'Limit must be between 1 and 100', 400);
         }

         const reservations = await this.borrowingRepository.searchReservations(filters);
         return this.createBusinessResult(true, reservations);
       } catch (error) {
         console.error('Error in BorrowingService.searchReservations:', error);
         return this.createBusinessResult(false, undefined, 'Failed to search reservations', 500);
       }
     }
   ```

### Step 8: Implement Analytics and Validation Methods

1. **Add remaining methods:**
   ```typescript
     async getBorrowingStatistics(): Promise<BusinessResult<BorrowingStatistics>> {
       try {
         const statistics = await this.borrowingRepository.getBorrowingStatistics();
         return this.createBusinessResult(true, statistics);
       } catch (error) {
         console.error('Error in BorrowingService.getBorrowingStatistics:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve borrowing statistics', 500);
       }
     }

     async getMemberBorrowingSummary(memberId: string): Promise<BusinessResult<MemberBorrowingSummary>> {
       try {
         if (!this.isValidUUID(memberId)) {
           return this.createBusinessResult(false, undefined, 'Invalid member ID format', 400);
         }

         const summary = await this.borrowingRepository.getMemberBorrowingSummary(memberId);
         return this.createBusinessResult(true, summary);
       } catch (error) {
         console.error('Error in BorrowingService.getMemberBorrowingSummary:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve member summary', 500);
       }
     }

     async getFineStatistics(): Promise<BusinessResult<FineStatistics>> {
       try {
         const statistics = await this.borrowingRepository.getFineStatistics();
         return this.createBusinessResult(true, statistics);
       } catch (error) {
         console.error('Error in BorrowingService.getFineStatistics:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve fine statistics', 500);
       }
     }

     async getReservationStatistics(): Promise<BusinessResult<ReservationStatistics>> {
       try {
         const statistics = await this.borrowingRepository.getReservationStatistics();
         return this.createBusinessResult(true, statistics);
       } catch (error) {
         console.error('Error in BorrowingService.getReservationStatistics:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve reservation statistics', 500);
       }
     }

     async getBorrowingTrends(startDate: string, endDate: string): Promise<BusinessResult<BorrowingTrend[]>> {
       try {
         // Validate date format
         const startDateObj = new Date(startDate);
         const endDateObj = new Date(endDate);

         if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
           return this.createBusinessResult(false, undefined, 'Invalid date format', 400);
         }

         if (startDateObj > endDateObj) {
           return this.createBusinessResult(false, undefined, 'Start date must be before end date', 400);
         }

         const trends = await this.borrowingRepository.getBorrowingTrends(startDate, endDate);
         return this.createBusinessResult(true, trends);
       } catch (error) {
         console.error('Error in BorrowingService.getBorrowingTrends:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve borrowing trends', 500);
       }
     }

     async getBookAvailability(bookId: string): Promise<BusinessResult<BookAvailability>> {
       try {
         if (!this.isValidUUID(bookId)) {
           return this.createBusinessResult(false, undefined, 'Invalid book ID format', 400);
         }

         const availability = await this.borrowingRepository.getBookAvailability(bookId);
         return this.createBusinessResult(true, availability);
       } catch (error) {
         console.error('Error in BorrowingService.getBookAvailability:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve book availability', 500);
       }
     }

     async checkMemberEligibility(memberId: string): Promise<BusinessResult<MemberBorrowingEligibility>> {
       try {
         if (!this.isValidUUID(memberId)) {
           return this.createBusinessResult(false, undefined, 'Invalid member ID format', 400);
         }

         // Get base eligibility from member service
         const memberEligibility = await this.memberService.checkMemberEligibility(memberId);
         if (!memberEligibility.success) {
           return this.createBusinessResult(false, undefined, memberEligibility.error, memberEligibility.statusCode);
         }

         // Get detailed borrowing information
         const activeBorrowings = await this.borrowingRepository.searchBorrowings({
           member_id: memberId,
           status: 'active'
         });

         const overdueBorrowings = await this.borrowingRepository.searchBorrowings({
           member_id: memberId,
           status: 'overdue'
         });

         const unpaidFines = await this.borrowingRepository.getFinesByMember(memberId);
         const unpaidFinesFiltered = unpaidFines.filter(f => f.status === 'unpaid');

         const reservations = await this.borrowingRepository.getReservationsByMember(memberId);

         const totalUnpaidAmount = unpaidFinesFiltered.reduce((sum, fine) => sum + fine.amount, 0);

         const eligibilityDetails: MemberBorrowingEligibility = {
           ...memberEligibility.data!,
           borrowing_details: {
             active_borrowings: activeBorrowings,
             overdue_borrowings: overdueBorrowings,
             unpaid_fines: unpaidFinesFiltered,
             total_unpaid_amount: parseFloat(totalUnpaidAmount.toFixed(2)),
             reservations: reservations,
           }
         };

         return this.createBusinessResult(true, eligibilityDetails);

       } catch (error) {
         console.error('Error in BorrowingService.checkMemberEligibility:', error);
         return this.createBusinessResult(false, undefined, 'Failed to check member eligibility', 500);
       }
     }

     async validateBorrowingRequest(request: BorrowBookRequest): Promise<BusinessResult<BorrowingValidationResult>> {
       try {
         const errors: string[] = [];
         const warnings: string[] = [];
         const suggestedActions: string[] = [];

         // Validate member ID format
         if (!this.isValidUUID(request.member_id)) {
           errors.push('Invalid member ID format');
         }

         // Validate book ID format
         if (!this.isValidUUID(request.book_id)) {
           errors.push('Invalid book ID format');
         }

         if (errors.length > 0) {
           return this.createBusinessResult(true, {
             valid: false,
             errors,
             warnings,
             member_eligible: false,
             book_available: false,
             copy_available: false,
             suggested_actions: ['Verify IDs and try again']
           });
         }

         // Check member eligibility
         const memberEligibility = await this.checkMemberEligibility(request.member_id);
         const memberEligible = memberEligibility.success && memberEligibility.data?.can_borrow;

         if (!memberEligible) {
           errors.push('Member not eligible to borrow');
           suggestedActions.push(...(memberEligibility.data?.restrictions || []));
         }

         // Check book availability
         let bookAvailable = false;
         let copyAvailable = false;

         try {
           const bookAvailability = await this.borrowingRepository.getBookAvailability(request.book_id);
           bookAvailable = true;
           copyAvailable = bookAvailability.available_copies > 0;

           if (!copyAvailable) {
             errors.push('No available copies of this book');
             suggestedActions.push('Create a reservation');
             suggestedActions.push(`Next return date: ${bookAvailability.next_return_date || 'Unknown'}`);
           }
         } catch (error) {
           errors.push('Book not found');
           suggestedActions.push('Verify book ID');
         }

         const validationResult: BorrowingValidationResult = {
           valid: errors.length === 0,
           errors,
           warnings,
           member_eligible: memberEligible,
           book_available: bookAvailable,
           copy_available: copyAvailable,
           suggested_actions: suggestedActions
         };

         return this.createBusinessResult(true, validationResult);

       } catch (error) {
         console.error('Error in BorrowingService.validateBorrowingRequest:', error);
         return this.createBusinessResult(false, undefined, 'Failed to validate borrowing request', 500);
       }
     }

     async getOverdueNotifications(): Promise<BusinessResult<OverdueNotification[]>> {
       try {
         const notifications = await this.borrowingRepository.getOverdueNotifications();
         return this.createBusinessResult(true, notifications);
       } catch (error) {
         console.error('Error in BorrowingService.getOverdueNotifications:', error);
         return this.createBusinessResult(false, undefined, 'Failed to retrieve overdue notifications', 500);
       }
     }

     async processOverdueItems(): Promise<BusinessResult<{ updated: number; fines_assessed: number }>> {
       try {
         // Update overdue status
         const updated = await this.borrowingRepository.updateOverdueStatus();

         // Get newly overdue items to assess fines
         const overdueBorrowings = await this.borrowingRepository.getOverdueBorrowings();
         let finesAssessed = 0;

         for (const borrowing of overdueBorrowings) {
           // Check if fine already exists for this borrowing
           const existingFines = await this.borrowingRepository.getFinesByBorrowing(borrowing.id);
           const hasFine = existingFines.some(f => f.fine_type === 'overdue' && f.status === 'unpaid');

           if (!hasFine && borrowing.overdue_days > 0) {
             const fineAmount = borrowing.overdue_days * this.OVERDUE_FINE_PER_DAY;
             
             const fine: Fine = {
               id: uuidv4(),
               borrowing_id: borrowing.id,
               member_id: borrowing.member_id,
               fine_type: 'overdue',
               amount: parseFloat(fineAmount.toFixed(2)),
               assessed_date: new Date().toISOString().split('T')[0],
               paid_date: null,
               status: 'unpaid',
               description: `Overdue fine - ${borrowing.overdue_days} day(s) late`,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString(),
             };

             await this.borrowingRepository.createFine(fine);
             finesAssessed++;
           }
         }

         return this.createBusinessResult(true, { updated, fines_assessed });

       } catch (error) {
         console.error('Error in BorrowingService.processOverdueItems:', error);
         return this.createBusinessResult(false, undefined, 'Failed to process overdue items', 500);
       }
     }

     async updateOverdueStatus(): Promise<BusinessResult<number>> {
       try {
         const updated = await this.borrowingRepository.updateOverdueStatus();
         return this.createBusinessResult(true, updated);
       } catch (error) {
         console.error('Error in BorrowingService.updateOverdueStatus:', error);
         return this.createBusinessResult(false, undefined, 'Failed to update overdue status', 500);
       }
     }

     async processExpiredReservations(): Promise<BusinessResult<number>> {
       try {
         const expiredReservations = await this.borrowingRepository.searchReservations({
           status: 'active'
         });

         const now = new Date();
         let expired = 0;

         for (const reservation of expiredReservations) {
           const expiryDate = new Date(reservation.expiry_date);
           if (now > expiryDate) {
             await this.borrowingRepository.updateReservation(reservation.id, {
               status: 'expired',
               updated_at: now.toISOString(),
             });
             expired++;
           }
         }

         return this.createBusinessResult(true, expired);

       } catch (error) {
         console.error('Error in BorrowingService.processExpiredReservations:', error);
         return this.createBusinessResult(false, undefined, 'Failed to process expired reservations', 500);
       }
     }
   }
   ```

### Step 9: Test the Service

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Create a service test file:**
   ```bash
   cat > test-borrowing-service.js << 'EOF'
   import Database from 'better-sqlite3';
   import { BorrowingService } from './src/business/BorrowingService.js';
   import { BorrowingRepository } from './src/data/BorrowingRepository.js';
   import { MemberService } from './src/business/MemberService.js';
   import { BookService } from './src/business/BookService.js';

   // Mock services for testing (simplified)
   const mockMemberService = {
     checkMemberEligibility: async (memberId) => ({
       success: true,
       data: {
         member_id: memberId,
         member_name: 'Test Member',
         current_borrowed_count: 0,
         max_books: 3,
         overdue_count: 0,
         can_borrow: true,
         status: 'active',
         restrictions: []
       },
       statusCode: 200
     })
   };

   const mockBookService = {
     // Add mock methods as needed
   };

   async function testBorrowingService() {
     console.log('Testing BorrowingService...\n');

     try {
       // Connect to database
       const db = new Database('library.db');
       const borrowingRepo = new BorrowingRepository(db);
       const borrowingService = new BorrowingService(
         borrowingRepo,
         mockMemberService,
         mockBookService
       );

       // Test 1: Get borrowing statistics
       console.log('1. Testing borrowing statistics...');
       const stats = await borrowingService.getBorrowingStatistics();
       if (stats.success) {
         console.log('✅ Statistics retrieved:', {
           total: stats.data.total_borrowings,
           active: stats.data.active_borrowings,
           overdue: stats.data.overdue_borrowings
         });
       } else {
         console.log('❌ Statistics failed:', stats.error);
       }

       // Test 2: Get overdue borrowings
       console.log('\n2. Testing overdue borrowings...');
       const overdue = await borrowingService.getOverdueBorrowings();
       if (overdue.success) {
         console.log('✅ Overdue borrowings found:', overdue.data.length);
       } else {
         console.log('❌ Overdue borrowings failed:', overdue.error);
       }

       // Test 3: Validate borrowing request
       console.log('\n3. Testing borrowing validation...');
       const validation = await borrowingService.validateBorrowingRequest({
         member_id: '550e8400-e29b-41d4-a716-446655440000',
         book_id: '550e8400-e29b-41d4-a716-446655440001'
       });
       if (validation.success) {
         console.log('✅ Validation completed:', {
           valid: validation.data.valid,
           errors: validation.data.errors.length
         });
       } else {
         console.log('❌ Validation failed:', validation.error);
       }

       // Test 4: Get fine statistics
       console.log('\n4. Testing fine statistics...');
       const fineStats = await borrowingService.getFineStatistics();
       if (fineStats.success) {
         console.log('✅ Fine statistics:', {
           total: fineStats.data.total_fines_assessed,
           unpaid: fineStats.data.unpaid_fines
         });
       } else {
         console.log('❌ Fine statistics failed:', fineStats.error);
       }

       db.close();
       console.log('\n🎉 BorrowingService test completed!');

     } catch (error) {
       console.log('❌ Service test error:', error.message);
     }
   }

   testBorrowingService();
   EOF

   # Run service test
   npx tsx test-borrowing-service.js

   # Clean up
   rm test-borrowing-service.js
   ```

## Expected Results
- ✅ Complete IBorrowingService interface defined
- ✅ Full BorrowingService implementation
- ✅ Complex borrowing workflows (borrow, return, renew)
- ✅ Fine assessment and management
- ✅ Reservation system with priority queuing
- ✅ Member eligibility validation
- ✅ Book availability checking
- ✅ Analytics and reporting capabilities
- ✅ Overdue processing automation
- ✅ TypeScript compilation successful

## Service Features Implemented

### Core Workflows
- ✅ Book borrowing with validation
- ✅ Book return with fine assessment
- ✅ Borrowing renewal with restrictions
- ✅ Reservation creation and management

### Business Logic
- ✅ Member eligibility checking
- ✅ Book availability validation
- ✅ Fine calculation and assessment
- ✅ Overdue status management
- ✅ Reservation queue handling

### Integration Features
- ✅ Member service integration
- ✅ Book service integration
- ✅ Consistent error handling
- ✅ BusinessResult pattern

### Advanced Features
- ✅ Comprehensive analytics
- ✅ Borrowing trend analysis
- ✅ Automated overdue processing
- ✅ Expired reservation handling

## Troubleshooting

### If compilation fails:
1. Check that all imported services and types exist
2. Verify interface implementations are complete
3. Ensure proper error handling in all methods

### If business logic fails:
1. Test individual workflow steps
2. Verify database operations work correctly
3. Check member and book service integrations

### If validation fails:
1. Test validation logic with known data
2. Check UUID format validation
3. Verify business rule implementations

## Next Steps
After completing this task, proceed to Task 3.5: Create Borrowing Controller.

## Files Created
- ✅ `src/business/BorrowingService.ts` (complete implementation with 25+ methods)