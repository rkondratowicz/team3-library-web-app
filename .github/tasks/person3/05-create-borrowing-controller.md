# Task 3.5: Create Borrowing Controller

## Objective
Implement the presentation layer for the borrowing system, including REST API endpoints, request/response handling, validation, and integration with the borrowing service layer.

## Current State
- Borrowing service implemented with complete business logic
- Need to create controller layer for API endpoints
- Must implement comprehensive request validation and error handling

## What You Will Create
- Complete BorrowingController class
- RESTful API endpoints for all borrowing operations
- Request validation and transformation
- Response formatting and error handling
- Integration with borrowing service layer

## Step-by-Step Instructions

### Step 1: Create the Borrowing Controller File

1. **Create `src/presentation/BorrowingController.ts`:**
   ```bash
   touch src/presentation/BorrowingController.ts
   ```

### Step 2: Add Imports and Controller Structure

1. **Add the following content to `src/presentation/BorrowingController.ts`:**
   ```typescript
   import { Request, Response } from 'express';
   import type { IBorrowingService } from '../business/BorrowingService.js';
   import type {
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
     BorrowingWithDetails,
     Borrowing,
     Fine,
     Reservation,
     ReservationWithDetails,
     BorrowingStatistics,
     MemberBorrowingSummary,
     FineStatistics,
     ReservationStatistics,
     BookAvailability,
     OverdueNotification,
     BorrowingTrend,
     MemberBorrowingEligibility,
     BorrowingValidationResult,
     BorrowingWorkflowResult,
   } from '../shared/types.js';

   export class BorrowingController {
     constructor(private borrowingService: IBorrowingService) {}

     // Helper method for validating UUID format
     private isValidUUID(id: string): boolean {
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
       return uuidRegex.test(id);
     }

     // Helper method for validating date format (YYYY-MM-DD)
     private isValidDate(dateString: string): boolean {
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if (!dateRegex.test(dateString)) return false;
       
       const date = new Date(dateString);
       return date instanceof Date && !isNaN(date.getTime()) && 
              date.toISOString().split('T')[0] === dateString;
     }

     // Helper method for standardized error responses
     private sendErrorResponse(res: Response, statusCode: number, message: string, details?: any): void {
       res.status(statusCode).json({
         success: false,
         error: message,
         details,
         timestamp: new Date().toISOString(),
       });
     }

     // Helper method for standardized success responses
     private sendSuccessResponse(res: Response, data: any, statusCode: number = 200, message?: string): void {
       res.status(statusCode).json({
         success: true,
         data,
         message,
         timestamp: new Date().toISOString(),
       });
     }

     // Helper method for parsing query parameters
     private parseQueryParams(query: any): any {
       const parsed: any = {};

       // Parse common query parameters
       if (query.limit) {
         const limit = parseInt(query.limit);
         if (!isNaN(limit) && limit > 0 && limit <= 100) {
           parsed.limit = limit;
         }
       }

       if (query.offset) {
         const offset = parseInt(query.offset);
         if (!isNaN(offset) && offset >= 0) {
           parsed.offset = offset;
         }
       }

       if (query.status) {
         parsed.status = query.status;
       }

       if (query.start_date && this.isValidDate(query.start_date)) {
         parsed.start_date = query.start_date;
       }

       if (query.end_date && this.isValidDate(query.end_date)) {
         parsed.end_date = query.end_date;
       }

       return parsed;
     }
   ```

### Step 3: Implement Borrowing Workflow Endpoints

1. **Add borrowing workflow methods:**
   ```typescript
     // POST /borrowings - Borrow a book
     borrowBook = async (req: Request, res: Response): Promise<void> => {
       try {
         // Validate request body
         const { member_id, book_id, loan_period_days, notes } = req.body;

         if (!member_id || !this.isValidUUID(member_id)) {
           this.sendErrorResponse(res, 400, 'Valid member_id is required');
           return;
         }

         if (!book_id || !this.isValidUUID(book_id)) {
           this.sendErrorResponse(res, 400, 'Valid book_id is required');
           return;
         }

         if (loan_period_days && (isNaN(loan_period_days) || loan_period_days < 1 || loan_period_days > 90)) {
           this.sendErrorResponse(res, 400, 'loan_period_days must be between 1 and 90 days');
           return;
         }

         const borrowRequest: BorrowBookRequest = {
           member_id,
           book_id,
           loan_period_days,
           notes: notes || null,
         };

         const result = await this.borrowingService.borrowBook(borrowRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Book borrowed successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to borrow book', result.data);
         }

       } catch (error) {
         console.error('Error in BorrowingController.borrowBook:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // PUT /borrowings/:id/return - Return a book
     returnBook = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;
         const { returned_date } = req.body;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid borrowing ID format');
           return;
         }

         if (returned_date && !this.isValidDate(returned_date)) {
           this.sendErrorResponse(res, 400, 'returned_date must be in YYYY-MM-DD format');
           return;
         }

         const returnRequest: ReturnBookRequest = {
           borrowing_id: id,
           returned_date,
         };

         const result = await this.borrowingService.returnBook(returnRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Book returned successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to return book', result.data);
         }

       } catch (error) {
         console.error('Error in BorrowingController.returnBook:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // PUT /borrowings/:id/renew - Renew a borrowing
     renewBorrowing = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;
         const { renewal_period_days, notes } = req.body;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid borrowing ID format');
           return;
         }

         if (renewal_period_days && (isNaN(renewal_period_days) || renewal_period_days < 1 || renewal_period_days > 90)) {
           this.sendErrorResponse(res, 400, 'renewal_period_days must be between 1 and 90 days');
           return;
         }

         const renewRequest: RenewBorrowingRequest = {
           borrowing_id: id,
           renewal_period_days,
           notes,
         };

         const result = await this.borrowingService.renewBorrowing(renewRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Borrowing renewed successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to renew borrowing', result.data);
         }

       } catch (error) {
         console.error('Error in BorrowingController.renewBorrowing:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 4: Implement Borrowing Query Endpoints

1. **Add borrowing query methods:**
   ```typescript
     // GET /borrowings - Get all borrowings with optional filters
     getAllBorrowings = async (req: Request, res: Response): Promise<void> => {
       try {
         const filters = this.parseQueryParams(req.query) as BorrowingSearchFilters;

         // Add specific borrowing filters
         if (req.query.member_id && this.isValidUUID(req.query.member_id as string)) {
           filters.member_id = req.query.member_id as string;
         }

         if (req.query.book_id && this.isValidUUID(req.query.book_id as string)) {
           filters.book_id = req.query.book_id as string;
         }

         if (req.query.overdue === 'true') {
           filters.overdue_only = true;
         }

         const result = await this.borrowingService.searchBorrowings(filters);

         if (result.success) {
           this.sendSuccessResponse(res, {
             borrowings: result.data,
             count: result.data?.length || 0,
             filters
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve borrowings');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getAllBorrowings:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /borrowings/:id - Get specific borrowing
     getBorrowingById = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid borrowing ID format');
           return;
         }

         const result = await this.borrowingService.getBorrowingById(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Borrowing not found');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getBorrowingById:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /members/:id/borrowings - Get member's borrowings
     getMemberBorrowings = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.borrowingService.getMemberBorrowings(id);

         if (result.success) {
           this.sendSuccessResponse(res, {
             member_id: id,
             borrowings: result.data,
             count: result.data?.length || 0
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member borrowings');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getMemberBorrowings:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /borrowings/overdue - Get overdue borrowings
     getOverdueBorrowings = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.getOverdueBorrowings();

         if (result.success) {
           this.sendSuccessResponse(res, {
             overdue_borrowings: result.data,
             count: result.data?.length || 0,
             generated_at: new Date().toISOString()
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve overdue borrowings');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getOverdueBorrowings:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 5: Implement Fine Management Endpoints

1. **Add fine management methods:**
   ```typescript
     // POST /fines - Assess a fine
     assessFine = async (req: Request, res: Response): Promise<void> => {
       try {
         const { borrowing_id, fine_type, amount, description } = req.body;

         if (!borrowing_id || !this.isValidUUID(borrowing_id)) {
           this.sendErrorResponse(res, 400, 'Valid borrowing_id is required');
           return;
         }

         if (!fine_type || !['late_return', 'damage', 'lost_item', 'other'].includes(fine_type)) {
           this.sendErrorResponse(res, 400, 'Valid fine_type is required (late_return, damage, lost_item, other)');
           return;
         }

         if (!amount || isNaN(amount) || amount <= 0) {
           this.sendErrorResponse(res, 400, 'Valid positive amount is required');
           return;
         }

         const fineRequest: AssessFineRequest = {
           borrowing_id,
           fine_type,
           amount: parseFloat(parseFloat(amount).toFixed(2)),
           description,
         };

         const result = await this.borrowingService.assessFine(fineRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Fine assessed successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to assess fine');
         }

       } catch (error) {
         console.error('Error in BorrowingController.assessFine:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // PUT /fines/:id - Update fine status
     updateFine = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;
         const { status, paid_date } = req.body;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid fine ID format');
           return;
         }

         if (!status || !['paid', 'unpaid', 'waived'].includes(status)) {
           this.sendErrorResponse(res, 400, 'Valid status is required (paid, unpaid, waived)');
           return;
         }

         if (paid_date && !this.isValidDate(paid_date)) {
           this.sendErrorResponse(res, 400, 'paid_date must be in YYYY-MM-DD format');
           return;
         }

         const updateRequest: UpdateFineRequest = {
           status,
           paid_date,
         };

         const result = await this.borrowingService.updateFine(id, updateRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Fine updated successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to update fine');
         }

       } catch (error) {
         console.error('Error in BorrowingController.updateFine:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /members/:id/fines - Get member's fines
     getMemberFines = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.borrowingService.getFinesByMember(id);

         if (result.success) {
           const totalUnpaid = result.data?.filter(f => f.status === 'unpaid')
             .reduce((sum, fine) => sum + fine.amount, 0) || 0;

           this.sendSuccessResponse(res, {
             member_id: id,
             fines: result.data,
             count: result.data?.length || 0,
             total_unpaid_amount: parseFloat(totalUnpaid.toFixed(2))
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member fines');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getMemberFines:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /fines - Search fines
     searchFines = async (req: Request, res: Response): Promise<void> => {
       try {
         const filters = this.parseQueryParams(req.query) as FineSearchFilters;

         // Add specific fine filters
         if (req.query.member_id && this.isValidUUID(req.query.member_id as string)) {
           filters.member_id = req.query.member_id as string;
         }

         if (req.query.fine_type) {
           filters.fine_type = req.query.fine_type as string;
         }

         if (req.query.min_amount) {
           const minAmount = parseFloat(req.query.min_amount as string);
           if (!isNaN(minAmount)) filters.min_amount = minAmount;
         }

         if (req.query.max_amount) {
           const maxAmount = parseFloat(req.query.max_amount as string);
           if (!isNaN(maxAmount)) filters.max_amount = maxAmount;
         }

         const result = await this.borrowingService.searchFines(filters);

         if (result.success) {
           const totalAmount = result.data?.reduce((sum, fine) => sum + fine.amount, 0) || 0;

           this.sendSuccessResponse(res, {
             fines: result.data,
             count: result.data?.length || 0,
             total_amount: parseFloat(totalAmount.toFixed(2)),
             filters
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to search fines');
         }

       } catch (error) {
         console.error('Error in BorrowingController.searchFines:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 6: Implement Reservation Management Endpoints

1. **Add reservation management methods:**
   ```typescript
     // POST /reservations - Create a reservation
     createReservation = async (req: Request, res: Response): Promise<void> => {
       try {
         const { member_id, book_id, notes } = req.body;

         if (!member_id || !this.isValidUUID(member_id)) {
           this.sendErrorResponse(res, 400, 'Valid member_id is required');
           return;
         }

         if (!book_id || !this.isValidUUID(book_id)) {
           this.sendErrorResponse(res, 400, 'Valid book_id is required');
           return;
         }

         const reservationRequest: CreateReservationRequest = {
           member_id,
           book_id,
           notes,
         };

         const result = await this.borrowingService.createReservation(reservationRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Reservation created successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to create reservation');
         }

       } catch (error) {
         console.error('Error in BorrowingController.createReservation:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // PUT /reservations/:id - Update reservation
     updateReservation = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;
         const { status, notes } = req.body;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid reservation ID format');
           return;
         }

         if (status && !['active', 'fulfilled', 'cancelled', 'expired'].includes(status)) {
           this.sendErrorResponse(res, 400, 'Valid status is required (active, fulfilled, cancelled, expired)');
           return;
         }

         const updateRequest: UpdateReservationRequest = {
           status,
           notes,
         };

         const result = await this.borrowingService.updateReservation(id, updateRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data, result.statusCode, 'Reservation updated successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to update reservation');
         }

       } catch (error) {
         console.error('Error in BorrowingController.updateReservation:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // DELETE /reservations/:id - Cancel reservation
     cancelReservation = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid reservation ID format');
           return;
         }

         const result = await this.borrowingService.cancelReservation(id);

         if (result.success) {
           this.sendSuccessResponse(res, null, 204, 'Reservation cancelled successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to cancel reservation');
         }

       } catch (error) {
         console.error('Error in BorrowingController.cancelReservation:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /members/:id/reservations - Get member's reservations
     getMemberReservations = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.borrowingService.getMemberReservations(id);

         if (result.success) {
           this.sendSuccessResponse(res, {
             member_id: id,
             reservations: result.data,
             count: result.data?.length || 0
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member reservations');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getMemberReservations:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /books/:id/reservations - Get book's reservations
     getBookReservations = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid book ID format');
           return;
         }

         const result = await this.borrowingService.getBookReservations(id);

         if (result.success) {
           this.sendSuccessResponse(res, {
             book_id: id,
             reservations: result.data,
             count: result.data?.length || 0,
             queue_position: result.data?.map((r, index) => ({ ...r, queue_position: index + 1 })) || []
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve book reservations');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getBookReservations:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /reservations - Search reservations
     searchReservations = async (req: Request, res: Response): Promise<void> => {
       try {
         const filters = this.parseQueryParams(req.query) as ReservationSearchFilters;

         // Add specific reservation filters
         if (req.query.member_id && this.isValidUUID(req.query.member_id as string)) {
           filters.member_id = req.query.member_id as string;
         }

         if (req.query.book_id && this.isValidUUID(req.query.book_id as string)) {
           filters.book_id = req.query.book_id as string;
         }

         const result = await this.borrowingService.searchReservations(filters);

         if (result.success) {
           this.sendSuccessResponse(res, {
             reservations: result.data,
             count: result.data?.length || 0,
             filters
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to search reservations');
         }

       } catch (error) {
         console.error('Error in BorrowingController.searchReservations:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 7: Implement Analytics and Utility Endpoints

1. **Add analytics and utility methods:**
   ```typescript
     // GET /analytics/borrowings - Get borrowing statistics
     getBorrowingStatistics = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.getBorrowingStatistics();

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve borrowing statistics');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getBorrowingStatistics:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /analytics/fines - Get fine statistics
     getFineStatistics = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.getFineStatistics();

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve fine statistics');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getFineStatistics:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /analytics/reservations - Get reservation statistics
     getReservationStatistics = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.getReservationStatistics();

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve reservation statistics');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getReservationStatistics:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /analytics/borrowing-trends - Get borrowing trends
     getBorrowingTrends = async (req: Request, res: Response): Promise<void> => {
       try {
         const { start_date, end_date } = req.query;

         if (!start_date || !this.isValidDate(start_date as string)) {
           this.sendErrorResponse(res, 400, 'Valid start_date (YYYY-MM-DD) is required');
           return;
         }

         if (!end_date || !this.isValidDate(end_date as string)) {
           this.sendErrorResponse(res, 400, 'Valid end_date (YYYY-MM-DD) is required');
           return;
         }

         const result = await this.borrowingService.getBorrowingTrends(
           start_date as string,
           end_date as string
         );

         if (result.success) {
           this.sendSuccessResponse(res, {
             trends: result.data,
             period: {
               start_date: start_date as string,
               end_date: end_date as string
             }
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve borrowing trends');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getBorrowingTrends:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /members/:id/borrowing-summary - Get member borrowing summary
     getMemberBorrowingSummary = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.borrowingService.getMemberBorrowingSummary(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member borrowing summary');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getMemberBorrowingSummary:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /books/:id/availability - Get book availability
     getBookAvailability = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid book ID format');
           return;
         }

         const result = await this.borrowingService.getBookAvailability(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve book availability');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getBookAvailability:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /members/:id/eligibility - Check member borrowing eligibility
     checkMemberEligibility = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.borrowingService.checkMemberEligibility(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to check member eligibility');
         }

       } catch (error) {
         console.error('Error in BorrowingController.checkMemberEligibility:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // POST /borrowings/validate - Validate borrowing request
     validateBorrowingRequest = async (req: Request, res: Response): Promise<void> => {
       try {
         const { member_id, book_id } = req.body;

         if (!member_id || !this.isValidUUID(member_id)) {
           this.sendErrorResponse(res, 400, 'Valid member_id is required');
           return;
         }

         if (!book_id || !this.isValidUUID(book_id)) {
           this.sendErrorResponse(res, 400, 'Valid book_id is required');
           return;
         }

         const validationRequest: BorrowBookRequest = {
           member_id,
           book_id,
         };

         const result = await this.borrowingService.validateBorrowingRequest(validationRequest);

         if (result.success) {
           this.sendSuccessResponse(res, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to validate borrowing request');
         }

       } catch (error) {
         console.error('Error in BorrowingController.validateBorrowingRequest:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // GET /notifications/overdue - Get overdue notifications
     getOverdueNotifications = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.getOverdueNotifications();

         if (result.success) {
           this.sendSuccessResponse(res, {
             notifications: result.data,
             count: result.data?.length || 0,
             generated_at: new Date().toISOString()
           });
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve overdue notifications');
         }

       } catch (error) {
         console.error('Error in BorrowingController.getOverdueNotifications:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // POST /admin/process-overdue - Process overdue items (admin only)
     processOverdueItems = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.processOverdueItems();

         if (result.success) {
           this.sendSuccessResponse(res, result.data, 200, 'Overdue items processed successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to process overdue items');
         }

       } catch (error) {
         console.error('Error in BorrowingController.processOverdueItems:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // POST /admin/update-overdue-status - Update overdue status (admin only)
     updateOverdueStatus = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.updateOverdueStatus();

         if (result.success) {
           this.sendSuccessResponse(res, { 
             updated_count: result.data 
           }, 200, 'Overdue status updated successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to update overdue status');
         }

       } catch (error) {
         console.error('Error in BorrowingController.updateOverdueStatus:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     // POST /admin/process-expired-reservations - Process expired reservations (admin only)
     processExpiredReservations = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.borrowingService.processExpiredReservations();

         if (result.success) {
           this.sendSuccessResponse(res, { 
             expired_count: result.data 
           }, 200, 'Expired reservations processed successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to process expired reservations');
         }

       } catch (error) {
         console.error('Error in BorrowingController.processExpiredReservations:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   }
   ```

### Step 8: Test the Controller

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Create a controller test file:**
   ```bash
   cat > test-borrowing-controller.js << 'EOF'
   import Database from 'better-sqlite3';
   import { BorrowingController } from './src/presentation/BorrowingController.js';
   import { BorrowingService } from './src/business/BorrowingService.js';
   import { BorrowingRepository } from './src/data/BorrowingRepository.js';

   // Mock services for testing
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

   const mockBookService = {};

   // Mock Express request/response objects
   function createMockReq(params = {}, query = {}, body = {}) {
     return { params, query, body };
   }

   function createMockRes() {
     const res = {
       statusCode: 200,
       data: null,
       status: function(code) {
         this.statusCode = code;
         return this;
       },
       json: function(data) {
         this.data = data;
         return this;
       }
     };
     return res;
   }

   async function testBorrowingController() {
     console.log('Testing BorrowingController...\n');

     try {
       // Connect to database
       const db = new Database('library.db');
       const borrowingRepo = new BorrowingRepository(db);
       const borrowingService = new BorrowingService(
         borrowingRepo,
         mockMemberService,
         mockBookService
       );
       const controller = new BorrowingController(borrowingService);

       // Test 1: Get borrowing statistics
       console.log('1. Testing borrowing statistics endpoint...');
       const req1 = createMockReq();
       const res1 = createMockRes();
       await controller.getBorrowingStatistics(req1, res1);
       console.log('✅ Statistics status:', res1.statusCode);
       console.log('   Response success:', res1.data?.success);

       // Test 2: Get overdue borrowings
       console.log('\n2. Testing overdue borrowings endpoint...');
       const req2 = createMockReq();
       const res2 = createMockRes();
       await controller.getOverdueBorrowings(req2, res2);
       console.log('✅ Overdue status:', res2.statusCode);
       console.log('   Response success:', res2.data?.success);

       // Test 3: Validate borrowing request
       console.log('\n3. Testing borrowing validation endpoint...');
       const req3 = createMockReq({}, {}, {
         member_id: '550e8400-e29b-41d4-a716-446655440000',
         book_id: '550e8400-e29b-41d4-a716-446655440001'
       });
       const res3 = createMockRes();
       await controller.validateBorrowingRequest(req3, res3);
       console.log('✅ Validation status:', res3.statusCode);
       console.log('   Response success:', res3.data?.success);

       // Test 4: Test invalid UUID handling
       console.log('\n4. Testing invalid UUID handling...');
       const req4 = createMockReq({ id: 'invalid-uuid' });
       const res4 = createMockRes();
       await controller.getBorrowingById(req4, res4);
       console.log('✅ Invalid UUID status:', res4.statusCode);
       console.log('   Expected 400, got:', res4.statusCode);

       // Test 5: Search borrowings with filters
       console.log('\n5. Testing borrowing search with filters...');
       const req5 = createMockReq({}, { 
         limit: '10', 
         status: 'active',
         member_id: '550e8400-e29b-41d4-a716-446655440000'
       });
       const res5 = createMockRes();
       await controller.getAllBorrowings(req5, res5);
       console.log('✅ Search status:', res5.statusCode);
       console.log('   Response success:', res5.data?.success);

       db.close();
       console.log('\n🎉 BorrowingController test completed!');

     } catch (error) {
       console.log('❌ Controller test error:', error.message);
     }
   }

   testBorrowingController();
   EOF

   # Run controller test
   npx tsx test-borrowing-controller.js

   # Clean up
   rm test-borrowing-controller.js
   ```

## Expected Results
- ✅ Complete BorrowingController class implemented
- ✅ 25+ RESTful API endpoints for all borrowing operations
- ✅ Comprehensive request validation and error handling
- ✅ Consistent response formatting with success/error patterns
- ✅ Integration with borrowing service layer
- ✅ Proper UUID and date format validation
- ✅ TypeScript compilation successful

## API Endpoints Implemented

### Borrowing Workflow
- ✅ `POST /borrowings` - Borrow a book
- ✅ `PUT /borrowings/:id/return` - Return a book
- ✅ `PUT /borrowings/:id/renew` - Renew a borrowing

### Borrowing Queries
- ✅ `GET /borrowings` - Get all borrowings with filters
- ✅ `GET /borrowings/:id` - Get specific borrowing
- ✅ `GET /members/:id/borrowings` - Get member's borrowings
- ✅ `GET /borrowings/overdue` - Get overdue borrowings

### Fine Management
- ✅ `POST /fines` - Assess a fine
- ✅ `PUT /fines/:id` - Update fine status
- ✅ `GET /members/:id/fines` - Get member's fines
- ✅ `GET /fines` - Search fines

### Reservation Management
- ✅ `POST /reservations` - Create a reservation
- ✅ `PUT /reservations/:id` - Update reservation
- ✅ `DELETE /reservations/:id` - Cancel reservation
- ✅ `GET /members/:id/reservations` - Get member's reservations
- ✅ `GET /books/:id/reservations` - Get book's reservations
- ✅ `GET /reservations` - Search reservations

### Analytics & Utilities
- ✅ `GET /analytics/borrowings` - Borrowing statistics
- ✅ `GET /analytics/fines` - Fine statistics
- ✅ `GET /analytics/reservations` - Reservation statistics
- ✅ `GET /analytics/borrowing-trends` - Borrowing trends
- ✅ `GET /members/:id/borrowing-summary` - Member summary
- ✅ `GET /books/:id/availability` - Book availability
- ✅ `GET /members/:id/eligibility` - Member eligibility
- ✅ `POST /borrowings/validate` - Validate borrowing request
- ✅ `GET /notifications/overdue` - Overdue notifications
- ✅ `POST /admin/process-overdue` - Process overdue items
- ✅ `POST /admin/update-overdue-status` - Update overdue status
- ✅ `POST /admin/process-expired-reservations` - Process expired reservations

## Request/Response Features
- ✅ Comprehensive input validation
- ✅ UUID format validation
- ✅ Date format validation (YYYY-MM-DD)
- ✅ Query parameter parsing
- ✅ Consistent error responses
- ✅ Standardized success responses
- ✅ Proper HTTP status codes
- ✅ Request/response timestamps

## Troubleshooting

### If compilation fails:
1. Check that BorrowingService interface matches implementation
2. Verify all type imports are correct
3. Ensure Express types are properly imported

### If validation fails:
1. Test UUID validation with known valid/invalid UUIDs
2. Test date validation with various formats
3. Check query parameter parsing logic

### If integration fails:
1. Verify service layer integration
2. Test with mock services first
3. Check error handling paths

## Next Steps
After completing this task, proceed to Task 3.6: Create Borrowing Routes and Integration.

## Files Created
- ✅ `src/presentation/BorrowingController.ts` (complete implementation with 25+ endpoints)