#!/usr/bin/env node

/**
 * Member Search Test Script
 * 
 * This script demonstrates the member search functionality.
 * Run this after starting the server with `npm run dev`
 * 
 * Usage:
 *   node test-member-search.js
 */

const BASE_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('Request failed:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testMemberSearch() {
  console.log('🔍 Testing Member Search Functionality\n');
  
  // Test 1: Get all members
  console.log('1. Getting all members...');
  const allMembers = await makeRequest(`${BASE_URL}/api/members`);
  console.log(`Status: ${allMembers.status}`);
  console.log(`Found ${allMembers.data.data ? allMembers.data.data.length : 0} members\n`);
  
  // Test 2: Search by name
  console.log('2. Searching members by name (query: "john")...');
  const nameSearch = await makeRequest(`${BASE_URL}/api/members?name=john`);
  console.log(`Status: ${nameSearch.status}`);
  console.log(`Results: ${nameSearch.data.total || 0} members found\n`);
  
  // Test 3: General text search
  console.log('3. General text search (query: "smith")...');
  const textSearch = await makeRequest(`${BASE_URL}/api/members?q=smith`);
  console.log(`Status: ${textSearch.status}`);
  console.log(`Results: ${textSearch.data.total || 0} members found\n`);
  
  // Test 4: Search with pagination
  console.log('4. Paginated search (page 1, size 5)...');
  const paginatedSearch = await makeRequest(`${BASE_URL}/api/members?page=1&pageSize=5&sortBy=memberName`);
  console.log(`Status: ${paginatedSearch.status}`);
  console.log(`Results: ${paginatedSearch.data.data ? paginatedSearch.data.data.length : 0} members on page 1\n`);
  
  // Test 5: Search by email
  console.log('5. Searching by email pattern (query: "@gmail")...');
  const emailSearch = await makeRequest(`${BASE_URL}/api/members?email=gmail`);
  console.log(`Status: ${emailSearch.status}`);
  console.log(`Results: ${emailSearch.data.total || 0} members found\n`);
  
  // Test 6: Create a test member (to have data to search)
  console.log('6. Creating a test member...');
  const newMember = await makeRequest(`${BASE_URL}/api/members`, {
    method: 'POST',
    body: JSON.stringify({
      memberName: 'John Smith Test',
      email: 'john.smith.test@example.com',
      phone: '555-0123',
      memAddress: '123 Test Street'
    })
  });
  console.log(`Status: ${newMember.status}`);
  if (newMember.data.data) {
    console.log(`Created member: ${newMember.data.data.memberName} (${newMember.data.data.email})\n`);
    
    // Test 7: Search for the created member
    console.log('7. Searching for the created member...');
    const searchCreated = await makeRequest(`${BASE_URL}/api/members?q=John Smith Test`);
    console.log(`Status: ${searchCreated.status}`);
    console.log(`Found: ${searchCreated.data.total || 0} matching members\n`);
  }
  
  console.log('✅ Member search tests completed!');
  console.log('\n📖 Available Search Options:');
  console.log('   • GET /api/members - Get all members');
  console.log('   • GET /api/members?q=search_term - General search');
  console.log('   • GET /api/members?name=name_pattern - Search by name');
  console.log('   • GET /api/members?email=email_pattern - Search by email');
  console.log('   • GET /api/members?phone=phone_pattern - Search by phone');
  console.log('   • GET /api/members?sortBy=memberName&sortOrder=desc - Sorting');
  console.log('   • GET /api/members?page=1&pageSize=10 - Pagination');
  console.log('   • GET /api/members/:id - Get specific member');
  console.log('   • GET /api/members/email/:email - Get member by email');
}

// Run tests
testMemberSearch().catch(console.error);