# Task 3.6: Create Borrowing Routes and Integration

## Objective
Implement the routing layer for the borrowing system and integrate all components (controller, service, repository) into the main application. This includes route definitions, middleware setup, error handling, and complete system integration.

## Current State
- Borrowing controller implemented with all API endpoints
- Need to create route configurations
- Must integrate borrowing system with main application
- Need to ensure proper middleware and error handling

## What You Will Create
- Complete borrowing route definitions
- Integration with main routes configuration
- Middleware setup for authentication/authorization
- Error handling middleware
- Integration with existing systems
- API documentation structure

## Step-by-Step Instructions

### Step 1: Create Borrowing Routes File

1. **Create `src/presentation/routes/borrowingRoutes.ts`:**
   ```bash
   mkdir -p src/presentation/routes
   touch src/presentation/routes/borrowingRoutes.ts
   ```

### Step 2: Implement Core Borrowing Routes

1. **Add the following content to `src/presentation/routes/borrowingRoutes.ts`:**
   ```typescript
   import { Router } from 'express';
   import type { BorrowingController } from '../BorrowingController.js';

   export function createBorrowingRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     // ========================================
     // BORROWING WORKFLOW ROUTES
     // ========================================

     /**
      * @route POST /api/borrowings
      * @desc Borrow a book
      * @access Private (Member/Staff)
      * @body { member_id: string, book_id: string, loan_period_days?: number, notes?: string }
      */
     router.post('/', borrowingController.borrowBook);

     /**
      * @route PUT /api/borrowings/:id/return
      * @desc Return a borrowed book
      * @access Private (Member/Staff)
      * @params { id: string } - borrowing ID
      * @body { returned_date?: string }
      */
     router.put('/:id/return', borrowingController.returnBook);

     /**
      * @route PUT /api/borrowings/:id/renew
      * @desc Renew a borrowing
      * @access Private (Member/Staff)
      * @params { id: string } - borrowing ID
      * @body { renewal_period_days?: number, notes?: string }
      */
     router.put('/:id/renew', borrowingController.renewBorrowing);

     // ========================================
     // BORROWING QUERY ROUTES
     // ========================================

     /**
      * @route GET /api/borrowings
      * @desc Get all borrowings with optional filters
      * @access Private (Staff)
      * @query { 
      *   limit?: number, 
      *   offset?: number, 
      *   status?: string, 
      *   member_id?: string, 
      *   book_id?: string,
      *   overdue?: boolean,
      *   start_date?: string,
      *   end_date?: string
      * }
      */
     router.get('/', borrowingController.getAllBorrowings);

     /**
      * @route GET /api/borrowings/overdue
      * @desc Get all overdue borrowings
      * @access Private (Staff)
      */
     router.get('/overdue', borrowingController.getOverdueBorrowings);

     /**
      * @route GET /api/borrowings/:id
      * @desc Get specific borrowing by ID
      * @access Private (Member/Staff)
      * @params { id: string } - borrowing ID
      */
     router.get('/:id', borrowingController.getBorrowingById);

     /**
      * @route POST /api/borrowings/validate
      * @desc Validate a borrowing request before processing
      * @access Private (Member/Staff)
      * @body { member_id: string, book_id: string }
      */
     router.post('/validate', borrowingController.validateBorrowingRequest);

     return router;
   }

   export function createMemberBorrowingRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/members/:id/borrowings
      * @desc Get all borrowings for a specific member
      * @access Private (Member[own]/Staff)
      * @params { id: string } - member ID
      */
     router.get('/:id/borrowings', borrowingController.getMemberBorrowings);

     /**
      * @route GET /api/members/:id/borrowing-summary
      * @desc Get borrowing summary for a specific member
      * @access Private (Member[own]/Staff)
      * @params { id: string } - member ID
      */
     router.get('/:id/borrowing-summary', borrowingController.getMemberBorrowingSummary);

     /**
      * @route GET /api/members/:id/eligibility
      * @desc Check member's borrowing eligibility
      * @access Private (Member[own]/Staff)
      * @params { id: string } - member ID
      */
     router.get('/:id/eligibility', borrowingController.checkMemberEligibility);

     return router;
   }

   export function createBookBorrowingRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/books/:id/availability
      * @desc Get availability information for a specific book
      * @access Public
      * @params { id: string } - book ID
      */
     router.get('/:id/availability', borrowingController.getBookAvailability);

     return router;
   }
   ```

### Step 3: Create Fine Management Routes

1. **Add to `src/presentation/routes/borrowingRoutes.ts` (continue in same file):**
   ```typescript
   export function createFineRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     // ========================================
     // FINE MANAGEMENT ROUTES
     // ========================================

     /**
      * @route POST /api/fines
      * @desc Assess a fine for a borrowing
      * @access Private (Staff only)
      * @body { borrowing_id: string, fine_type: string, amount: number, description?: string }
      */
     router.post('/', borrowingController.assessFine);

     /**
      * @route PUT /api/fines/:id
      * @desc Update fine status (mark as paid, waived, etc.)
      * @access Private (Staff only)
      * @params { id: string } - fine ID
      * @body { status: string, paid_date?: string }
      */
     router.put('/:id', borrowingController.updateFine);

     /**
      * @route GET /api/fines
      * @desc Search fines with filters
      * @access Private (Staff only)
      * @query { 
      *   limit?: number, 
      *   offset?: number, 
      *   status?: string, 
      *   member_id?: string,
      *   fine_type?: string,
      *   min_amount?: number,
      *   max_amount?: number,
      *   start_date?: string,
      *   end_date?: string
      * }
      */
     router.get('/', borrowingController.searchFines);

     return router;
   }

   export function createMemberFineRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/members/:id/fines
      * @desc Get all fines for a specific member
      * @access Private (Member[own]/Staff)
      * @params { id: string } - member ID
      */
     router.get('/:id/fines', borrowingController.getMemberFines);

     return router;
   }
   ```

### Step 4: Create Reservation Management Routes

1. **Add to `src/presentation/routes/borrowingRoutes.ts` (continue in same file):**
   ```typescript
   export function createReservationRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     // ========================================
     // RESERVATION MANAGEMENT ROUTES
     // ========================================

     /**
      * @route POST /api/reservations
      * @desc Create a book reservation
      * @access Private (Member/Staff)
      * @body { member_id: string, book_id: string, notes?: string }
      */
     router.post('/', borrowingController.createReservation);

     /**
      * @route PUT /api/reservations/:id
      * @desc Update reservation status
      * @access Private (Member[own]/Staff)
      * @params { id: string } - reservation ID
      * @body { status?: string, notes?: string }
      */
     router.put('/:id', borrowingController.updateReservation);

     /**
      * @route DELETE /api/reservations/:id
      * @desc Cancel a reservation
      * @access Private (Member[own]/Staff)
      * @params { id: string } - reservation ID
      */
     router.delete('/:id', borrowingController.cancelReservation);

     /**
      * @route GET /api/reservations
      * @desc Search reservations with filters
      * @access Private (Staff)
      * @query { 
      *   limit?: number, 
      *   offset?: number, 
      *   status?: string, 
      *   member_id?: string,
      *   book_id?: string,
      *   start_date?: string,
      *   end_date?: string
      * }
      */
     router.get('/', borrowingController.searchReservations);

     return router;
   }

   export function createMemberReservationRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/members/:id/reservations
      * @desc Get all reservations for a specific member
      * @access Private (Member[own]/Staff)
      * @params { id: string } - member ID
      */
     router.get('/:id/reservations', borrowingController.getMemberReservations);

     return router;
   }

   export function createBookReservationRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/books/:id/reservations
      * @desc Get all reservations for a specific book
      * @access Private (Staff)
      * @params { id: string } - book ID
      */
     router.get('/:id/reservations', borrowingController.getBookReservations);

     return router;
   }
   ```

### Step 5: Create Analytics and Admin Routes

1. **Add to `src/presentation/routes/borrowingRoutes.ts` (continue in same file):**
   ```typescript
   export function createAnalyticsRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     // ========================================
     // ANALYTICS ROUTES
     // ========================================

     /**
      * @route GET /api/analytics/borrowings
      * @desc Get borrowing statistics and metrics
      * @access Private (Staff)
      */
     router.get('/borrowings', borrowingController.getBorrowingStatistics);

     /**
      * @route GET /api/analytics/fines
      * @desc Get fine statistics and metrics
      * @access Private (Staff)
      */
     router.get('/fines', borrowingController.getFineStatistics);

     /**
      * @route GET /api/analytics/reservations
      * @desc Get reservation statistics and metrics
      * @access Private (Staff)
      */
     router.get('/reservations', borrowingController.getReservationStatistics);

     /**
      * @route GET /api/analytics/borrowing-trends
      * @desc Get borrowing trends over time
      * @access Private (Staff)
      * @query { start_date: string, end_date: string }
      */
     router.get('/borrowing-trends', borrowingController.getBorrowingTrends);

     return router;
   }

   export function createNotificationRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     /**
      * @route GET /api/notifications/overdue
      * @desc Get overdue notifications
      * @access Private (Staff)
      */
     router.get('/overdue', borrowingController.getOverdueNotifications);

     return router;
   }

   export function createAdminRoutes(borrowingController: BorrowingController): Router {
     const router = Router();

     // ========================================
     // ADMIN ROUTES (Staff/Admin only)
     // ========================================

     /**
      * @route POST /api/admin/process-overdue
      * @desc Process overdue items and assess fines
      * @access Private (Admin only)
      */
     router.post('/process-overdue', borrowingController.processOverdueItems);

     /**
      * @route POST /api/admin/update-overdue-status
      * @desc Update overdue status for all borrowings
      * @access Private (Admin only)
      */
     router.post('/update-overdue-status', borrowingController.updateOverdueStatus);

     /**
      * @route POST /api/admin/process-expired-reservations
      * @desc Process expired reservations
      * @access Private (Admin only)
      */
     router.post('/process-expired-reservations', borrowingController.processExpiredReservations);

     return router;
   }
   ```

### Step 6: Create Main Integration File

1. **Create `src/presentation/routes/index.ts`:**
   ```bash
   touch src/presentation/routes/index.ts
   ```

2. **Add integration configuration:**
   ```typescript
   import { Router } from 'express';
   import type { BorrowingController } from '../BorrowingController.js';
   import type { BookController } from '../BookController.js';
   import type { HealthController } from '../HealthController.js';
   import {
     createBorrowingRoutes,
     createMemberBorrowingRoutes,
     createBookBorrowingRoutes,
     createFineRoutes,
     createMemberFineRoutes,
     createReservationRoutes,
     createMemberReservationRoutes,
     createBookReservationRoutes,
     createAnalyticsRoutes,
     createNotificationRoutes,
     createAdminRoutes,
   } from './borrowingRoutes.js';

   // Error handling middleware
   export function createErrorHandler() {
     return (error: any, req: any, res: any, next: any) => {
       console.error('API Error:', {
         method: req.method,
         url: req.url,
         error: error.message,
         stack: error.stack,
         timestamp: new Date().toISOString(),
       });

       // Don't leak error details in production
       const isDevelopment = process.env.NODE_ENV !== 'production';
       
       res.status(error.statusCode || 500).json({
         success: false,
         error: error.message || 'Internal server error',
         details: isDevelopment ? error.stack : undefined,
         timestamp: new Date().toISOString(),
       });
     };
   }

   // Request logging middleware
   export function createRequestLogger() {
     return (req: any, res: any, next: any) => {
       const start = Date.now();
       
       res.on('finish', () => {
         const duration = Date.now() - start;
         console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
       });
       
       next();
     };
   }

   // CORS middleware (basic)
   export function createCorsMiddleware() {
     return (req: any, res: any, next: any) => {
       res.header('Access-Control-Allow-Origin', '*');
       res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
       res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
       
       if (req.method === 'OPTIONS') {
         res.sendStatus(200);
       } else {
         next();
       }
     };
   }

   // Rate limiting middleware (basic)
   export function createRateLimiter() {
     const requests = new Map();
     const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
     const MAX_REQUESTS = 100; // requests per window

     return (req: any, res: any, next: any) => {
       const ip = req.ip || req.connection.remoteAddress;
       const now = Date.now();
       
       if (!requests.has(ip)) {
         requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
         return next();
       }

       const requestData = requests.get(ip);
       
       if (now > requestData.resetTime) {
         requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
         return next();
       }

       if (requestData.count > MAX_REQUESTS) {
         return res.status(429).json({
           success: false,
           error: 'Too many requests',
           message: 'Rate limit exceeded. Try again later.',
           timestamp: new Date().toISOString(),
         });
       }

       requestData.count++;
       next();
     };
   }

   // Main router setup function
   export function setupRoutes(
     borrowingController: BorrowingController,
     bookController: BookController,
     healthController: HealthController
   ): Router {
     const router = Router();

     // Apply middleware
     router.use(createRequestLogger());
     router.use(createCorsMiddleware());
     router.use(createRateLimiter());

     // Health check route
     router.get('/health', healthController.checkHealth);

     // ========================================
     // API ROUTE GROUPS
     // ========================================

     // Borrowing management routes
     router.use('/borrowings', createBorrowingRoutes(borrowingController));
     
     // Fine management routes
     router.use('/fines', createFineRoutes(borrowingController));
     
     // Reservation management routes
     router.use('/reservations', createReservationRoutes(borrowingController));
     
     // Analytics routes
     router.use('/analytics', createAnalyticsRoutes(borrowingController));
     
     // Notification routes
     router.use('/notifications', createNotificationRoutes(borrowingController));
     
     // Admin routes
     router.use('/admin', createAdminRoutes(borrowingController));

     // Integration with existing routes
     // These routes extend existing controllers with borrowing functionality
     
     // Member-related borrowing routes
     const memberBorrowingRoutes = createMemberBorrowingRoutes(borrowingController);
     const memberFineRoutes = createMemberFineRoutes(borrowingController);
     const memberReservationRoutes = createMemberReservationRoutes(borrowingController);
     
     // Book-related borrowing routes
     const bookBorrowingRoutes = createBookBorrowingRoutes(borrowingController);
     const bookReservationRoutes = createBookReservationRoutes(borrowingController);

     // Apply member extensions (these should integrate with existing member routes)
     router.use('/members', memberBorrowingRoutes);
     router.use('/members', memberFineRoutes);
     router.use('/members', memberReservationRoutes);

     // Apply book extensions (these should integrate with existing book routes)  
     router.use('/books', bookBorrowingRoutes);
     router.use('/books', bookReservationRoutes);

     // Existing book routes (maintain existing functionality)
     router.use('/books', createBookRoutes(bookController));

     // Error handling (must be last)
     router.use(createErrorHandler());

     return router;
   }

   // Helper function to create book routes (placeholder for existing book routes)
   function createBookRoutes(bookController: BookController): Router {
     const router = Router();
     
     // This should match existing book routes from routes.ts
     router.get('/', bookController.getAllBooks);
     router.get('/:id', bookController.getBookById);
     router.post('/', bookController.createBook);
     router.put('/:id', bookController.updateBook);
     router.delete('/:id', bookController.deleteBook);
     
     return router;
   }
   ```

### Step 7: Update Main Routes Configuration

1. **Update `src/presentation/routes.ts` to integrate borrowing system:**
   ```typescript
   import { Router } from 'express';
   import Database from 'better-sqlite3';

   // Import existing controllers
   import { BookController } from './BookController.js';
   import { HealthController } from './HealthController.js';

   // Import new borrowing system
   import { BorrowingController } from './BorrowingController.js';
   import { BorrowingService } from '../business/BorrowingService.js';
   import { BorrowingRepository } from '../data/BorrowingRepository.js';

   // Import existing services (assume these exist from Person 1 and Person 2 work)
   import { BookService } from '../business/BookService.js';
   import { BookRepository } from '../data/BookRepository.js';

   // Import route setup
   import { setupRoutes } from './routes/index.js';

   export function createRoutes(db: Database.Database): Router {
     const router = Router();

     // ========================================
     // REPOSITORY LAYER SETUP
     // ========================================
     
     // Existing repositories
     const bookRepository = new BookRepository(db);
     const borrowingRepository = new BorrowingRepository(db);

     // ========================================
     // SERVICE LAYER SETUP
     // ========================================
     
     // Existing services
     const bookService = new BookService(bookRepository);
     
     // Mock member service (this should be implemented by Person 2)
     const mockMemberService = {
       checkMemberEligibility: async (memberId: string) => ({
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

     // New borrowing service
     const borrowingService = new BorrowingService(
       borrowingRepository,
       mockMemberService, // Replace with actual MemberService when available
       bookService
     );

     // ========================================
     // CONTROLLER LAYER SETUP
     // ========================================
     
     // Existing controllers
     const bookController = new BookController(bookService);
     const healthController = new HealthController();
     
     // New borrowing controller
     const borrowingController = new BorrowingController(borrowingService);

     // ========================================
     // ROUTE SETUP
     // ========================================
     
     // Use the integrated route setup
     router.use('/api', setupRoutes(borrowingController, bookController, healthController));

     // Legacy route support (optional - for backward compatibility)
     router.use('/health', healthController.checkHealth);

     return router;
   }
   ```

### Step 8: Update Application Entry Point

1. **Update `src/app.ts` to use new routing system:**
   ```typescript
   import express from 'express';
   import Database from 'better-sqlite3';
   import { createRoutes } from './presentation/routes.js';

   const app = express();

   // Middleware
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true }));

   // Trust proxy for rate limiting and IP detection
   app.set('trust proxy', true);

   // Database setup
   const db = new Database('library.db');

   // Enable WAL mode for better concurrency
   db.pragma('journal_mode = WAL');

   // Routes
   app.use(createRoutes(db));

   // Global error handler for uncaught errors
   app.use((error: any, req: any, res: any, next: any) => {
     console.error('Uncaught application error:', error);
     
     if (res.headersSent) {
       return next(error);
     }

     res.status(500).json({
       success: false,
       error: 'Internal server error',
       timestamp: new Date().toISOString(),
     });
   });

   // 404 handler
   app.use('*', (req, res) => {
     res.status(404).json({
       success: false,
       error: 'Endpoint not found',
       message: `${req.method} ${req.originalUrl} not found`,
       timestamp: new Date().toISOString(),
     });
   });

   // Graceful shutdown
   const gracefulShutdown = () => {
     console.log('Shutting down gracefully...');
     db.close();
     process.exit(0);
   };

   process.on('SIGTERM', gracefulShutdown);
   process.on('SIGINT', gracefulShutdown);

   export default app;
   ```

### Step 9: Create API Documentation Structure

1. **Create API documentation file:**
   ```bash
   mkdir -p docs
   cat > docs/borrowing-api.md << 'EOF'
   # Borrowing System API Documentation

   ## Base URL
   All API endpoints are prefixed with `/api`

   ## Authentication
   Most endpoints require authentication. Include appropriate authentication headers.

   ## Response Format
   All responses follow this structure:
   ```json
   {
     "success": boolean,
     "data": any,
     "message": string,
     "timestamp": string,
     "error": string (if success: false)
   }
   ```

   ## Borrowing Management

   ### Borrow a Book
   - **POST** `/borrowings`
   - **Body**: `{ member_id: string, book_id: string, loan_period_days?: number, notes?: string }`
   - **Response**: Borrowing workflow result

   ### Return a Book
   - **PUT** `/borrowings/:id/return`
   - **Body**: `{ returned_date?: string }`
   - **Response**: Return workflow result with fine information

   ### Renew a Borrowing
   - **PUT** `/borrowings/:id/renew`
   - **Body**: `{ renewal_period_days?: number, notes?: string }`
   - **Response**: Renewal workflow result

   ### Get Borrowings
   - **GET** `/borrowings`
   - **Query**: `limit, offset, status, member_id, book_id, overdue, start_date, end_date`
   - **Response**: List of borrowings with details

   ### Get Overdue Borrowings
   - **GET** `/borrowings/overdue`
   - **Response**: List of overdue borrowings

   ## Fine Management

   ### Assess Fine
   - **POST** `/fines`
   - **Body**: `{ borrowing_id: string, fine_type: string, amount: number, description?: string }`
   - **Response**: Created fine

   ### Update Fine
   - **PUT** `/fines/:id`
   - **Body**: `{ status: string, paid_date?: string }`
   - **Response**: Updated fine

   ### Search Fines
   - **GET** `/fines`
   - **Query**: `limit, offset, status, member_id, fine_type, min_amount, max_amount`
   - **Response**: List of fines

   ## Reservation Management

   ### Create Reservation
   - **POST** `/reservations`
   - **Body**: `{ member_id: string, book_id: string, notes?: string }`
   - **Response**: Created reservation

   ### Update Reservation
   - **PUT** `/reservations/:id`
   - **Body**: `{ status?: string, notes?: string }`
   - **Response**: Updated reservation

   ### Cancel Reservation
   - **DELETE** `/reservations/:id`
   - **Response**: Success confirmation

   ## Analytics

   ### Borrowing Statistics
   - **GET** `/analytics/borrowings`
   - **Response**: Comprehensive borrowing statistics

   ### Fine Statistics
   - **GET** `/analytics/fines`
   - **Response**: Fine statistics and metrics

   ### Borrowing Trends
   - **GET** `/analytics/borrowing-trends`
   - **Query**: `start_date, end_date`
   - **Response**: Borrowing trends over time

   ## Member Integration

   ### Member Borrowings
   - **GET** `/members/:id/borrowings`
   - **Response**: All borrowings for member

   ### Member Eligibility
   - **GET** `/members/:id/eligibility`
   - **Response**: Member borrowing eligibility details

   ### Member Fines
   - **GET** `/members/:id/fines`
   - **Response**: All fines for member

   ## Book Integration

   ### Book Availability
   - **GET** `/books/:id/availability`
   - **Response**: Book availability information

   ### Book Reservations
   - **GET** `/books/:id/reservations`
   - **Response**: All reservations for book

   ## Admin Operations

   ### Process Overdue Items
   - **POST** `/admin/process-overdue`
   - **Response**: Processing results

   ### Update Overdue Status
   - **POST** `/admin/update-overdue-status`
   - **Response**: Update count

   ### Process Expired Reservations
   - **POST** `/admin/process-expired-reservations`
   - **Response**: Expiry processing results
   EOF
   ```

### Step 10: Test the Complete Integration

1. **Compile the TypeScript:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors**

3. **Create integration test:**
   ```bash
   cat > test-integration.js << 'EOF'
   import request from 'supertest';
   import Database from 'better-sqlite3';
   import app from './src/app.js';

   async function testIntegration() {
     console.log('Testing complete borrowing system integration...\n');

     try {
       // Test 1: Health check
       console.log('1. Testing health endpoint...');
       const healthResponse = await request(app)
         .get('/api/health')
         .expect(200);
       console.log('✅ Health check:', healthResponse.body.success);

       // Test 2: Get borrowing statistics
       console.log('\n2. Testing borrowing statistics...');
       const statsResponse = await request(app)
         .get('/api/analytics/borrowings')
         .expect(200);
       console.log('✅ Borrowing statistics:', statsResponse.body.success);

       // Test 3: Get overdue borrowings
       console.log('\n3. Testing overdue borrowings...');
       const overdueResponse = await request(app)
         .get('/api/borrowings/overdue')
         .expect(200);
       console.log('✅ Overdue borrowings:', overdueResponse.body.success);

       // Test 4: Validate borrowing request
       console.log('\n4. Testing borrowing validation...');
       const validationResponse = await request(app)
         .post('/api/borrowings/validate')
         .send({
           member_id: '550e8400-e29b-41d4-a716-446655440000',
           book_id: '550e8400-e29b-41d4-a716-446655440001'
         })
         .expect(200);
       console.log('✅ Borrowing validation:', validationResponse.body.success);

       // Test 5: Get fine statistics
       console.log('\n5. Testing fine statistics...');
       const fineStatsResponse = await request(app)
         .get('/api/analytics/fines')
         .expect(200);
       console.log('✅ Fine statistics:', fineStatsResponse.body.success);

       // Test 6: Test invalid endpoint (should return 404)
       console.log('\n6. Testing 404 handling...');
       const notFoundResponse = await request(app)
         .get('/api/nonexistent')
         .expect(404);
       console.log('✅ 404 handling:', !notFoundResponse.body.success);

       // Test 7: Test rate limiting (if applicable)
       console.log('\n7. Testing rate limiting...');
       let rateLimitReached = false;
       for (let i = 0; i < 5; i++) {
         const response = await request(app)
           .get('/api/health');
         if (response.status === 429) {
           rateLimitReached = true;
           break;
         }
       }
       console.log('✅ Rate limiting configured:', rateLimitReached ? 'Yes' : 'No');

       console.log('\n🎉 Integration test completed successfully!');

     } catch (error) {
       console.log('❌ Integration test error:', error.message);
     }
   }

   // Install supertest if not available
   // npm install --save-dev supertest @types/supertest

   testIntegration();
   EOF

   # Install supertest for testing
   npm install --save-dev supertest @types/supertest

   # Run integration test
   npx tsx test-integration.js

   # Clean up
   rm test-integration.js
   ```

### Step 11: Start the Complete Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test some endpoints manually:**
   ```bash
   # Test health
   curl http://localhost:3000/api/health

   # Test borrowing statistics
   curl http://localhost:3000/api/analytics/borrowings

   # Test overdue borrowings
   curl http://localhost:3000/api/borrowings/overdue

   # Test borrowing validation
   curl -X POST http://localhost:3000/api/borrowings/validate \
     -H "Content-Type: application/json" \
     -d '{"member_id":"550e8400-e29b-41d4-a716-446655440000","book_id":"550e8400-e29b-41d4-a716-446655440001"}'
   ```

## Expected Results
- ✅ Complete routing system with 25+ endpoints
- ✅ Proper integration with existing systems
- ✅ Middleware for CORS, rate limiting, error handling
- ✅ Comprehensive API documentation structure
- ✅ Working development server
- ✅ Integration tests passing
- ✅ All TypeScript compilation successful

## Route Categories Implemented

### Core Borrowing System
- ✅ Borrowing workflow routes (borrow, return, renew)
- ✅ Borrowing query routes (search, filter, get by ID)
- ✅ Borrowing validation routes

### Fine Management
- ✅ Fine assessment and update routes
- ✅ Fine search and filtering routes
- ✅ Member fine management routes

### Reservation System
- ✅ Reservation creation and management routes
- ✅ Reservation search and filtering routes
- ✅ Member and book reservation routes

### Analytics & Reporting
- ✅ Borrowing statistics and trends
- ✅ Fine statistics and metrics
- ✅ Reservation analytics

### Integration Routes
- ✅ Member borrowing integration
- ✅ Book availability integration
- ✅ Cross-system data access

### Administrative
- ✅ Overdue processing routes
- ✅ System maintenance routes
- ✅ Notification management routes

## Middleware Features
- ✅ Request logging
- ✅ CORS handling
- ✅ Rate limiting
- ✅ Error handling
- ✅ Request validation

## Troubleshooting

### If compilation fails:
1. Check all import paths are correct
2. Verify interface implementations match
3. Ensure all dependencies are properly imported

### If routes don't work:
1. Check route registration order
2. Verify middleware is properly applied
3. Test individual controller methods

### If integration fails:
1. Check database connection
2. Verify service dependencies
3. Test with simplified mock services

## Next Steps
After completing this task, proceed to Task 3.7: Create Borrowing Testing and Validation.

## Files Created
- ✅ `src/presentation/routes/borrowingRoutes.ts` (complete routing system)
- ✅ `src/presentation/routes/index.ts` (integration and middleware)
- ✅ Updated `src/presentation/routes.ts` (main route configuration)
- ✅ Updated `src/app.ts` (application integration)
- ✅ `docs/borrowing-api.md` (API documentation)