# Task 2.5: Create Member Controller

## Objective
Implement the API controller for member management with comprehensive RESTful endpoints, input validation, error handling, and proper HTTP status codes.

## Current State
- Member service implemented with business logic
- Need API controller layer following BookController pattern
- Must implement all CRUD endpoints plus search functionality

## What You Will Create
- Complete MemberController class
- RESTful API endpoints for member operations
- Request/response validation
- Proper error handling and status codes
- Search and filtering endpoints

## Step-by-Step Instructions

### Step 1: Create the Member Controller File

1. **Create `src/presentation/MemberController.ts`:**
   ```bash
   touch src/presentation/MemberController.ts
   ```

### Step 2: Add Imports and Initial Setup

1. **Add the following content to `src/presentation/MemberController.ts`:**
   ```typescript
   import type { Request, Response } from 'express';
   import type { IMemberService } from '../business/MemberService.js';
   import type {
     CreateMemberRequest,
     UpdateMemberRequest,
     MemberSearchFilters,
     Member,
   } from '../shared/types.js';

   export class MemberController {
     constructor(private memberService: IMemberService) {}

     // Helper method to validate UUID format
     private isValidUUID(id: string): boolean {
       const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
       return uuidRegex.test(id);
     }

     // Helper method to send consistent error responses
     private sendErrorResponse(res: Response, statusCode: number, message: string): void {
       res.status(statusCode).json({
         success: false,
         error: message,
         timestamp: new Date().toISOString(),
       });
     }

     // Helper method to send success responses
     private sendSuccessResponse<T>(res: Response, statusCode: number, data?: T, message?: string): void {
       const response: any = {
         success: true,
         timestamp: new Date().toISOString(),
       };

       if (data !== undefined) {
         response.data = data;
       }

       if (message) {
         response.message = message;
       }

       res.status(statusCode).json(response);
     }
   ```

### Step 3: Implement Basic CRUD Endpoints

1. **Add getAllMembers method:**
   ```typescript
     /**
      * GET /members
      * Get all members
      */
     getAllMembers = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.memberService.getAllMembers();

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve members');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.getAllMembers:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     /**
      * GET /members/:id
      * Get member by ID
      */
     getMemberById = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         // Validate UUID format
         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.memberService.getMemberById(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.getMemberById:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     /**
      * GET /members/email/:email
      * Get member by email address
      */
     getMemberByEmail = async (req: Request, res: Response): Promise<void> => {
       try {
         const { email } = req.params;

         if (!email || email.trim().length === 0) {
           this.sendErrorResponse(res, 400, 'Email address is required');
           return;
         }

         const result = await this.memberService.getMemberByEmail(decodeURIComponent(email));

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to retrieve member');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.getMemberByEmail:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 4: Implement Member Creation

1. **Add createMember method:**
   ```typescript
     /**
      * POST /members
      * Create a new member
      */
     createMember = async (req: Request, res: Response): Promise<void> => {
       try {
         const memberData: CreateMemberRequest = req.body;

         // Basic request validation
         if (!memberData || typeof memberData !== 'object') {
           this.sendErrorResponse(res, 400, 'Invalid request body');
           return;
         }

         // Validate required fields
         if (!memberData.name || typeof memberData.name !== 'string') {
           this.sendErrorResponse(res, 400, 'Name is required and must be a string');
           return;
         }

         if (!memberData.email || typeof memberData.email !== 'string') {
           this.sendErrorResponse(res, 400, 'Email is required and must be a string');
           return;
         }

         // Validate optional fields types
         if (memberData.phone && typeof memberData.phone !== 'string') {
           this.sendErrorResponse(res, 400, 'Phone must be a string');
           return;
         }

         if (memberData.address && typeof memberData.address !== 'string') {
           this.sendErrorResponse(res, 400, 'Address must be a string');
           return;
         }

         const result = await this.memberService.createMember(memberData);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data, 'Member created successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to create member');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.createMember:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 5: Implement Member Updates

1. **Add updateMember method:**
   ```typescript
     /**
      * PUT /members/:id
      * Update an existing member
      */
     updateMember = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;
         const updates: UpdateMemberRequest = req.body;

         // Validate UUID format
         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         // Basic request validation
         if (!updates || typeof updates !== 'object') {
           this.sendErrorResponse(res, 400, 'Invalid request body');
           return;
         }

         // Validate field types if provided
         if (updates.name !== undefined && typeof updates.name !== 'string') {
           this.sendErrorResponse(res, 400, 'Name must be a string');
           return;
         }

         if (updates.email !== undefined && typeof updates.email !== 'string') {
           this.sendErrorResponse(res, 400, 'Email must be a string');
           return;
         }

         if (updates.phone !== undefined && updates.phone !== null && typeof updates.phone !== 'string') {
           this.sendErrorResponse(res, 400, 'Phone must be a string or null');
           return;
         }

         if (updates.address !== undefined && updates.address !== null && typeof updates.address !== 'string') {
           this.sendErrorResponse(res, 400, 'Address must be a string or null');
           return;
         }

         if (updates.status !== undefined && typeof updates.status !== 'string') {
           this.sendErrorResponse(res, 400, 'Status must be a string');
           return;
         }

         if (updates.max_books !== undefined && typeof updates.max_books !== 'number') {
           this.sendErrorResponse(res, 400, 'Max books must be a number');
           return;
         }

         // Check if any valid updates were provided
         const validUpdateFields = ['name', 'email', 'phone', 'address', 'status', 'max_books'];
         const hasValidUpdates = Object.keys(updates).some(key => validUpdateFields.includes(key));

         if (!hasValidUpdates) {
           this.sendErrorResponse(res, 400, 'No valid update fields provided');
           return;
         }

         const result = await this.memberService.updateMember(id, updates);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data, 'Member updated successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to update member');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.updateMember:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 6: Implement Member Deletion

1. **Add deleteMember method:**
   ```typescript
     /**
      * DELETE /members/:id
      * Delete a member
      */
     deleteMember = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         // Validate UUID format
         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.memberService.deleteMember(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, undefined, 'Member deleted successfully');
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to delete member');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.deleteMember:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 7: Implement Search and Filter Endpoints

1. **Add search methods:**
   ```typescript
     /**
      * GET /members/search
      * Search members with filters
      */
     searchMembers = async (req: Request, res: Response): Promise<void> => {
       try {
         const filters: MemberSearchFilters = {};

         // Extract query parameters
         if (req.query.name && typeof req.query.name === 'string') {
           filters.name = req.query.name.trim();
         }

         if (req.query.email && typeof req.query.email === 'string') {
           filters.email = req.query.email.trim();
         }

         if (req.query.phone && typeof req.query.phone === 'string') {
           filters.phone = req.query.phone.trim();
         }

         if (req.query.status && typeof req.query.status === 'string') {
           filters.status = req.query.status.trim();
         }

         if (req.query.member_since && typeof req.query.member_since === 'string') {
           filters.member_since = req.query.member_since.trim();
         }

         // Handle numeric parameters
         if (req.query.limit) {
           const limit = parseInt(req.query.limit as string, 10);
           if (isNaN(limit) || limit < 1 || limit > 100) {
             this.sendErrorResponse(res, 400, 'Limit must be a number between 1 and 100');
             return;
           }
           filters.limit = limit;
         }

         if (req.query.offset) {
           const offset = parseInt(req.query.offset as string, 10);
           if (isNaN(offset) || offset < 0) {
             this.sendErrorResponse(res, 400, 'Offset must be a non-negative number');
             return;
           }
           filters.offset = offset;
         }

         const result = await this.memberService.searchMembers(filters);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to search members');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.searchMembers:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     /**
      * GET /members/status/:status
      * Get members by status
      */
     getMembersByStatus = async (req: Request, res: Response): Promise<void> => {
       try {
         const { status } = req.params;

         if (!status || status.trim().length === 0) {
           this.sendErrorResponse(res, 400, 'Status is required');
           return;
         }

         const result = await this.memberService.getMembersByStatus(status.trim());

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to get members by status');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.getMembersByStatus:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   ```

### Step 8: Add Member Eligibility and Statistics Endpoints

1. **Add eligibility and statistics methods:**
   ```typescript
     /**
      * GET /members/:id/eligibility
      * Check member borrowing eligibility
      */
     checkMemberEligibility = async (req: Request, res: Response): Promise<void> => {
       try {
         const { id } = req.params;

         // Validate UUID format
         if (!this.isValidUUID(id)) {
           this.sendErrorResponse(res, 400, 'Invalid member ID format');
           return;
         }

         const result = await this.memberService.checkMemberEligibility(id);

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to check member eligibility');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.checkMemberEligibility:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };

     /**
      * GET /members/statistics
      * Get member statistics for analytics
      */
     getMemberStatistics = async (req: Request, res: Response): Promise<void> => {
       try {
         const result = await this.memberService.getMemberStatistics();

         if (result.success) {
           this.sendSuccessResponse(res, result.statusCode, result.data);
         } else {
           this.sendErrorResponse(res, result.statusCode, result.error || 'Failed to get member statistics');
         }
       } catch (error) {
         console.error('Unexpected error in MemberController.getMemberStatistics:', error);
         this.sendErrorResponse(res, 500, 'Internal server error');
       }
     };
   }
   ```

### Step 9: Test the Controller

1. **Compile TypeScript to check for errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Test basic controller structure (you can create a simple test file):**
   ```bash
   # Create a simple test to verify the controller compiles
   cat > test-member-controller.ts << 'EOF'
   import { MemberController } from './src/presentation/MemberController.js';
   import type { IMemberService } from './src/business/MemberService.js';

   // Mock service for testing
   const mockService: IMemberService = {} as IMemberService;
   const controller = new MemberController(mockService);

   console.log('MemberController created successfully');
   EOF
   
   # Compile the test
   npx tsc test-member-controller.ts --moduleResolution node --module esnext --target es2020
   
   # Clean up
   rm test-member-controller.ts test-member-controller.js
   ```

## Expected Results
- ✅ Complete MemberController class implemented
- ✅ All CRUD endpoints functional (GET, POST, PUT, DELETE)
- ✅ Search and filtering endpoints working
- ✅ Member eligibility endpoint ready
- ✅ Statistics endpoint for analytics
- ✅ Proper input validation on all endpoints
- ✅ Consistent error handling and HTTP status codes
- ✅ TypeScript compilation successful

## API Endpoints Created

### Basic CRUD
- `GET /members` - Get all members
- `GET /members/:id` - Get member by ID  
- `GET /members/email/:email` - Get member by email
- `POST /members` - Create new member
- `PUT /members/:id` - Update member
- `DELETE /members/:id` - Delete member

### Search and Filtering
- `GET /members/search` - Search members with query parameters
- `GET /members/status/:status` - Get members by status

### Special Operations
- `GET /members/:id/eligibility` - Check borrowing eligibility
- `GET /members/statistics` - Get member statistics

## Troubleshooting

### If compilation fails:
1. Check that all imported types exist in types.js
2. Verify MemberService interface is imported correctly
3. Check all method signatures match expected types

### If validation logic fails:
1. Test UUID validation with known valid/invalid UUIDs
2. Verify request body validation logic
3. Check query parameter parsing

### If error handling fails:
1. Test error response format consistency
2. Verify all error cases return proper HTTP status codes
3. Check console logging for debugging information

## Next Steps
After completing this task, proceed to Task 2.6: Create Member Routes and Integration.

## Files Created
- ✅ `src/presentation/MemberController.ts` (new, complete implementation)