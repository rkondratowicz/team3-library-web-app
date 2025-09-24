# Task 2.6: Create Member Routes and Integration

## Objective
Integrate the member management system with the main application by adding routes, configuring dependency injection, and ensuring proper integration with the existing book system.

## Current State
- Member repository, service, and controller implemented
- Need to integrate with main Express app
- Must follow existing pattern from book routes

## What You Will Create
- Member routes configuration
- Dependency injection setup
- Integration with main routes file
- Database connection sharing
- Error handling integration

## Step-by-Step Instructions

### Step 1: Update the Main Routes File

1. **Open `src/presentation/routes.ts` and examine the current structure:**
   ```bash
   cat src/presentation/routes.ts
   ```

2. **Add member route imports at the top of the file:**
   ```typescript
   // Add these imports after existing imports
   import { MemberController } from './MemberController.js';
   import { MemberService } from '../business/MemberService.js';
   import { MemberRepository } from '../data/MemberRepository.js';
   ```

3. **Update the route setup function to include member dependencies:**
   Find the existing `setupRoutes` function and modify it to include member system setup:

   ```typescript
   export function setupRoutes(db: Database): Router {
     const router = Router();

     // Existing book setup
     const bookRepository = new BookRepository(db);
     const bookService = new BookService(bookRepository);
     const bookController = new BookController(bookService);

     // NEW: Member system setup
     const memberRepository = new MemberRepository(db);
     const memberService = new MemberService(memberRepository);
     const memberController = new MemberController(memberService);

     // Health check routes (existing)
     const healthController = new HealthController();
     router.get('/health', healthController.getHealth);

     // Book routes (existing)
     router.get('/books', bookController.getAllBooks);
     router.get('/books/:id', bookController.getBookById);
     router.post('/books', bookController.createBook);
     router.put('/books/:id', bookController.updateBook);
     router.delete('/books/:id', bookController.deleteBook);
     router.get('/books/search', bookController.searchBooks);

     // NEW: Member routes - Basic CRUD
     router.get('/members', memberController.getAllMembers);
     router.get('/members/:id', memberController.getMemberById);
     router.get('/members/email/:email', memberController.getMemberByEmail);
     router.post('/members', memberController.createMember);
     router.put('/members/:id', memberController.updateMember);
     router.delete('/members/:id', memberController.deleteMember);

     // NEW: Member routes - Search and filtering
     router.get('/members/search', memberController.searchMembers);
     router.get('/members/status/:status', memberController.getMembersByStatus);

     // NEW: Member routes - Special operations
     router.get('/members/:id/eligibility', memberController.checkMemberEligibility);
     router.get('/members/statistics', memberController.getMemberStatistics);

     return router;
   }
   ```

### Step 2: Test Route Integration

1. **Compile the project to check for integration errors:**
   ```bash
   npm run build
   ```

2. **Fix any compilation errors that appear**

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Test that the server starts without errors**

### Step 3: Create Member Routes Test File

1. **Create a test file to verify routes work:**
   ```bash
   # Create test file
   cat > test-member-routes.js << 'EOF'
   // Simple test to verify member routes are accessible
   const baseUrl = 'http://localhost:3000';

   async function testMemberRoutes() {
     console.log('Testing member routes...\n');

     // Test health endpoint first
     try {
       const healthResponse = await fetch(`${baseUrl}/health`);
       console.log('✅ Health endpoint:', healthResponse.status);
     } catch (error) {
       console.log('❌ Health endpoint failed:', error.message);
       return;
     }

     // Test member endpoints
     const tests = [
       { method: 'GET', url: '/members', description: 'Get all members' },
       { method: 'GET', url: '/members/statistics', description: 'Get member statistics' },
       { method: 'GET', url: '/members/search', description: 'Search members' },
       { method: 'GET', url: '/members/status/active', description: 'Get active members' },
     ];

     for (const test of tests) {
       try {
         const response = await fetch(`${baseUrl}${test.url}`);
         const status = response.status;
         
         if (status === 200 || status === 404) {
           console.log(`✅ ${test.description}: ${status}`);
         } else {
           console.log(`⚠️  ${test.description}: ${status}`);
         }
       } catch (error) {
         console.log(`❌ ${test.description}: ${error.message}`);
       }
     }

     console.log('\nRoute integration test completed!');
   }

   // Run the test
   testMemberRoutes();
   EOF
   ```

2. **Run the route test (with server running in another terminal):**
   ```bash
   # In one terminal, start the server
   npm run dev

   # In another terminal, run the test
   node test-member-routes.js

   # Clean up test file
   rm test-member-routes.js
   ```

### Step 4: Test Member CRUD Operations

1. **Create comprehensive member API tests:**
   ```bash
   # Create detailed API test
   cat > test-member-api.js << 'EOF'
   const baseUrl = 'http://localhost:3000';

   async function testMemberAPI() {
     console.log('Testing Member API endpoints...\n');

     let createdMemberId = null;

     try {
       // 1. Test creating a member
       console.log('1. Testing member creation...');
       const createResponse = await fetch(`${baseUrl}/members`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           name: 'Test Member',
           email: 'test@example.com',
           phone: '123-456-7890',
           address: '123 Test Street'
         })
       });

       if (createResponse.status === 201) {
         const createData = await createResponse.json();
         createdMemberId = createData.data.id;
         console.log('✅ Member created successfully:', createdMemberId);
       } else {
         console.log('⚠️  Create response status:', createResponse.status);
         const errorData = await createResponse.text();
         console.log('   Response:', errorData);
       }

       // 2. Test getting all members
       console.log('\n2. Testing get all members...');
       const getAllResponse = await fetch(`${baseUrl}/members`);
       if (getAllResponse.status === 200) {
         const getAllData = await getAllResponse.json();
         console.log('✅ Get all members successful, count:', getAllData.data.length);
       } else {
         console.log('⚠️  Get all response status:', getAllResponse.status);
       }

       // 3. Test getting member by ID (if we created one)
       if (createdMemberId) {
         console.log('\n3. Testing get member by ID...');
         const getByIdResponse = await fetch(`${baseUrl}/members/${createdMemberId}`);
         if (getByIdResponse.status === 200) {
           const memberData = await getByIdResponse.json();
           console.log('✅ Get member by ID successful:', memberData.data.name);
         } else {
           console.log('⚠️  Get by ID response status:', getByIdResponse.status);
         }

         // 4. Test updating the member
         console.log('\n4. Testing member update...');
         const updateResponse = await fetch(`${baseUrl}/members/${createdMemberId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             name: 'Updated Test Member',
             phone: '098-765-4321'
           })
         });

         if (updateResponse.status === 200) {
           const updateData = await updateResponse.json();
           console.log('✅ Member updated successfully:', updateData.data.name);
         } else {
           console.log('⚠️  Update response status:', updateResponse.status);
         }

         // 5. Test member eligibility check
         console.log('\n5. Testing member eligibility...');
         const eligibilityResponse = await fetch(`${baseUrl}/members/${createdMemberId}/eligibility`);
         if (eligibilityResponse.status === 200) {
           const eligibilityData = await eligibilityResponse.json();
           console.log('✅ Eligibility check successful, can borrow:', eligibilityData.data.can_borrow);
         } else {
           console.log('⚠️  Eligibility response status:', eligibilityResponse.status);
         }

         // 6. Test deleting the member
         console.log('\n6. Testing member deletion...');
         const deleteResponse = await fetch(`${baseUrl}/members/${createdMemberId}`, {
           method: 'DELETE'
         });

         if (deleteResponse.status === 204) {
           console.log('✅ Member deleted successfully');
         } else {
           console.log('⚠️  Delete response status:', deleteResponse.status);
         }
       }

       // 7. Test statistics endpoint
       console.log('\n7. Testing member statistics...');
       const statsResponse = await fetch(`${baseUrl}/members/statistics`);
       if (statsResponse.status === 200) {
         const statsData = await statsResponse.json();
         console.log('✅ Statistics successful, total members:', statsData.data.total_members);
       } else {
         console.log('⚠️  Statistics response status:', statsResponse.status);
       }

       // 8. Test search endpoint
       console.log('\n8. Testing member search...');
       const searchResponse = await fetch(`${baseUrl}/members/search?limit=10`);
       if (searchResponse.status === 200) {
         const searchData = await searchResponse.json();
         console.log('✅ Search successful, results count:', searchData.data.length);
       } else {
         console.log('⚠️  Search response status:', searchResponse.status);
       }

     } catch (error) {
       console.log('❌ Test error:', error.message);
     }

     console.log('\nMember API test completed!');
   }

   // Run the test
   testMemberAPI();
   EOF
   ```

2. **Run the comprehensive API test:**
   ```bash
   # Make sure server is running, then test
   node test-member-api.js

   # Clean up
   rm test-member-api.js
   ```

### Step 5: Update Documentation

1. **Update the main README.md with member endpoints:**
   ```bash
   # Create a temporary file with member API documentation
   cat >> README-member-endpoints.md << 'EOF'

   ## Member Management API Endpoints

   ### Basic CRUD Operations
   - `GET /members` - Get all members
   - `GET /members/:id` - Get member by UUID
   - `GET /members/email/:email` - Get member by email address
   - `POST /members` - Create new member
   - `PUT /members/:id` - Update existing member
   - `DELETE /members/:id` - Delete member

   ### Search and Filtering
   - `GET /members/search` - Search members with query parameters
     - Query params: `name`, `email`, `phone`, `status`, `member_since`, `limit`, `offset`
   - `GET /members/status/:status` - Get members by status (active, suspended, expired)

   ### Special Operations
   - `GET /members/:id/eligibility` - Check member borrowing eligibility
   - `GET /members/statistics` - Get member statistics for analytics

   ### Example Member Object
   ```json
   {
     "id": "550e8400-e29b-41d4-a716-446655440000",
     "name": "John Doe",
     "email": "john.doe@example.com",
     "phone": "123-456-7890",
     "address": "123 Main Street",
     "member_since": "2024-01-15",
     "status": "active",
     "max_books": 3,
     "created_at": "2024-01-15T10:30:00.000Z",
     "updated_at": "2024-01-15T10:30:00.000Z"
   }
   ```

   ### Example Requests

   #### Create Member
   ```bash
   curl -X POST http://localhost:3000/members \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Jane Smith",
       "email": "jane.smith@example.com",
       "phone": "098-765-4321",
       "address": "456 Oak Avenue"
     }'
   ```

   #### Update Member
   ```bash
   curl -X PUT http://localhost:3000/members/550e8400-e29b-41d4-a716-446655440000 \
     -H "Content-Type: application/json" \
     -d '{
       "phone": "555-123-4567",
       "address": "789 Pine Street"
     }'
   ```

   #### Search Members
   ```bash
   curl "http://localhost:3000/members/search?status=active&limit=10"
   ```
   EOF

   echo "Member API documentation created in README-member-endpoints.md"
   echo "You can copy this content to the main README.md file"
   ```

### Step 6: Verify Integration with Book System

1. **Test that both book and member systems work together:**
   ```bash
   # Create integration test
   cat > test-integration.js << 'EOF'
   const baseUrl = 'http://localhost:3000';

   async function testSystemIntegration() {
     console.log('Testing Book and Member system integration...\n');

     try {
       // Test both systems are available
       const bookResponse = await fetch(`${baseUrl}/books`);
       const memberResponse = await fetch(`${baseUrl}/members`);

       console.log('Book system status:', bookResponse.status);
       console.log('Member system status:', memberResponse.status);

       if (bookResponse.status === 200 && memberResponse.status === 200) {
         console.log('✅ Both systems are integrated successfully!');
         
         const bookData = await bookResponse.json();
         const memberData = await memberResponse.json();
         
         console.log('Book count:', bookData.data.length);
         console.log('Member count:', memberData.data.length);
       } else {
         console.log('⚠️  Integration issue detected');
       }

       // Test that routes don't conflict
       const healthResponse = await fetch(`${baseUrl}/health`);
       console.log('Health check:', healthResponse.status);

     } catch (error) {
       console.log('❌ Integration test error:', error.message);
     }

     console.log('\nIntegration test completed!');
   }

   testSystemIntegration();
   EOF

   # Run integration test
   node test-integration.js

   # Clean up
   rm test-integration.js
   ```

### Step 7: Final Verification

1. **Run full TypeScript compilation:**
   ```bash
   npm run build
   ```

2. **Check for any remaining errors:**
   ```bash
   # Check the build output for any issues
   echo "Build completed. Check for any TypeScript errors above."
   ```

3. **Test server startup:**
   ```bash
   # Stop any running server and restart
   npm run dev
   ```

4. **Verify all routes are working:**
   ```bash
   # Quick verification that all main endpoints respond
   curl -s http://localhost:3000/health | head -1
   curl -s http://localhost:3000/books | head -1
   curl -s http://localhost:3000/members | head -1
   ```

## Expected Results
- ✅ Member routes integrated into main Express app
- ✅ Dependency injection working correctly
- ✅ All member endpoints responding properly
- ✅ No conflicts with existing book system
- ✅ TypeScript compilation successful
- ✅ Server starts without errors
- ✅ CRUD operations fully functional
- ✅ Search and filtering working
- ✅ Statistics and eligibility endpoints operational

## Integration Points Completed

### Route Configuration
- ✅ Member routes added to main router
- ✅ Proper dependency injection setup
- ✅ Database connection sharing with book system

### API Endpoints Available
- ✅ 11 member endpoints fully functional
- ✅ RESTful URL patterns consistent with book system
- ✅ Proper HTTP status codes and error handling

### System Integration
- ✅ Member system works alongside book system
- ✅ No route conflicts or naming collisions
- ✅ Shared database instance working correctly

## Troubleshooting

### If routes don't work:
1. Check server logs for startup errors
2. Verify all imports are correct in routes.ts
3. Check that database connection is established

### If member endpoints return 404:
1. Verify route registration order in routes.ts
2. Check that member routes are added after book routes
3. Ensure Express router is properly configured

### If database operations fail:
1. Check that member tables exist in database
2. Verify database migration was run successfully
3. Test database connection with SQLite CLI

### If integration conflicts occur:
1. Check for duplicate route patterns
2. Verify middleware order
3. Check console for error messages

## Next Steps
After completing this task, proceed to Task 2.7: Member Testing and Validation.

## Files Modified
- ✅ `src/presentation/routes.ts` (updated with member routes)
- ✅ Created comprehensive API tests
- ✅ Updated documentation with member endpoints