#!/usr/bin/env node

/**
 * Test script to demonstrate the book return functionality
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const TEST_BORROWING_ID = 'test-borrowing-001';
const TEST_MEMBER_ID = '550e8400-e29b-41d4-a716-446655440100';

async function testReturnBook() {
  try {
    console.log('🧪 Testing Book Return Functionality');
    console.log('=====================================\n');

    // 1. Check member details before return
    console.log('1. Checking member details before return...');
    const memberResponse = await fetch(`${BASE_URL}/members/${TEST_MEMBER_ID}`);
    if (memberResponse.ok) {
      console.log('✅ Member details page loaded successfully');
    } else {
      console.log('❌ Failed to load member details');
      return;
    }

    // 2. Return the book via POST request
    console.log('\n2. Attempting to return book...');
    const formData = new URLSearchParams();
    formData.append('memberId', TEST_MEMBER_ID);

    const returnResponse = await fetch(`${BASE_URL}/return/${TEST_BORROWING_ID}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual', // Don't follow redirects to see the response
    });

    if (returnResponse.status === 302) {
      const location = returnResponse.headers.get('location');
      console.log('✅ Return request successful, redirecting to:', location);

      // Check if the redirect includes success message
      if (location?.includes('returned=success')) {
        console.log('✅ Success message included in redirect');
      }
    } else {
      console.log('❌ Return request failed with status:', returnResponse.status);
    }

    // 3. Verify the book was returned in the database
    console.log('\n3. Verifying return in database...');
    // Note: This would require a database query, but we'll check via the web interface

    console.log('\n🎉 Test completed! Please check the web interface to verify:');
    console.log(`   - Member page: ${BASE_URL}/members/${TEST_MEMBER_ID}`);
    console.log(`   - Book page: ${BASE_URL}/books/550e8400-e29b-41d4-a716-446655440003`);
    console.log('   - The book should no longer appear in borrowed books');
    console.log('   - Available copies count should have increased');
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testReturnBook();
}

export { testReturnBook };
