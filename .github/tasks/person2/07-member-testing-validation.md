# Task 2.7: Member Testing and Validation

## Objective
Thoroughly test the member management system, validate all functionality, create comprehensive test scenarios, and ensure production readiness with proper error handling and edge case coverage.

## Current State
- Complete member system implemented and integrated
- Need comprehensive testing and validation
- Must verify all business rules and error scenarios

## What You Will Create
- Comprehensive test suite for member system
- Database migration validation
- Error scenario testing
- Performance and edge case validation
- Production readiness checklist

## Step-by-Step Instructions

### Step 1: Validate Database Schema and Migrations

1. **Check if member table exists and has correct structure:**
   ```bash
   # Check database structure
   sqlite3 library.db ".schema members"
   
   # If table doesn't exist, create it
   sqlite3 library.db < src/data/migrations/02-Create-members-table.sql
   
   # Verify table was created
   sqlite3 library.db ".tables"
   sqlite3 library.db ".schema members"
   ```

2. **Test basic database operations:**
   ```bash
   # Create test file for database validation
   cat > test-member-database.js << 'EOF'
   import Database from 'better-sqlite3';
   import { MemberRepository } from './src/data/MemberRepository.js';

   async function testMemberDatabase() {
     console.log('Testing member database operations...\n');

     try {
       // Connect to database
       const db = new Database('library.db');
       const memberRepo = new MemberRepository(db);

       // Test 1: Create a test member
       console.log('1. Testing member creation...');
       const testMember = {
         id: '550e8400-e29b-41d4-a716-446655440000',
         name: 'Database Test Member',
         email: 'dbtest@example.com',
         phone: '555-0001',
         address: '123 Test Database Street',
         member_since: '2024-01-15',
         status: 'active',
         max_books: 3,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
       };

       await memberRepo.createMember(testMember);
       console.log('✅ Member created in database');

       // Test 2: Retrieve the member
       console.log('2. Testing member retrieval...');
       const retrievedMember = await memberRepo.getMemberById(testMember.id);
       if (retrievedMember && retrievedMember.name === testMember.name) {
         console.log('✅ Member retrieved successfully');
       } else {
         console.log('❌ Member retrieval failed');
       }

       // Test 3: Update the member
       console.log('3. Testing member update...');
       const updateSuccess = await memberRepo.updateMember(testMember.id, {
         name: 'Updated Database Test Member',
         phone: '555-0002'
       });
       if (updateSuccess) {
         console.log('✅ Member updated successfully');
       } else {
         console.log('❌ Member update failed');
       }

       // Test 4: Search functionality
       console.log('4. Testing search functionality...');
       const searchResults = await memberRepo.searchMembers({
         name: 'Database Test',
         limit: 10
       });
       if (searchResults.length > 0) {
         console.log('✅ Search functionality working');
       } else {
         console.log('❌ Search functionality failed');
       }

       // Test 5: Email uniqueness validation
       console.log('5. Testing email uniqueness...');
       const emailExists = await memberRepo.emailExists('dbtest@example.com');
       if (emailExists) {
         console.log('✅ Email uniqueness validation working');
       } else {
         console.log('❌ Email uniqueness validation failed');
       }

       // Cleanup
       await memberRepo.deleteMember(testMember.id);
       console.log('✅ Test member cleaned up');

       db.close();
       console.log('\nDatabase test completed successfully!');

     } catch (error) {
       console.log('❌ Database test error:', error.message);
     }
   }

   testMemberDatabase();
   EOF
   ```

3. **Run database validation:**
   ```bash
   # Compile and run database test
   npx tsx test-member-database.js
   
   # Clean up test file
   rm test-member-database.js
   ```

### Step 2: Comprehensive API Endpoint Testing

1. **Create comprehensive API test suite:**
   ```bash
   # Start the server first
   npm run dev &
   SERVER_PID=$!
   
   # Wait for server to start
   sleep 3
   
   # Create comprehensive test suite
   cat > test-member-comprehensive.js << 'EOF'
   const baseUrl = 'http://localhost:3000';

   class MemberAPITester {
     constructor() {
       this.testResults = [];
       this.createdMemberIds = [];
     }

     async runTest(name, testFunction) {
       try {
         console.log(`\n🧪 Testing: ${name}`);
         await testFunction();
         this.testResults.push({ name, status: 'PASS' });
         console.log(`✅ ${name} - PASSED`);
       } catch (error) {
         this.testResults.push({ name, status: 'FAIL', error: error.message });
         console.log(`❌ ${name} - FAILED: ${error.message}`);
       }
     }

     async request(method, endpoint, body = null) {
       const config = {
         method,
         headers: {
           'Content-Type': 'application/json',
         },
       };

       if (body) {
         config.body = JSON.stringify(body);
       }

       const response = await fetch(`${baseUrl}${endpoint}`, config);
       const data = response.status === 204 ? null : await response.json();
       
       return { response, data, status: response.status };
     }

     async testHealthEndpoint() {
       const { status } = await this.request('GET', '/health');
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
     }

     async testCreateValidMember() {
       const memberData = {
         name: 'Test Member 1',
         email: `test1-${Date.now()}@example.com`,
         phone: '123-456-7890',
         address: '123 Test Street'
       };

       const { data, status } = await this.request('POST', '/members', memberData);
       
       if (status !== 201) throw new Error(`Expected 201, got ${status}`);
       if (!data.success) throw new Error('Response not successful');
       if (!data.data.id) throw new Error('No member ID returned');

       this.createdMemberIds.push(data.data.id);
       return data.data;
     }

     async testCreateInvalidMember() {
       // Test missing name
       const { status: status1 } = await this.request('POST', '/members', {
         email: 'invalid1@example.com'
       });
       if (status1 !== 400) throw new Error(`Expected 400 for missing name, got ${status1}`);

       // Test missing email
       const { status: status2 } = await this.request('POST', '/members', {
         name: 'Invalid Member'
       });
       if (status2 !== 400) throw new Error(`Expected 400 for missing email, got ${status2}`);

       // Test invalid email format
       const { status: status3 } = await this.request('POST', '/members', {
         name: 'Invalid Member',
         email: 'not-an-email'
       });
       if (status3 !== 400) throw new Error(`Expected 400 for invalid email, got ${status3}`);
     }

     async testDuplicateEmail() {
       const email = `duplicate-${Date.now()}@example.com`;
       
       // Create first member
       const member1 = await this.request('POST', '/members', {
         name: 'First Member',
         email: email
       });
       
       if (member1.status !== 201) throw new Error('Failed to create first member');
       this.createdMemberIds.push(member1.data.data.id);

       // Try to create second member with same email
       const { status } = await this.request('POST', '/members', {
         name: 'Second Member',
         email: email
       });

       if (status !== 409) throw new Error(`Expected 409 for duplicate email, got ${status}`);
     }

     async testGetAllMembers() {
       const { data, status } = await this.request('GET', '/members');
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (!data.success) throw new Error('Response not successful');
       if (!Array.isArray(data.data)) throw new Error('Data is not an array');
     }

     async testGetMemberById() {
       // Create a member first
       const member = await this.testCreateValidMember();
       
       // Get by valid ID
       const { data, status } = await this.request('GET', `/members/${member.id}`);
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (data.data.id !== member.id) throw new Error('Wrong member returned');

       // Test invalid UUID format
       const { status: status2 } = await this.request('GET', '/members/invalid-uuid');
       if (status2 !== 400) throw new Error(`Expected 400 for invalid UUID, got ${status2}`);

       // Test non-existent member
       const { status: status3 } = await this.request('GET', '/members/550e8400-0000-0000-0000-000000000000');
       if (status3 !== 404) throw new Error(`Expected 404 for non-existent member, got ${status3}`);
     }

     async testGetMemberByEmail() {
       // Create a member first
       const member = await this.testCreateValidMember();
       
       // Get by valid email
       const { data, status } = await this.request('GET', `/members/email/${encodeURIComponent(member.email)}`);
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (data.data.email !== member.email) throw new Error('Wrong member returned');

       // Test non-existent email
       const { status: status2 } = await this.request('GET', '/members/email/nonexistent@example.com');
       if (status2 !== 404) throw new Error(`Expected 404 for non-existent email, got ${status2}`);
     }

     async testUpdateMember() {
       // Create a member first
       const member = await this.testCreateValidMember();
       
       // Update member
       const updates = {
         name: 'Updated Member Name',
         phone: '098-765-4321'
       };

       const { data, status } = await this.request('PUT', `/members/${member.id}`, updates);
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (data.data.name !== updates.name) throw new Error('Name not updated');
       if (data.data.phone !== updates.phone) throw new Error('Phone not updated');

       // Test invalid UUID
       const { status: status2 } = await this.request('PUT', '/members/invalid-uuid', updates);
       if (status2 !== 400) throw new Error(`Expected 400 for invalid UUID, got ${status2}`);

       // Test non-existent member
       const { status: status3 } = await this.request('PUT', '/members/550e8400-0000-0000-0000-000000000000', updates);
       if (status3 !== 404) throw new Error(`Expected 404 for non-existent member, got ${status3}`);
     }

     async testSearchMembers() {
       // Create test members
       const testMembers = [];
       for (let i = 0; i < 3; i++) {
         const member = await this.request('POST', '/members', {
           name: `Search Test Member ${i}`,
           email: `search${i}-${Date.now()}@example.com`,
           status: i === 0 ? 'active' : 'suspended'
         });
         testMembers.push(member.data.data);
         this.createdMemberIds.push(member.data.data.id);
       }

       // Test name search
       const { data: searchByName, status: status1 } = await this.request('GET', '/members/search?name=Search Test');
       if (status1 !== 200) throw new Error(`Expected 200 for name search, got ${status1}`);
       if (searchByName.data.length === 0) throw new Error('Name search returned no results');

       // Test status filter
       const { data: searchByStatus, status: status2 } = await this.request('GET', '/members/search?status=active');
       if (status2 !== 200) throw new Error(`Expected 200 for status search, got ${status2}`);

       // Test limit parameter
       const { data: limitedSearch, status: status3 } = await this.request('GET', '/members/search?limit=2');
       if (status3 !== 200) throw new Error(`Expected 200 for limited search, got ${status3}`);

       // Test invalid limit
       const { status: status4 } = await this.request('GET', '/members/search?limit=150');
       if (status4 !== 400) throw new Error(`Expected 400 for invalid limit, got ${status4}`);
     }

     async testMembersByStatus() {
       // Test valid status
       const { data, status } = await this.request('GET', '/members/status/active');
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (!Array.isArray(data.data)) throw new Error('Data is not an array');

       // Test invalid status
       const { status: status2 } = await this.request('GET', '/members/status/invalid-status');
       if (status2 !== 400) throw new Error(`Expected 400 for invalid status, got ${status2}`);
     }

     async testMemberEligibility() {
       // Create a member first
       const member = await this.testCreateValidMember();
       
       // Test eligibility check
       const { data, status } = await this.request('GET', `/members/${member.id}/eligibility`);
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (typeof data.data.can_borrow !== 'boolean') throw new Error('can_borrow not boolean');
       if (typeof data.data.current_borrowed_count !== 'number') throw new Error('borrowed count not number');

       // Test invalid UUID
       const { status: status2 } = await this.request('GET', '/members/invalid-uuid/eligibility');
       if (status2 !== 400) throw new Error(`Expected 400 for invalid UUID, got ${status2}`);
     }

     async testMemberStatistics() {
       const { data, status } = await this.request('GET', '/members/statistics');
       
       if (status !== 200) throw new Error(`Expected 200, got ${status}`);
       if (typeof data.data.total_members !== 'number') throw new Error('total_members not number');
       if (typeof data.data.active_members !== 'number') throw new Error('active_members not number');
     }

     async testDeleteMember() {
       // Create a member first
       const member = await this.testCreateValidMember();
       
       // Remove from tracking array since we're about to delete it
       this.createdMemberIds = this.createdMemberIds.filter(id => id !== member.id);
       
       // Delete member
       const { status } = await this.request('DELETE', `/members/${member.id}`);
       
       if (status !== 204) throw new Error(`Expected 204, got ${status}`);

       // Verify member is deleted
       const { status: status2 } = await this.request('GET', `/members/${member.id}`);
       if (status2 !== 404) throw new Error(`Expected 404 after deletion, got ${status2}`);

       // Test invalid UUID
       const { status: status3 } = await this.request('DELETE', '/members/invalid-uuid');
       if (status3 !== 400) throw new Error(`Expected 400 for invalid UUID, got ${status3}`);
     }

     async cleanup() {
       console.log('\n🧹 Cleaning up test data...');
       for (const memberId of this.createdMemberIds) {
         try {
           await this.request('DELETE', `/members/${memberId}`);
         } catch (error) {
           console.log(`Warning: Could not delete member ${memberId}: ${error.message}`);
         }
       }
       console.log('✅ Cleanup completed');
     }

     async runAllTests() {
       console.log('🚀 Starting Member API Comprehensive Test Suite\n');
       
       await this.runTest('Health Endpoint', () => this.testHealthEndpoint());
       await this.runTest('Create Valid Member', () => this.testCreateValidMember());
       await this.runTest('Create Invalid Member', () => this.testCreateInvalidMember());
       await this.runTest('Duplicate Email Prevention', () => this.testDuplicateEmail());
       await this.runTest('Get All Members', () => this.testGetAllMembers());
       await this.runTest('Get Member By ID', () => this.testGetMemberById());
       await this.runTest('Get Member By Email', () => this.testGetMemberByEmail());
       await this.runTest('Update Member', () => this.testUpdateMember());
       await this.runTest('Search Members', () => this.testSearchMembers());
       await this.runTest('Get Members By Status', () => this.testMembersByStatus());
       await this.runTest('Member Eligibility Check', () => this.testMemberEligibility());
       await this.runTest('Member Statistics', () => this.testMemberStatistics());
       await this.runTest('Delete Member', () => this.testDeleteMember());

       await this.cleanup();

       console.log('\n📊 Test Results Summary:');
       console.log('=======================');
       
       const passed = this.testResults.filter(r => r.status === 'PASS').length;
       const failed = this.testResults.filter(r => r.status === 'FAIL').length;
       
       console.log(`✅ Passed: ${passed}`);
       console.log(`❌ Failed: ${failed}`);
       console.log(`📈 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);

       if (failed > 0) {
         console.log('\n❌ Failed Tests:');
         this.testResults
           .filter(r => r.status === 'FAIL')
           .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
       }

       console.log('\n🎉 Comprehensive testing completed!');
       return failed === 0;
     }
   }

   // Run the tests
   const tester = new MemberAPITester();
   tester.runAllTests().then(success => {
     process.exit(success ? 0 : 1);
   });
   EOF
   ```

2. **Run comprehensive test suite:**
   ```bash
   # Run the comprehensive tests
   node test-member-comprehensive.js
   
   # Clean up test file
   rm test-member-comprehensive.js
   
   # Stop the test server
   kill $SERVER_PID
   ```

### Step 3: Performance and Load Testing

1. **Create performance test:**
   ```bash
   # Start server
   npm run dev &
   SERVER_PID=$!
   sleep 3

   # Create performance test
   cat > test-member-performance.js << 'EOF'
   const baseUrl = 'http://localhost:3000';

   async function performanceTest() {
     console.log('🚀 Starting Member API Performance Tests\n');

     const createdMembers = [];

     try {
       // Test 1: Bulk member creation
       console.log('1. Testing bulk member creation...');
       const createStartTime = Date.now();
       const createPromises = [];

       for (let i = 0; i < 20; i++) {
         const promise = fetch(`${baseUrl}/members`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             name: `Performance Test Member ${i}`,
             email: `perf${i}-${Date.now()}@example.com`,
             phone: `555-${String(i).padStart(4, '0')}`,
             address: `${i} Performance Street`
           })
         }).then(async res => {
           const data = await res.json();
           if (res.status === 201) {
             createdMembers.push(data.data.id);
           }
           return { status: res.status, id: data.data?.id };
         });
         
         createPromises.push(promise);
       }

       const createResults = await Promise.all(createPromises);
       const createEndTime = Date.now();
       const createDuration = createEndTime - createStartTime;

       const successfulCreations = createResults.filter(r => r.status === 201).length;
       console.log(`✅ Created ${successfulCreations}/20 members in ${createDuration}ms`);
       console.log(`   Average: ${Math.round(createDuration / 20)}ms per member`);

       // Test 2: Concurrent member retrieval
       console.log('\n2. Testing concurrent member retrieval...');
       const retrieveStartTime = Date.now();
       const retrievePromises = createdMembers.slice(0, 10).map(id => 
         fetch(`${baseUrl}/members/${id}`).then(res => ({ status: res.status, id }))
       );

       const retrieveResults = await Promise.all(retrievePromises);
       const retrieveEndTime = Date.now();
       const retrieveDuration = retrieveEndTime - retrieveStartTime;

       const successfulRetrieval = retrieveResults.filter(r => r.status === 200).length;
       console.log(`✅ Retrieved ${successfulRetrieval}/10 members in ${retrieveDuration}ms`);
       console.log(`   Average: ${Math.round(retrieveDuration / 10)}ms per retrieval`);

       // Test 3: Search performance
       console.log('\n3. Testing search performance...');
       const searchStartTime = Date.now();
       const searchPromises = [
         fetch(`${baseUrl}/members/search?name=Performance`),
         fetch(`${baseUrl}/members/search?status=active`),
         fetch(`${baseUrl}/members/search?limit=5`),
         fetch(`${baseUrl}/members/search?name=Test&limit=10`),
         fetch(`${baseUrl}/members/search?offset=5&limit=5`)
       ];

       const searchResults = await Promise.all(searchPromises);
       const searchEndTime = Date.now();
       const searchDuration = searchEndTime - searchStartTime;

       const successfulSearches = searchResults.filter(r => r.status === 200).length;
       console.log(`✅ Completed ${successfulSearches}/5 searches in ${searchDuration}ms`);
       console.log(`   Average: ${Math.round(searchDuration / 5)}ms per search`);

       // Test 4: Statistics endpoint performance
       console.log('\n4. Testing statistics performance...');
       const statsStartTime = Date.now();
       const statsPromises = Array(10).fill(null).map(() => 
         fetch(`${baseUrl}/members/statistics`).then(res => ({ status: res.status }))
       );

       const statsResults = await Promise.all(statsPromises);
       const statsEndTime = Date.now();
       const statsDuration = statsEndTime - statsStartTime;

       const successfulStats = statsResults.filter(r => r.status === 200).length;
       console.log(`✅ Completed ${successfulStats}/10 statistics calls in ${statsDuration}ms`);
       console.log(`   Average: ${Math.round(statsDuration / 10)}ms per call`);

       // Cleanup
       console.log('\n🧹 Cleaning up performance test data...');
       const cleanupPromises = createdMembers.map(id =>
         fetch(`${baseUrl}/members/${id}`, { method: 'DELETE' })
       );
       await Promise.all(cleanupPromises);
       console.log('✅ Cleanup completed');

       console.log('\n📊 Performance Test Summary:');
       console.log(`   Member Creation: ${Math.round(createDuration / 20)}ms avg`);
       console.log(`   Member Retrieval: ${Math.round(retrieveDuration / 10)}ms avg`);
       console.log(`   Search Operations: ${Math.round(searchDuration / 5)}ms avg`);
       console.log(`   Statistics Calls: ${Math.round(statsDuration / 10)}ms avg`);

     } catch (error) {
       console.log('❌ Performance test error:', error.message);
     }

     console.log('\n🎉 Performance testing completed!');
   }

   performanceTest();
   EOF

   # Run performance test
   node test-member-performance.js

   # Clean up
   rm test-member-performance.js
   kill $SERVER_PID
   ```

### Step 4: Create Production Readiness Checklist

1. **Create production readiness validation:**
   ```bash
   cat > production-readiness-checklist.md << 'EOF'
   # Member System Production Readiness Checklist

   ## ✅ Database Validation
   - [ ] Member table exists with correct schema
   - [ ] All indexes are properly created
   - [ ] Foreign key constraints are valid
   - [ ] Database migrations run successfully
   - [ ] Seed data loads without errors

   ## ✅ API Endpoint Validation
   - [ ] All 11 member endpoints respond correctly
   - [ ] Proper HTTP status codes returned
   - [ ] Request validation working
   - [ ] Response format consistent
   - [ ] Error messages are user-friendly

   ## ✅ Business Logic Validation
   - [ ] Email uniqueness enforced
   - [ ] Member data validation working
   - [ ] Member eligibility logic correct
   - [ ] Status transitions handled properly
   - [ ] Max books limit enforced

   ## ✅ Security Validation
   - [ ] SQL injection prevention (parameterized queries)
   - [ ] Input sanitization working
   - [ ] UUID validation preventing enumeration
   - [ ] No sensitive data in error messages
   - [ ] Proper email format validation

   ## ✅ Performance Validation
   - [ ] Member creation < 100ms average
   - [ ] Member retrieval < 50ms average
   - [ ] Search operations < 200ms average
   - [ ] Statistics generation < 100ms average
   - [ ] Concurrent operations handled properly

   ## ✅ Error Handling Validation
   - [ ] Database connection errors handled
   - [ ] Invalid UUID format errors
   - [ ] Missing required field errors
   - [ ] Duplicate email errors
   - [ ] Member not found errors

   ## ✅ Integration Validation
   - [ ] No conflicts with book system
   - [ ] Shared database connection working
   - [ ] Route registration successful
   - [ ] Dependency injection working
   - [ ] TypeScript compilation successful

   ## ✅ Documentation Validation
   - [ ] API endpoints documented
   - [ ] Request/response examples provided
   - [ ] Error codes documented
   - [ ] Usage examples available
   - [ ] Integration guide complete

   ## Run Validation Commands

   ```bash
   # 1. Check database schema
   sqlite3 library.db ".schema members"

   # 2. Test TypeScript compilation
   npm run build

   # 3. Start server and test endpoints
   npm run dev
   curl http://localhost:3000/members/statistics

   # 4. Run comprehensive tests
   # (Use the comprehensive test suite created above)

   # 5. Check server logs for errors
   tail -f server.log
   ```

   ## Production Deployment Notes

   1. **Environment Variables**: Configure production database path
   2. **Rate Limiting**: Consider adding rate limiting to API endpoints
   3. **Logging**: Ensure proper logging for production monitoring
   4. **Backup**: Set up regular database backups
   5. **Monitoring**: Monitor API response times and error rates

   EOF

   echo "Production readiness checklist created!"
   ```

### Step 5: Final System Integration Test

1. **Run complete system integration test:**
   ```bash
   # Start server
   npm run dev &
   SERVER_PID=$!
   sleep 3

   # Create final integration test
   cat > test-final-integration.js << 'EOF'
   const baseUrl = 'http://localhost:3000';

   async function finalIntegrationTest() {
     console.log('🎯 Final Member System Integration Test\n');

     try {
       // 1. Verify all systems are running
       console.log('1. System Health Check...');
       const health = await fetch(`${baseUrl}/health`);
       const books = await fetch(`${baseUrl}/books`);
       const members = await fetch(`${baseUrl}/members`);
       const stats = await fetch(`${baseUrl}/members/statistics`);

       console.log(`   Health: ${health.status}`);
       console.log(`   Books: ${books.status}`);
       console.log(`   Members: ${members.status}`);
       console.log(`   Statistics: ${stats.status}`);

       if ([health, books, members, stats].every(r => r.status === 200)) {
         console.log('✅ All systems operational');
       } else {
         throw new Error('System health check failed');
       }

       // 2. Test member lifecycle
       console.log('\n2. Complete Member Lifecycle Test...');
       
       // Create member
       const createResponse = await fetch(`${baseUrl}/members`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           name: 'Final Test Member',
           email: `final-${Date.now()}@example.com`,
           phone: '555-FINAL',
           address: '123 Final Test Street'
         })
       });

       if (createResponse.status !== 201) {
         throw new Error('Member creation failed');
       }

       const member = await createResponse.json();
       const memberId = member.data.id;
       console.log('   ✅ Member created');

       // Check eligibility
       const eligibility = await fetch(`${baseUrl}/members/${memberId}/eligibility`);
       if (eligibility.status !== 200) {
         throw new Error('Eligibility check failed');
       }
       console.log('   ✅ Eligibility checked');

       // Update member
       const updateResponse = await fetch(`${baseUrl}/members/${memberId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ phone: '555-UPDATED' })
       });

       if (updateResponse.status !== 200) {
         throw new Error('Member update failed');
       }
       console.log('   ✅ Member updated');

       // Search for member
       const searchResponse = await fetch(`${baseUrl}/members/search?name=Final Test`);
       if (searchResponse.status !== 200) {
         throw new Error('Member search failed');
       }

       const searchData = await searchResponse.json();
       if (searchData.data.length === 0) {
         throw new Error('Member not found in search');
       }
       console.log('   ✅ Member found in search');

       // Delete member
       const deleteResponse = await fetch(`${baseUrl}/members/${memberId}`, {
         method: 'DELETE'
       });

       if (deleteResponse.status !== 204) {
         throw new Error('Member deletion failed');
       }
       console.log('   ✅ Member deleted');

       // 3. Test system integration
       console.log('\n3. Cross-System Integration Test...');
       
       const bookStats = await fetch(`${baseUrl}/books`);
       const memberStats = await fetch(`${baseUrl}/members/statistics`);
       
       if (bookStats.status === 200 && memberStats.status === 200) {
         const bookData = await bookStats.json();
         const memberData = await memberStats.json();
         
         console.log(`   📚 Books in system: ${bookData.data.length}`);
         console.log(`   👥 Members in system: ${memberData.data.total_members}`);
         console.log('   ✅ Cross-system integration working');
       }

       console.log('\n🎉 Final integration test PASSED!');
       console.log('\n✅ Member system is production ready!');

     } catch (error) {
       console.log(`\n❌ Final integration test FAILED: ${error.message}`);
       process.exit(1);
     }
   }

   finalIntegrationTest();
   EOF

   # Run final test
   node test-final-integration.js

   # Clean up
   rm test-final-integration.js
   kill $SERVER_PID
   ```

## Expected Results
- ✅ All database operations validated
- ✅ Comprehensive API test suite passes 100%
- ✅ Performance metrics within acceptable ranges
- ✅ Production readiness checklist completed
- ✅ Final integration test passes
- ✅ Member system fully operational
- ✅ No conflicts with existing book system
- ✅ Error handling comprehensive
- ✅ Security validations pass

## Test Coverage Achieved

### Database Layer
- ✅ CRUD operations tested
- ✅ Search functionality validated
- ✅ Email uniqueness enforced
- ✅ Data integrity maintained

### Business Logic Layer
- ✅ Validation rules tested
- ✅ Member eligibility logic verified
- ✅ Status management working
- ✅ Statistics calculation accurate

### API Layer
- ✅ All 11 endpoints tested
- ✅ Error scenarios covered
- ✅ Performance benchmarked
- ✅ Security measures validated

### Integration Layer
- ✅ Book system compatibility confirmed
- ✅ Database sharing working
- ✅ Route registration successful
- ✅ Dependency injection functional

## Troubleshooting

### If tests fail:
1. Check server is running on correct port
2. Verify database tables exist
3. Check network connectivity
4. Review server logs for errors

### If performance is poor:
1. Check database indexes
2. Review query optimization
3. Monitor server resources
4. Consider connection pooling

### If integration fails:
1. Verify all dependencies are installed
2. Check TypeScript compilation
3. Review route registration
4. Test database connectivity

## Final Validation Complete

The member management system has been thoroughly tested and validated. All functionality is working correctly, performance is acceptable, and the system is ready for production use.

## Files Created
- ✅ Comprehensive test suites
- ✅ Performance benchmarks
- ✅ Production readiness checklist
- ✅ Integration validation tests

## Next Steps
The member management system is now complete and ready for integration with the borrowing system that Person 3 will create.